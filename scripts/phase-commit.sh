#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-checkpoint}"
PHASE_NAME="${2:-}"

if [[ -z "$PHASE_NAME" ]]; then
  echo "Usage: ./scripts/phase-commit.sh checkpoint|complete \"Phase X — Name\""
  exit 1
fi

SAFE_NAME=$(echo "$PHASE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')

git add .
git commit -m "${MODE}-${SAFE_NAME}"
echo "Created git commit: ${MODE}-${SAFE_NAME}"