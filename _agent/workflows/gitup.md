---
description: Set up direct VPS webhook-based deployment — replaces GitHub Actions with a ~90-second on-VPS build cycle
---

# /gitup — Direct VPS Webhook Deploy

Replaces GitHub Actions + container registry with a self-hosted webhook server.
Every `git push` triggers a deploy in ~60-90 seconds instead of 8-12 minutes.

## Before You Start

Collect these values:
- `VPS_IP` — your server's IP address
- `SSH_KEY` — path to your SSH private key (e.g. `~/.ssh/my_deploy_key`)
- `REPO_URL` — full GitHub HTTPS clone URL
- `BRANCH` — deploy branch (usually `master` or `main`)
- `PROJECT_DIR` — directory on VPS (e.g. `/opt/myapp`)
- `COMPOSE_FILE` — compose filename (e.g. `docker-compose.prod.yml`)

---

## Step 1 — Create `webhook-server.js`

Create this file in the project root. It receives GitHub push events on port 9000 and spawns `deploy.sh`.

Key behaviors:
- Validates HMAC-SHA256 signature against `WEBHOOK_SECRET` env var
- Only triggers on pushes to `BRANCH`
- Returns 200 immediately (deploy runs in background)
- Exposes `/health` endpoint
- Logs everything to `deploy.log`

Use the template from OrbisVoice (`webhook-server.js`) as the base — it's fully generic and parameterized via env vars.

---

## Step 2 — Create `deploy.sh`

Create this file in the project root. Runs on the VPS when triggered.

Standard steps:
```bash
source .env
git fetch origin && git reset --hard origin/$BRANCH
docker compose -f $COMPOSE_FILE up -d --build --remove-orphans
docker system prune -f --filter "until=24h"
```

Add any project-specific post-deploy steps (DB migrations, cache busting, etc.) before the prune.

// turbo
```powershell
New-Item -ItemType File -Path "deploy.sh" -Force
```

---

## Step 3 — Create `setup-webhook.sh`

One-time VPS installer. Does:
1. Installs Node.js 20 if missing
2. Checks git clone exists on VPS (errors clearly if not)
3. Generates `WEBHOOK_SECRET` and appends to `.env`
4. Creates and enables systemd service `myapp-webhook`
5. Opens firewall port 9000
6. Prints final GitHub webhook configuration

Use `setup-webhook.sh` from OrbisVoice as a base — replace container names and service name.

---

## Step 4 — Update `docker-compose.prod.yml`

Remove all `image: registry/...` pull references from services.
Ensure every service has a `build:` context block.

```yaml
# REMOVE this:
image: ghcr.io/yourorg/yourapp:latest

# KEEP/ADD this:
build:
  context: .
  dockerfile: Dockerfile.servicename
```

---

## Step 5 — Disable GitHub Actions Auto-Deploy

Change the trigger in your deploy workflow from:
```yaml
on:
  push:
    branches: [ master ]
```
to:
```yaml
on:
  workflow_dispatch:
    # Auto-deploy disabled — webhook server handles deploys.
    # Use manually for emergency rollbacks only.
```

---

## Step 6 — Commit and Push

```bash
git add webhook-server.js deploy.sh setup-webhook.sh docker-compose.prod.yml .github/
git commit -m "feat: replace CI/CD with direct VPS webhook deploy"
git push origin $BRANCH
```

---

## Step 7 — Initialize Git on VPS (if not already cloned)

SSH in and run:
```bash
cd $PROJECT_DIR
git init
git remote add origin $REPO_URL
git fetch origin $BRANCH
git reset --hard origin/$BRANCH
```

Skip if git is already cloned there.

---

## Step 8 — Run Setup on VPS

```bash
# Copy files
scp -i $SSH_KEY webhook-server.js deploy.sh setup-webhook.sh \
    $COMPOSE_FILE root@$VPS_IP:$PROJECT_DIR/

# Run installer
ssh -i $SSH_KEY root@$VPS_IP "chmod +x $PROJECT_DIR/deploy.sh \
    $PROJECT_DIR/setup-webhook.sh && bash $PROJECT_DIR/setup-webhook.sh"
```

The setup script will print the generated `WEBHOOK_SECRET` and the exact GitHub webhook URL.

---

## Step 9 — Configure GitHub Webhook (Manual)

Go to: `https://github.com/YOUR_ORG/YOUR_REPO/settings/hooks/new`

| Field | Value |
|---|---|
| Payload URL | `http://VPS_IP:9000/webhook` |
| Content type | `application/json` |
| Secret | *(from setup script output or `.env` on VPS)* |
| Events | **Just the push event** |

---

## Step 10 — Verify

Push a test commit and watch the deploy:
```bash
# Monitor deploy in real time
ssh -i $SSH_KEY root@$VPS_IP "tail -f $PROJECT_DIR/deploy.log"
```

Confirm with health check:
```bash
curl http://VPS_IP:9000/health
# Expected: {"ok":true,"deploying":false,"branch":"master"}
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Webhook not received | Check GitHub → webhook → Recent Deliveries for errors |
| 401 Unauthorized | `WEBHOOK_SECRET` mismatch — re-copy from VPS `.env` |
| Deploy not triggering | Check `journalctl -u myapp-webhook -n 50` on VPS |
| Build fails on VPS | SSH in and run `deploy.sh` manually; read error output |
| Port 9000 refused | `ufw allow 9000/tcp` or check VPS provider firewall |
| Node not found | Re-run `setup-webhook.sh` — it installs Node.js 20 |
