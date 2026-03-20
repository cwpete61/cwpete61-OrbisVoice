#!/usr/bin/env bash
set -euo pipefail

python3 - <<'PY'
from pathlib import Path
import re

text = Path("phase-status.md").read_text()

phases = re.findall(r"## (Phase \d+ [^\n]*)\n\nstatus: ([A-Z_]+)", text)
current_line = next((line for line in text.splitlines() if line.startswith("current_phase:")), None)
current_phase = current_line.split(":", 1)[1].strip() if current_line else None

order = [name for name, _ in phases]
status = {name: st for name, st in phases}

if current_phase not in order:
    print("Current phase not found in phase table.")
    raise SystemExit(1)

idx = order.index(current_phase)
if status[current_phase] != "COMPLETE":
    print(f"Current phase is not COMPLETE: {current_phase} ({status[current_phase]})")
    raise SystemExit(1)

if idx + 1 >= len(order):
    print("No next phase. Final phase already reached.")
    raise SystemExit(0)

print(order[idx + 1])
PY