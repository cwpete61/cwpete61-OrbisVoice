---
description: Apply a general SSL certificate (non-Cloudflare specific)
---

# Generate General SSL Certificate

This workflow instructs the AI agent on how to manage a standard, general SSL certificate generation pipeline (e.g., using a standard Certbot approach directly on the VPS).

## Prerequisites

1. Ensure the domain's DNS A-records point directly to the VPS IP address.
2. Ensure port 80 and 443 are open on the server.
3. Access to the VPS via SSH is required.

## Workflow Steps

// turbo
1. **Connect to the VPS**
   Establish an SSH connection to the server where Nginx is running.
   `ssh root@<VPS_IP>`

// turbo
2. **Install Certbot**
   Ensure Certbot and the Nginx plugin are installed on the host.
   `apt-get update && apt-get install -y certbot python3-certbot-nginx`

// turbo
3. **Generate the Certificate**
   Run Certbot to fetch and apply the Let's Encrypt certificate. If Nginx is running inside Docker, use webroot or standalone mode, then map the volumes properly.
   `certbot certonly --standalone -d yourdomain.com -d *.yourdomain.com --email admin@yourdomain.com --agree-tos --non-interactive`

// turbo
4. **Link Certificates to Nginx**
   Ensure the generated certificates in `/etc/letsencrypt/live/yourdomain.com/` are accessible to your Nginx configuration.

// turbo
5. **Reload Nginx Server**
   Restart the Nginx service or Docker container so the new certificates take effect.
   `docker restart orbisvoice-nginx-prod`

## Troubleshooting

- **Rate Limits**: If you hit Let's Encrypt rate limits, append `--dry-run` to the certbot command during testing.
- **Port Conflicts**: If Nginx is binding port 80, you may need to stop Nginx temporarily before running Certbot in standalone mode, or use `--webroot` mode instead.
