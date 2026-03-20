#!/usr/bin/env bash
set -euo pipefail

PHASE_NAME="${1:-}"
ISSUE="${2:-failed validation}"

if [[ -z "$PHASE_NAME" ]]; then
  echo "Usage: ./scripts/phase-fail.sh \"Phase 4 — Tool Interception Layer\" \"issue\""
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
text = text[:status_start] + "status: FAILED" + text[status_end:]

log_anchor = "## Entries\n\n-"
if log_anchor in text:
    idx = text.index(log_anchor) + len("## Entries\n\n")
    entry = f"- {NOW} — {PHASE_NAME} — FAILED\n  Summary: {ISSUE}\n  Details:\n\n"
    text = text[:idx] + entry + text[idx:]

text = text.replace(
    next(line for line in text.splitlines() if line.startswith("last_updated:")),
    f"last_updated: {NOW}"
)

p.write_text(text)
PY

echo "Failed phase: $PHASE_NAME"