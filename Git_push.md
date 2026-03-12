# Production Deployment Workflow (One-Click)

This file is designed for **Opencode** to execute rapid updates to both GitHub and the Live Production Server.

## 🚀 Unified Push & Deploy

Run these commands in order to sync the codebase and update the live environment:

```bash
# 1. Sync with GitHub (Triggers CI/CD Build)
git push origin master

# 2. (Optional) Force Immediate Live Pull
# Use this if you want to ensure the server pulls the latest config/images immediately
ssh orbisvoice-prod "cd /opt/orbisvoice && docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d"

# 3. Verify Health
curl -I https://myorbisvoice.com/api/health
```

---

## 🛠️ Direct File Sync (Shortcuts)

If you only changed configuration files (like `nginx/` or `.env.prod`) and don't want to wait for a full Docker build:

```bash
# Sync all config/docker files directly to the server
scp -r docker-compose.prod.yml nginx/ root@147.93.183.4:/opt/orbisvoice/

# Restart Nginx or API to apply changes
ssh orbisvoice-prod "cd /opt/orbisvoice && docker compose -f docker-compose.prod.yml restart nginx api"
```

## 📋 Status Check

```bash
# Snapshot of live server status
ssh orbisvoice-prod "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Health}}'"
```

---
_Optimized for Opencode Agent Automation - 2026-03-12_
