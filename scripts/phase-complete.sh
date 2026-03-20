#!/usr/bin/env bash
set -euo pipefail

PHASE_NAME="${1:-}"
NOTE="${2:-completed and validated}"

if [[ -z "$PHASE_NAME" ]]; then
  echo "Usage: ./scripts/phase-complete.sh \"Phase 0 — Discovery Only\" \"note\""
  exit 1
fi

test -f phase-status.md

NOW=$(date '+%Y-%m-%d %H:%M')

python3 - <<PY
from pathlib import Path
p = Path("phase-status.md")
text = p.read_text()

target = f"## {PHASE_NAME}"
if target not in text:
    raise SystemExit(f"Phase section not found: {PHASE_NAME}")

section_start = text.index(target)
status_start = text.index("status:", section_start)
status_end = text.index("\n", status_start)
text = text[:status_start] + "status: COMPLETE" + text[status_end:]

notes_marker = "notes:\n-"
if notes_marker in text[section_start:]:
    local_start = text.index(notes_marker, section_start)
    local_end = local_start + len(notes_marker)
    text = text[:local_end] + f"\n- {NOTE}" + text[local_end:]

log_anchor = "## Entries\n\n-"
if log_anchor in text:
    idx = text.index(log_anchor) + len("## Entries\n\n")
    entry = f"- {NOW} — {PHASE_NAME} — COMPLETE\n  Summary: {NOTE}\n  Details:\n\n"
    text = text[:idx] + entry + text[idx:]

text = text.replace(
    next(line for line in text.splitlines() if line.startswith("last_updated:")),
    f"last_updated: {NOW}"
)

p.write_text(text)
PY

echo "Completed phase: $PHASE_NAME"