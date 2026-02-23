---
description: Automatically generate and renew SSL certificates via Cloudflare DNS challenge
---

# Workflow: SSL Cert Management (Cloudflare)

This workflow describes how to use the `get-cert-cloudflare` GitHub Action to automatically generate and renew SSL certificates using Cloudflare DNS.

## 1. Prerequisites
- Your domain must be managed by **Cloudflare**.
- You need a Cloudflare **API Token** with the following permissions:
    - **Zone**: `DNS:Edit`
    - **Zone**: `Zone:Read`

## 2. Setup GitHub Secrets
In your GitHub repository, go to `Settings > Secrets and variables > Actions` and add the following secret:
- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token.

## 3. GitHub Actions Workflow
Create a file at `.github/workflows/ssl-cert.yml` with the following content:

```yaml
name: Generate SSL Certificate

on:
  workflow_dispatch: # Manual trigger
  schedule:
    - cron: '0 0 1 * *' # Run once a month to ensure renewal

jobs:
  get-cert:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Get SSL Certificate
        uses: cwpete61/get-cert-cloudflare@master
        with:
          cloudflare_api_token: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          domain_names: 'example.com,*.example.com' # Comma-separated list
          email: 'admin@example.com'
          cert_file_name: 'cert.zip' # Optional, default is cert.zip
          dry_run: false # Optional, default is false

      - name: Upload Certificate Artifact
        uses: actions/upload-artifact@v4
        with:
          name: ssl-certificate
          path: cert.zip
```

## 4. Usage Notes
- **Wildcard Certificates**: Works perfectly with wildcard domains (e.g., `*.example.com`).
- **Artifacts**: The generated certificate and keys are packed into `cert.zip` and uploaded as a GitHub Action artifact for you to download or deploy.
- **Persistence**: You may want to modify the workflow to upload the certificate to a secure location (e.g., AWS S3, a server via SSH, or GitHub Secrets) for automatic deployment to your web servers.

## Best Practices
- **Token Scoping**: Limit your Cloudflare API token to only the specific zones required.
- **Dry Run**: Set `dry_run: true` when testing the workflow for the first time to avoid hitting Let's Encrypt rate limits.
