---
description: Works with AntiGravity Connect to sync multi-agent state
---

# AntiGravity Connect Workflow

This workflow manages state synchronization when multiple instances of Antigravity (or other OpenCode-compatible agents) are working on the same workspace.

## 🔄 Sync Protocol
1. **Pull State**: Read `STATE.md` and `.gsd/ROADMAP.md` before taking any action.
2. **Locking**: If performing a critical task (e.g., database schema change), announce it in a temporary file `LOCKED_BY_ANTIGRAVITY.md`.
3. **Commit often**: Small, frequent commits allow other agents to see your progress in the git log.
4. **Broadcast**: After finishing a sub-task, update the shared task list in `.gsd/ROADMAP.md`.

## 📡 Peer Communication
- Use the git commit history as the primary source of inter-agent communication.
- Prefix commits with `agent: <message>` to distinguish from user manual commits.
