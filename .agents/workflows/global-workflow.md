---
description: Global Workflow for initialization and self-annealing standards
---

# OrbisVoice Global Workflow (Antigravity v1.0)

This workflow is the master "Operating System" for AI agents working on this project. It ensures consistency, safety, and continuous improvement through self-annealing.

## 🏁 Phase 1: Initialization (Load Sequence)
1. **Context Check**:
    - Read `ARCHITECTURE.md` to map the service boundaries.
    - Check `ROADMAP.md` for the active phase and milestone.
    - Review `DIRECTIVES.md` for project-specific engineering "laws".
2. **Environment Validation**:
    - Ensure `.env` or `.env.prod` is correctly configured based on the target (local vs live).
    - If working on Stripe/Auth, verify API key presence (do NOT output secrets).

## 🛡️ Phase 2: Execution & Safety
1. **Directives Compliance**: Follow the rules in `DIRECTIVES.md` (e.g., StripeClient guard, CI/CD trigger).
2. **Atomic Commits**: Group logic changes with documentation updates.
3. **Audit**: Run `/code-reviewer` before proposing any deployment.

## 🔄 Phase 3: The Self-Annealing Loop
When an error occurs (linting, build, or runtime):
1. **Fix it**: Apply the immediate patch.
2. **Distill**: Determine why the error happened (e.g., "Missing generic and platform-specific environment variables in production").
3. **Harden**: Update the relevant script or utility.
4. **Update Directives**: Add the discovery to `DIRECTIVES.md` or the relevant workflow.
5. **Update State**: Document the fix in `STATE.md` or the task list.

## 🚀 Phase 4: Production Handover
1. **Diagnostic Report**: If deploying, generate/update `deployment_report.md`.
2. **Master Sync**: Use `git push origin master` for all live updates.
