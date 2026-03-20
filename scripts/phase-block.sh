#!/usr/bin/env bash
set -euo pipefail

PHASE_NAME="${1:-}"
ISSUE="${2:-blocked}"
SEVERITY="${3:-high}"

if [[ -z "$PHASE_NAME" ]]; then
  echo "Usage: ./scripts/phase-block.sh \"Phase 3 — Gateway Migration\" \"issue\" [severity]"
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
text = text[:status_start] + "status: BLOCKED" + text[status_end:]

issues_anchor = "## Issues\n\n-"
if issues_anchor in text:
    idx = text.index(issues_anchor) + len("## Issues\n\n")
    block = (
        f"- phase: {PHASE_NAME}\n"
        f"  issue: {ISSUE}\n"
        f"  severity: {SEVERITY}\n"
        f"  detected_in: {NOW}\n"
        f"  action_required: investigate and narrow scope\n"
        f"  owner: operator\n"
        f"  status: open\n\n"
    )
    text = text[:idx] + block + text[idx:]

text = text.replace(
    next(line for line in text.splitlines() if line.startswith("last_updated:")),
    f"last_updated: {NOW}"
)

p.write_text(text)
PY

echo "Blocked phase: $PHASE_NAME"