#!/bin/bash
# OrbisVoice Webhook Server - systemd service setup
# Run this ONCE on the VPS to install the webhook server as a service.
# Usage: bash setup-webhook.sh

set -euo pipefail

PROJECT_DIR="/opt/orbisvoice"
SERVICE_FILE="/etc/systemd/system/orbisvoice-webhook.service"

echo "=== Setting up OrbisVoice Webhook Deploy Server ==="

# 1. Ensure Node.js is installed
if ! command -v node &> /dev/null; then
  echo "Installing Node.js..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
echo "Node.js: $(node --version)"

# 2. Ensure git is available
if ! command -v git &> /dev/null; then
  apt-get install -y git
fi

# 3. Check if repo is already cloned on VPS
if [ ! -d "$PROJECT_DIR/.git" ]; then
  echo ""
  echo "⚠️  Git repo not found at $PROJECT_DIR"
  echo "The project files were deployed via SCP but not as a git repo."
  echo ""
  echo "To fix, run on the VPS:"
  echo "  cd /opt/orbisvoice"
  echo "  git init"
  echo "  git remote add origin https://github.com/cwpete61/cwpete61-OrbisVoice.git"
  echo "  git fetch origin master"
  echo "  git reset --hard origin/master"
  echo ""
  echo "Then re-run this script."
  exit 1
fi

# 4. Generate WEBHOOK_SECRET if not already in .env
if ! grep -q "WEBHOOK_SECRET" "$PROJECT_DIR/.env" 2>/dev/null; then
  WEBHOOK_SECRET=$(openssl rand -hex 32)
  echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> "$PROJECT_DIR/.env"
  echo "✅ Generated WEBHOOK_SECRET and added to .env"
  echo "   Copy this value for your GitHub webhook setup:"
  echo "   WEBHOOK_SECRET=$WEBHOOK_SECRET"
else
  echo "✅ WEBHOOK_SECRET already set in .env"
fi

# 5. Create systemd service
echo "Creating systemd service..."
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=OrbisVoice Webhook Deploy Server
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
WorkingDirectory=$PROJECT_DIR
EnvironmentFile=$PROJECT_DIR/.env
ExecStart=node $PROJECT_DIR/webhook-server.js
Restart=always
RestartSec=5
StandardOutput=append:$PROJECT_DIR/webhook.log
StandardError=append:$PROJECT_DIR/webhook.log

[Install]
WantedBy=multi-user.target
EOF

# 6. Enable and start service
systemctl daemon-reload
systemctl enable orbisvoice-webhook
systemctl restart orbisvoice-webhook

sleep 2
echo ""
echo "=== Service Status ==="
systemctl status orbisvoice-webhook --no-pager

# 7. Open firewall port 9000
if command -v ufw &> /dev/null; then
  ufw allow 9000/tcp comment "OrbisVoice Webhook"
  echo "✅ Firewall: port 9000 opened"
fi

# 8. Health check
sleep 1
if curl -sf http://localhost:9000/health > /dev/null; then
  echo "✅ Webhook server is healthy"
  curl -s http://localhost:9000/health | python3 -m json.tool 2>/dev/null || true
else
  echo "⚠️  Health check failed - check logs: journalctl -u orbisvoice-webhook -n 50"
fi

echo ""
echo "=== Next Step: Configure GitHub Webhook ==="
echo "1. Go to: https://github.com/cwpete61/cwpete61-OrbisVoice/settings/hooks/new"
# GitHub does not support IPv6 for webhooks, so we must find the IPv4 address
IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "YOUR_VPS_IP")

if [ "$IP" = "YOUR_VPS_IP" ]; then
  echo "⚠️  Could not automatically detect IPv4 address. Please use your server's public IPv4."
  PAYLOAD_URL="http://YOUR_VPS_IP:9000/webhook"
else
  PAYLOAD_URL="http://$IP:9000/webhook"
fi

echo "2. Payload URL: $PAYLOAD_URL"
echo "3. Content type: application/json"
echo "4. Secret: (the WEBHOOK_SECRET value from your .env)"
echo "5. Events: Just the push event"
echo ""
echo "=== Setup Complete ==="
