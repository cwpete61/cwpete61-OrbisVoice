#!/bin/bash
# OrbisVoice Direct VPS Deploy Script
# Triggered by webhook-server.js on git push to master
# Replaces GitHub Actions CI/CD pipeline

set -euo pipefail

PROJECT_DIR="/opt/orbisvoice"
COMPOSE_FILE="docker-compose.prod.yml"
LOG_FILE="$PROJECT_DIR/deploy.log"
BRANCH="${DEPLOY_BRANCH:-master}"

log() {
  echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] $*" | tee -a "$LOG_FILE"
}

cd "$PROJECT_DIR"
log "=== OrbisVoice Deploy Starting ==="

# Load .env so docker-compose gets all secrets
if [ -f "$PROJECT_DIR/.env" ]; then
  set -a
  source "$PROJECT_DIR/.env"
  set +a
  log "Environment loaded from .env"
else
  log "WARNING: .env not found — secrets may be missing"
fi

# 1. Pull latest code
log "Pulling latest code from $BRANCH..."
git fetch origin
git reset --hard origin/$BRANCH
log "Code updated to $(git log -1 --format='%h %s')"

# 2. Build and restart all services
log "Building and restarting containers..."
docker compose -f "$COMPOSE_FILE" up -d --build --remove-orphans

# 3. Wait for API to be healthy
log "Waiting for API health check..."
MAX_WAIT=60
WAITED=0
until curl -sf http://localhost:4001/health > /dev/null 2>&1; do
  sleep 2
  WAITED=$((WAITED + 2))
  if [ $WAITED -ge $MAX_WAIT ]; then
    log "WARNING: API health check timed out after ${MAX_WAIT}s"
    break
  fi
done
[ $WAITED -lt $MAX_WAIT ] && log "API is healthy (took ${WAITED}s)"

# 4. Run database migrations
log "Running manual schema recovery fix..."
docker exec orbisvoice-api-prod node manual_schema_fix.js 2>&1 | tee -a "$LOG_FILE" || true

log "Syncing Primary API DB schema..."
docker exec orbisvoice-api-prod npx prisma db push --accept-data-loss 2>&1 | tee -a "$LOG_FILE" || \
  log "WARNING: API DB sync failed (non-fatal)"

log "Syncing Commerce DB schema..."
docker exec orbisvoice-commerce-agent-prod \
  npx prisma db push --schema=prisma/schema.prisma --accept-data-loss 2>&1 | tee -a "$LOG_FILE" || \
  log "WARNING: Commerce DB sync failed (non-fatal)"

# 5. Cleanup old images
log "Cleaning up unused images..."
docker system prune -f --filter "until=24h" >> "$LOG_FILE" 2>&1 || true

# 6. Final Nginx restart to ensure all upstreams are fresh
log "Restarting Nginx to clear any stale upstream DNS..."
docker restart orbisvoice-nginx-prod >> "$LOG_FILE" 2>&1 || true

# 7. Final status
log "Container status:"
docker compose -f "$COMPOSE_FILE" ps | tee -a "$LOG_FILE"
log "=== Deploy Complete ==="
