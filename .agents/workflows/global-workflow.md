---
description: Unified Global Workflow - End-to-end development, synchronization, and production deployment
---

# Global Workflow: The Master Cycle

This workflow integrates the core agentic specialized roles (Architect, Strategist, Engineer, Auditor) with high-speed production synchronization to ensure rapid, high-quality feature delivery.

## 1. Analysis (The Architect)
Before any change, align with the system architecture.
- Run `/map` to update `ARCHITECTURE.md` and `STACK.md`.
- Identify the impact on `apps/api`, `apps/web`, and `apps/voice-gateway`.

## 2. Strategy (The Strategist)
Decompose requirements into executable steps.
- Run `/plan` to update `ROADMAP.md` and the task list.
- Ensure all environment variables for the new feature are defined in `.env.example` and `.env.prod`.

## 3. Implementation (The Engineer)
Execute the work with focused context.
- Run `/execute` on the current roadmap phase.
- Follow the patterns in `packages/shared` for consistency.

## 4. Verification (The Auditor)
Validate the work with empirical evidence.
- Run `/verify` to ensure tests pass and `deployment_report.md` is updated.
- Perform a manual build: `npm run build 2>&1 | distill "did monorepo build pass?"`

## 5. Production Synchronization (Fast Push)
Once verified locally, push to the cloud and live server.
- Follow **[Git_push.md](file:///c:/Antigravity/OrbisVoice/Git_push.md)**:
  1. `git push origin master` (Triggers GitHub Actions build).
  2. `ssh orbisvoice-prod "cd /opt/orbisvoice && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"`
  3. Verify health: `curl -I https://myorbisvoice.com/api/health`

---
// turbo-all
## 6. Cleanup & State Sync
- Run `/pause` to dump context for a clean handoff.
- Ensure all artifacts (`walkthrough.md`, `task.md`) are finalized.
