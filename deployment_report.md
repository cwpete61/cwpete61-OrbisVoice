### deployment Diagnostics
#### File Health Check
```
-rw-r--r-- 1 1001 1001 3700 Mar 12 11:28 /opt/orbisvoice/nginx/nginx.conf
-rw-r--r-- 1 1001 1001 1131 Mar 12 11:28 /opt/orbisvoice/nginx/certs/fullchain.pem
/opt/orbisvoice
/opt/orbisvoice/scripts
/opt/orbisvoice/scripts/update-admin.js
/opt/orbisvoice/scripts/list-users.js
/opt/orbisvoice/scripts/verify-byok.js
/opt/orbisvoice/scripts/README.md
/opt/orbisvoice/scripts/setup-final-admin.js
/opt/orbisvoice/scripts/verify-byok.ts
/opt/orbisvoice/Dockerfile.api
/opt/orbisvoice/package-lock.json
/opt/orbisvoice/add_missing_fields.sql
/opt/orbisvoice/PHASE_4.5_INTEGRATION_GUIDE.md
/opt/orbisvoice/.dockerignore
/opt/orbisvoice/infra
/opt/orbisvoice/infra/README.md
/opt/orbisvoice/infra/docker
/opt/orbisvoice/assets
/opt/orbisvoice/assets/images
/opt/orbisvoice/package.json
/opt/orbisvoice/STACK.md
/opt/orbisvoice/fix-lint-v3.js
/opt/orbisvoice/DEPLOYMENT.md
/opt/orbisvoice/push_error.txt
/opt/orbisvoice/.prettierrc.json
/opt/orbisvoice/update_redirect_uri.sql
/opt/orbisvoice/original-layout
/opt/orbisvoice/original-layout/dashboard.html
/opt/orbisvoice/original-layout/billing.html
/opt/orbisvoice/original-layout/partner.html
/opt/orbisvoice/original-layout/blog.html
/opt/orbisvoice/original-layout/login.html
/opt/orbisvoice/original-layout/homepage.html
/opt/orbisvoice/original-layout/pricing.html
/opt/orbisvoice/remote-docker-compose.prod.yml
/opt/orbisvoice/BRAND.md
/opt/orbisvoice/docker-compose.prod.yml
/opt/orbisvoice/EXECUTION_PLAN.md
/opt/orbisvoice/Dockerfile.web
/opt/orbisvoice/apps
/opt/orbisvoice/apps/web
/opt/orbisvoice/apps/voice-engine
/opt/orbisvoice/apps/referrals
/opt/orbisvoice/apps/api
/opt/orbisvoice/apps/voice-gateway
/opt/orbisvoice/nginx
/opt/orbisvoice/nginx/nginx.conf
/opt/orbisvoice/nginx/certs
/opt/orbisvoice/fix-lint-precision.js
/opt/orbisvoice/generate-test-token.mjs
/opt/orbisvoice/check_hash_length.sh
/opt/orbisvoice/.gitignore
/opt/orbisvoice/.git
/opt/orbisvoice/.git/info
/opt/orbisvoice/.git/FETCH_HEAD
/opt/orbisvoice/.git/branches
/opt/orbisvoice/.git/config
/opt/orbisvoice/.git/HEAD
/opt/orbisvoice/.git/logs
/opt/orbisvoice/.git/objects
/opt/orbisvoice/.git/ORIG_HEAD
/opt/orbisvoice/.git/hooks
/opt/orbisvoice/.git/refs
/opt/orbisvoice/.git/index
/opt/orbisvoice/.git/packed-refs
/opt/orbisvoice/.git/description
/opt/orbisvoice/PHASE_5_PROGRESS.md
/opt/orbisvoice/README.md
/opt/orbisvoice/tsconfig.base.json
/opt/orbisvoice/OrbisVoice
/opt/orbisvoice/OrbisVoice/vite.config.ts
/opt/orbisvoice/OrbisVoice/index.html
/opt/orbisvoice/OrbisVoice/package.json
/opt/orbisvoice/OrbisVoice/metadata.json
/opt/orbisvoice/OrbisVoice/gemini-voice-agent.zip
/opt/orbisvoice/OrbisVoice/.env.example
/opt/orbisvoice/OrbisVoice/.gitignore
/opt/orbisvoice/OrbisVoice/README.md
/opt/orbisvoice/OrbisVoice/src
/opt/orbisvoice/OrbisVoice/tsconfig.json
/opt/orbisvoice/deployment_report.md
/opt/orbisvoice/PHASE_2_PROGRESS.md
/opt/orbisvoice/.github
/opt/orbisvoice/.github/workflows
/opt/orbisvoice/src
/opt/orbisvoice/src/orchestrator.js
/opt/orbisvoice/src/multi_agent_system
/opt/orbisvoice/src/orchestrator.ts
/opt/orbisvoice/src/agents
/opt/orbisvoice/INFRASTRUCTURE.md
/opt/orbisvoice/docker-compose.yml
/opt/orbisvoice/PHASE_4_PROGRESS.md
/opt/orbisvoice/deploy-vps.sh
/opt/orbisvoice/whats-next.md
/opt/orbisvoice/.prettierignore
/opt/orbisvoice/.editorconfig
/opt/orbisvoice/eslint.config.mjs
/opt/orbisvoice/.agents
/opt/orbisvoice/.agents/workflows
/opt/orbisvoice/tsconfig.json
/opt/orbisvoice/vg_build.log
/opt/orbisvoice/packages
/opt/orbisvoice/packages/config
/opt/orbisvoice/packages/shared
/opt/orbisvoice/build_error.txt
/opt/orbisvoice/PROMPT.md
/opt/orbisvoice/.env
/opt/orbisvoice/_agent
/opt/orbisvoice/_agent/workflows
/opt/orbisvoice/.env.prod.example
/opt/orbisvoice/ROADMAP.md
/opt/orbisvoice/update_redirect_final.sql
/opt/orbisvoice/remote-nginx.conf
/opt/orbisvoice/check_user.sh
/opt/orbisvoice/reset_admin_hash.sh
/opt/orbisvoice/reset_admin_hash_fixed.sh
/opt/orbisvoice/Dockerfile.voice-gateway
/opt/orbisvoice/PHASE_3_PROGRESS.md
/opt/orbisvoice/.cursor
/opt/orbisvoice/.cursor/mcp.json
/opt/orbisvoice/fix_api_urls.py
/opt/orbisvoice/ARCHITECTURE.md
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=828331,fd=8))               
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=828353,fd=8))               
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=825900,fd=8))               
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=828339,fd=8))               
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=828360,fd=8))               
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=825907,fd=8))               
```
#### Container Status
```
NAMES                           STATUS                         PORTS
orbisvoice-nginx-prod           Up 3 seconds                   0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up 21 seconds                  3000/tcp
orbisvoice-api-prod             Restarting (1) 1 second ago    
orbisvoice-voice-gateway-prod   Restarting (1) 3 seconds ago   
orbisvoice-postgres-prod        Up 32 seconds (healthy)        0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up 32 seconds (healthy)        0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
orbis-local-app                 Up 29 hours                    0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
```
#### Nginx Logs (Tail 30)
```
2026/03/12 10:29:26 [emerg] 1#1: host not found in upstream "api" in /etc/nginx/nginx.conf:82
nginx: [emerg] host not found in upstream "api" in /etc/nginx/nginx.conf:82
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: IPv6 listen already enabled
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
2026/03/12 10:29:32 [emerg] 1#1: host not found in upstream "api" in /etc/nginx/nginx.conf:82
nginx: [emerg] host not found in upstream "api" in /etc/nginx/nginx.conf:82
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: IPv6 listen already enabled
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
2026/03/12 10:29:38 [emerg] 1#1: host not found in upstream "voice-gateway" in /etc/nginx/nginx.conf:101
nginx: [emerg] host not found in upstream "voice-gateway" in /etc/nginx/nginx.conf:101
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: IPv6 listen already enabled
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
```
#### API Logs (Tail 50)
```
- /app/apps/api/dist/index.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)
    at Module._load (node:internal/modules/cjs/loader:1038:27)
    at Module.require (node:internal/modules/cjs/loader:1289:19)
    at require (node:internal/modules/helpers:182:18)
    at Object.<anonymous> (/app/apps/api/dist/routes/google-auth.js:8:31)
    at Module._compile (node:internal/modules/cjs/loader:1521:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
    at Module.load (node:internal/modules/cjs/loader:1266:32)
    at Module._load (node:internal/modules/cjs/loader:1091:12)
    at Module.require (node:internal/modules/cjs/loader:1289:19) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/app/apps/api/dist/routes/google-auth.js',
    '/app/apps/api/dist/index.js'
  ]
}

Node.js v20.20.1

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

node:internal/modules/cjs/loader:1210
  throw err;
  ^

Error: Cannot find module 'google-auth-library'
Require stack:
- /app/apps/api/dist/routes/google-auth.js
- /app/apps/api/dist/index.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1207:15)
    at Module._load (node:internal/modules/cjs/loader:1038:27)
    at Module.require (node:internal/modules/cjs/loader:1289:19)
    at require (node:internal/modules/helpers:182:18)
    at Object.<anonymous> (/app/apps/api/dist/routes/google-auth.js:8:31)
    at Module._compile (node:internal/modules/cjs/loader:1521:14)
    at Module._extensions..js (node:internal/modules/cjs/loader:1623:10)
    at Module.load (node:internal/modules/cjs/loader:1266:32)
    at Module._load (node:internal/modules/cjs/loader:1091:12)
    at Module.require (node:internal/modules/cjs/loader:1289:19) {
  code: 'MODULE_NOT_FOUND',
  requireStack: [
    '/app/apps/api/dist/routes/google-auth.js',
    '/app/apps/api/dist/index.js'
  ]
}

Node.js v20.20.1
```
