#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-development}"

case "$TARGET_ENV" in
  development)
    CONTROL_FILE="control.md"
    ;;
  staging)
    CONTROL_FILE="control.staging.md"
    ;;
  production)
    CONTROL_FILE="control.production.md"
    ;;
  *)
    echo "Unknown environment: $TARGET_ENV"
    exit 1
    ;;
esac

if [[ ! -f "$CONTROL_FILE" ]]; then
  echo "Missing control file: $CONTROL_FILE"
  exit 1
fi

cp "$CONTROL_FILE" .active-control.md
echo "Selected control file: $CONTROL_FILE"