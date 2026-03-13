---
description: Deploy changes to Live immediately by pushing to the master branch.
---

1. Run `git add .` to strictly stage all new and modified files.
2. Run `git commit -m "chore: auto-deploy"`
3. Run `git push origin master` (This triggers the `.github/workflows/deploy.yml` pipeline that builds, pushes to ghcr, and SSHs into the VPS to restart the live instance.)
