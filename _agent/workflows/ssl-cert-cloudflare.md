---
description: Automatically generate and renew SSL certificates via Cloudflare DNS challenge
---

# Workflow: SSL Cert Management (Cloudflare)

This workflow describes how to use the `shibme/cloudflare-letsencrypt-certbot-generate` GitHub Action to automatically generate and renew SSL certificates using Cloudflare DNS.

## 1. Prerequisites
- Your domain must be managed by **Cloudflare**.
- You need a Cloudflare **API Token** with the following permissions:
    - **Zone**: `DNS:Edit`
    - **Zone**: `Zone:Read`
- Add the token to GitHub Secrets as `CLOUDFLARE_API_TOKEN`.

## 2. GitHub Actions Workflow
Create a file at `.github/workflows/ssl-cert.yml` with the following content. This version includes **dynamic inputs** to allow you to specify domains and toggle dry-run mode directly from the GitHub UI.

```yaml
name: Generate SSL Certificate

on:
  workflow_dispatch:
    inputs:
      domain_names:
        description: 'Domains to include (comma-separated, e.g., example.com,*.example.com)'
        required: true
        default: 'example.com,*.example.com'
      email:
        description: 'Email for Let''s Encrypt'
        required: true
        default: 'admin@example.com'
      dry_run:
        description: 'Run in dry-run mode (no actual cert issued)'
        required: true
        default: 'true'
        type: choice
        options:
          - 'true'
          - 'false'
  schedule:
    - cron: '0 0 1 * *' # Auto-renewal on the 1st of every month

jobs:
  get-cert:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Get SSL Certificate
        uses: shibme/cloudflare-letsencrypt-certbot-generate@main
        with:
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          domain_names: ${{ github.event.inputs.domain_names || 'example.com,*.example.com' }}
          email: ${{ github.event.inputs.email || 'admin@example.com' }}
          cert_file_name: 'ssl_cert'
          dry_run: ${{ github.event.inputs.dry_run || 'false' }}

      - name: Upload Certificate Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ssl-certificate
          path: ssl_cert.zip
```

## 3. Usage & Troubleshooting

### Common Error: "Unable to determine zone_id"
This usually happens if your `domain_names` input doesn't match the **Zone Name** in your Cloudflare dashboard.
- **Fix**: Check if your domain is `example.com` or `myexample.org` in Cloudflare. Wildcards (e.g., `*.domain.com`) are supported but the root domain must be correct.

### Error: "Required property is missing: shell"
This happens if using an older or broken "composite" action handle.
- **Fix**: Always use the Docker-based action `shibme/cloudflare-letsencrypt-certbot-generate@main`.

### Best Practices
- **Dry Run First**: Always run with `dry_run: true` the first time to ensure DNS records can be created before trying to issue a real certificate.
- **Artifacts**: The generated certificate (`fullchain.pem`) and private key (`privkey.pem`) will be inside the downloaded zip file.
