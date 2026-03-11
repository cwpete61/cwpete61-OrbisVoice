---
description: Incrementally update dependencies across the monorepo using the defined phase-based roadmap.
---

1. Load `ROADMAP.md` in the project root to identify the current active phase and progress.
2. For the current phase, perform the following technical steps:
   - Navigate to the relevant workspace (e.g., `apps/web` or `apps/api`).
   - Run `npm outdated` to identify update candidates.
   - Focus on **minor and patch** updates for utility libraries first.
   - After each set of updates, execute verification:
     - Run `npm run typecheck` in the workspace.
     - Ensure the development server (`npm run dev`) starts without errors.
3. If verification passes, commit the changes using the format `chore(deps): update [package names] in [workspace]`.
4. Update `ROADMAP.md` by marking completed tasks and recalculating the completion percentage.
5. If a breaking change or "dependency hell" conflict is encountered:
   - Roll back to the last stable state.
   - Document the specific conflict and version blocker in `ROADMAP.md`.
6. Once a phase is finalized, notify the user and suggest starting the next phase in the roadmap.
