#!/usr/bin/env bash
set -euo pipefail

PHASE_NAME="${1:-}"
CONTROL_FILE="${2:-control.md}"

if [[ -z "$PHASE_NAME" ]]; then
  echo "Usage: ./scripts/phase-start.sh \"Phase 0 — Discovery Only\" [control-file]"
  exit 1
fi

test -f phase-status.md
test -f "$CONTROL_FILE"

CURRENT_PHASE_LINE=$(grep -n '^current_phase:' phase-status.md | cut -d: -f1)
CURRENT_CONTROL_LINE=$(grep -n '^current_control_file:' phase-status.md | cut -d: -f1)
LAST_UPDATED_LINE=$(grep -n '^last_updated:' phase-status.md | cut -d: -f1)

NOW=$(date '+%Y-%m-%d %H:%M')

python3 - <<PY
from pathlib import Path
p = Path("phase-status.md")
text = p.read_text()

text = text.replace(
    next(line for line in text.splitlines() if line.startswith("current_phase:")),
    f"current_phase: {PHASE_NAME}"
)
text = text.replace(
    next(line for line in text.splitlines() if line.startswith("current_control_file:")),
    f"current_control_file: {CONTROL_FILE}"
)
text = text.replace(
    next(line for line in text.splitlines() if line.startswith("last_updated:")),
    f"last_updated: {NOW}"
)

target = f"## {PHASE_NAME}"
if target not in text:
    raise SystemExit(f"Phase section not found: {PHASE_NAME}")

section_start = text.index(target)
status_start = text.index("status:", section_start)
status_end = text.index("\n", status_start)
text = text[:status_start] + "status: IN_PROGRESS" + text[status_end:]

p.write_text(text)
PY

echo "Started phase: $PHASE_NAME using $CONTROL_FILE"