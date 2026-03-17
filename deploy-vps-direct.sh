#!/bin/bash
# deploy-vps-direct.sh
# Pushes local changes directly to the VPS and triggers a build, bypassing GitHub.

VPS_IP="147.93.183.4"
PROJECT_DIR="/opt/orbisvoice"
# Determine SSH key path (handle both Windows and Linux paths)
if [ -f "/mnt/c/Users/crawf/.ssh/orbis_deploy_key" ]; then
    REAL_KEY="/mnt/c/Users/crawf/.ssh/orbis_deploy_key"
    # Copy to /tmp to fix permissions (WSL doesn't allow chmod on /mnt/c files)
    SSH_KEY="/tmp/orbis_deploy_key"
    cp "$REAL_KEY" "$SSH_KEY"
    chmod 600 "$SSH_KEY"
elif [ -f "/c/Users/crawf/.ssh/orbis_deploy_key" ]; then
    SSH_KEY="/c/Users/crawf/.ssh/orbis_deploy_key"
elif [ -f "$HOME/.ssh/orbis_deploy_key" ]; then
    SSH_KEY="$HOME/.ssh/orbis_deploy_key"
else
    SSH_KEY="~/.ssh/orbis_deploy_key"
fi

echo "=== Direct VPS Deployment Initiated ==="

# 1. Sync files to VPS (excluding node_modules, .git, and build artifacts)
echo "Syncing files to $VPS_IP:$PROJECT_DIR..."
rsync -avz --progress -e "ssh -i $SSH_KEY" \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='.next' \
  --exclude='dist' \
  --exclude='.logs' \
  --exclude='*.node' \
  --exclude='*.dll' \
  --exclude='*.exe' \
  --exclude='*.tmp*' \
  --exclude='.env*' \
  ./ root@$VPS_IP:$PROJECT_DIR/

# 2. Sync .env.prod as .env
echo "Syncing environment variables..."
scp -i $SSH_KEY .env.prod root@$VPS_IP:$PROJECT_DIR/.env

# 3. Sync docker-compose.prod.yml
echo "Syncing docker-compose config..."
scp -i $SSH_KEY docker-compose.prod.yml root@$VPS_IP:$PROJECT_DIR/docker-compose.prod.yml

# 4. Trigger the deploy script on the VPS
echo "Triggering build on VPS..."
ssh -i $SSH_KEY root@$VPS_IP "cd $PROJECT_DIR && bash deploy.sh"

echo "=== Direct Deployment Complete ==="
