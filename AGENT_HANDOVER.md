# AI Agent Handover Guide (OrbisVoice)

Welcome. This document is a high-level "cheat sheet" designed to get you (Opencode or other AI agents) up to speed on the OrbisVoice project immediately.

## 🚀 The Source of Truth
1.  **Project Roadmap**: [ROADMAP.md](file:///c:/Antigravity/OrbisVoice/ROADMAP.md) - Tracking the high-level modernized tech stack.
2.  **Current Task**: [task.md](file:///C:/Users/crawf/.gemini/antigravity/brain/05d9d6c0-64f1-4b5c-8a3e-178918910237/task.md) - The active execution checklist.
3.  **Deployment Specs**: [STACK.md](file:///c:/Antigravity/OrbisVoice/STACK.md) - Under "Production Deployment".

## 🛠️ Operating Procedures

### 1. Deployment (Strictly CI/CD)
We use a **Legacy-First** deployment model. Do NOT attempt to orchestrate the VPS directly via SSH scripts unless explicitly asked to fix the infrastructure itself.
*   **Trigger**: `git push origin master`
*   **Logic**: GitHub Actions builds the containers and runs the `/opt/orbisvoice/deploy-vps.sh` script on the Contabo VPS.
*   **Infrastructure Files**: `docker-compose.prod.yml`, `nginx/nginx.conf`, and `.github/workflows/deploy.yml`.

### 2. VPS Access
*   **SSH Config**: Use [SSH_CONFIG.md](file:///c:/Antigravity/OrbisVoice/SSH_CONFIG.md).
*   **User/IP**: `root@147.93.183.4`
*   **Identity File**: `C:\Users\crawf\.ssh\orbis_deploy_key`
*   **Shortcut**: If you save the config to your local `~/.ssh/config`, you can simply run `ssh orbisvoice-prod`.

### 3. Database Management
*   **ORM**: Prisma 6 (latest).
*   **Linux Target**: When generating Prisma clients for production, ensure the binary target `debian-openssl-3.0.x` is used.
*   **Forced Seed**: If user data is missing on the VPS, use `docker exec orbisvoice-api-prod node prisma/seed.js`.

## 🎯 Current Focus (Phase 5)
We are currently focusing on **Monetization & Analytics**.
- **Stripe**: Initial key configuration and component implementation.
- **Analytics**: Usage charts and billing dashboards.

## ⚠️ Important Gotchas
- **Windows vs Linux**: The project is a monorepo coded on Windows but deployed on Linux. Watch for path separators and line endings (`CRLF` vs `LF`) in scripts.
- **Nginx Upstreams**: Nginx uses variables for `proxy_pass` to prevent crashing if backend services are offline during boot.

---
*Last Updated: 2026-03-12 by Antigravity*
