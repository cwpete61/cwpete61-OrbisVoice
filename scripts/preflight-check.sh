#!/usr/bin/env bash
set -euo pipefail

TARGET_ENV="${1:-development}"

echo "Running preflight for: $TARGET_ENV"

test -f "_00 READ.md"
test -f "README.md"
test -f ".active-control.md"

if [[ "$TARGET_ENV" == "production" ]]; then
  grep -q "environment: production" .active-control.md
fi

if [[ "$TARGET_ENV" == "staging" ]]; then
  grep -q "environment: staging" .active-control.md
fi

echo "Preflight checks passed."