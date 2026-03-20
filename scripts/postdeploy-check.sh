#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-development}"

echo "Running post-deploy checks for: $TARGET_ENV"

# Replace these with real endpoints
VOICE_GATEWAY_HEALTH="${VOICE_GATEWAY_HEALTH:-http://localhost:8080/health}"
API_HEALTH="${API_HEALTH:-http://localhost:4000/health}"
WEB_HEALTH="${WEB_HEALTH:-http://localhost:3000/}"

curl -fsS "$VOICE_GATEWAY_HEALTH" >/dev/null
curl -fsS "$API_HEALTH" >/dev/null
curl -fsS "$WEB_HEALTH" >/dev/null

echo "Post-deploy health checks passed."