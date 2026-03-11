#!/bin/bash
# OrbisVoice VPS Deployment Script

set -e

PROJECT_DIR="/opt/orbisvoice"
COMPOSE_FILE="docker-compose.prod.yml"

echo "🚀 Starting OrbisVoice deployment on VPS..."

# 1. Navigate to project directory
if [ -d "$PROJECT_DIR" ]; then
    cd "$PROJECT_DIR"
else
    echo "❌ Error: Project directory $PROJECT_DIR not found."
    exit 1
fi

# 2. Pull latest images from GHCR
echo "📥 Pulling latest images..."
docker compose -f $COMPOSE_FILE pull

# 3. Restart services
echo "🔄 Restarting services..."
docker compose -f $COMPOSE_FILE up -d

# 4. Cleanup
echo "🧹 Cleaning up old images..."
docker system prune -f

echo "✅ Deployment complete!"
docker compose -f $COMPOSE_FILE ps
