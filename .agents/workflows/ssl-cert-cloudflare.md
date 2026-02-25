---
description: Automatically generate and renew SSL certificates via Cloudflare using a Self-Signed Origin Certificate and Full Encryption
---

# Generate Cloudflare SSL Certificate

This workflow instructs the AI agent on how to manage the Cloudflare SSL certificate generation pipeline, mirroring the logic found in `.github/workflows/ssl-cert.yml`.

## Prerequisites

Before running this workflow, verify that standard DNS and Cloudflare proxy requirements are met:
1. Ensure the domains (`myorbisvoice.com` and `*.myorbisvoice.com`) are proxied through Cloudflare (Orange Cloud enabled).
2. Ensure Cloudflare SSL/TLS encryption mode is set to **Full (strict)** or **Full**.
3. Verify `CLOUDFLARE_API_TOKEN`, `SERVER_HOST` (or `VPS_IP`), and `SERVER_SSH_KEY` (or `SSH_PRIVATE_KEY`) exist in the environment/secrets.

## Workflow Steps

// turbo
1. **Trigger the GitHub Action manually**
   You can trigger the existing `.github/workflows/ssl-cert.yml` action manually if you have access to the GitHub CLI:
   `gh workflow run ssl-cert.yml -f domain_names="myorbisvoice.com,*.myorbisvoice.com" -f email="admin@orbisvoice.app" -f dry_run="false"`

// turbo
2. **Monitor the Action**
   Watch the GitHub Action run to ensure it correctly authenticates with Cloudflare, generates the wildcard certificate using Certbot, and uploads the `.zip` artifact.

// turbo
3. **Deploy the Certificate to VPS**
   The GitHub Action automatically handles `rsync` deployment, but if verifying manually or replacing steps natively on the server, ensure the certificates are extracted to `/opt/orbisvoice/nginx/certs/`.
   Check that `orbis_cert.zip` unzips into standard `fullchain.pem` and `privkey.pem`.

// turbo
4. **Reload Nginx Server**
   Ensure the production Nginx container is restarted so the new certificates take effect.
   `ssh root@<VPS_IP> "docker restart orbisvoice-nginx-prod"`

## Troubleshooting

- **Dry Run Flag**: If you are simply testing rate limits or configuration, ensure `dry_run` is set to `true` to avoid hitting Let's Encrypt limits.
- **502 Bad Gateway**: If Nginx crashes after step 4, SSH into the box, navigate to `/opt/orbisvoice/nginx/certs`, and verify the `.pem` files exist and possess the correct read permissions.
