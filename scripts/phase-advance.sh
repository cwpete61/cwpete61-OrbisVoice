#!/usr/bin/env bash
set -euo pipefail

NOTE="${1:-Validated and complete}"
CONTROL_FILE="${2:-control.md}"

if [[ ! -f "phase-status.md" ]]; then
  echo "Missing phase-status.md"
  exit 1
fi

if [[ ! -f "$CONTROL_FILE" ]]; then
  echo "Missing control file: $CONTROL_FILE"
  exit 1
fi

CURRENT_PHASE=$(python3 - <<'PY'
from pathlib import Path
text = Path("phase-status.md").read_text().splitlines()
line = next((l for l in text if l.startswith("current_phase:")), None)
if not line:
    raise SystemExit("current_phase not found")
print(line.split(":", 1)[1].strip())
PY
)

if [[ -z "$CURRENT_PHASE" ]]; then
  echo "Could not resolve current phase"
  exit 1
fi

echo "Completing current phase: $CURRENT_PHASE"
./scripts/phase-complete.sh "$CURRENT_PHASE" "$NOTE"

NEXT_PHASE=$(./scripts/phase-next.sh || true)

if [[ -z "${NEXT_PHASE:-}" ]]; then
  echo "No next phase found. Regenerating next-command.md for current completed state."
  ./scripts/update-next-command.sh "$CONTROL_FILE"
  exit 0
fi

echo "Starting next phase: $NEXT_PHASE"
./scripts/phase-start.sh "$NEXT_PHASE" "$CONTROL_FILE"

echo "Updating next-command.md"
./scripts/update-next-command.sh "$CONTROL_FILE"

echo "Phase advanced successfully:"
echo "  Completed: $CURRENT_PHASE"
echo "  Started:   $NEXT_PHASE"
echo "  Control:   $CONTROL_FILE"