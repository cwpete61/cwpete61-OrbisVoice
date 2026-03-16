---
description: Bypasses GitHub and deploys local changes directly to the VPS via SSH/rsync.
---

# /deploy-now Workflow

This workflow provides a direct "emergency" deployment path that does not rely on GitHub Actions or the `gitup` webhook.

1. **Verify SSH Access**
   Ensure your local machine has SSH access to the VPS `147.93.183.4`.

2. **Run Direct Deploy Script**
   // turbo
   Run the following command to sync files and trigger a build:
   ```powershell
   bash deploy-vps-direct.sh
   ```

3. **Verify Deployment**
   Check the health endpoint to confirm the update:
   ```powershell
   curl -s http://147.93.183.4:4001/api
   ```
