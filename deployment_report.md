### deployment Diagnostics
#### File Health Check
```
-rw-r--r-- 1 1001 1001 3707 Mar 12 17:35 /opt/orbisvoice/nginx/nginx.conf
-rw-r--r-- 1 1001 1001 1131 Mar 12 17:35 /opt/orbisvoice/nginx/certs/fullchain.pem
/opt/orbisvoice
/opt/orbisvoice/nginx
/opt/orbisvoice/nginx/nginx.conf
/opt/orbisvoice/nginx/certs
/opt/orbisvoice/deployment_report.md
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1053316,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1053336,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=825900,fd=8))               
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1053323,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1053342,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=825907,fd=8))               
```
#### Container Status
```
NAMES                           STATUS                         PORTS
orbisvoice-nginx-prod           Up 15 minutes                  0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up 6 hours                     3000/tcp
orbisvoice-api-prod             Restarting (1) 2 seconds ago   
orbisvoice-voice-gateway-prod   Up Less than a second          4001/tcp
orbisvoice-postgres-prod        Up 6 hours (healthy)           0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up 6 hours (healthy)           0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
orbis-local-app                 Up 35 hours                    0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
```
#### Nginx Logs (Tail 30)
```
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: IPv6 listen already enabled
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
2026/03/12 16:19:08 [emerg] 1#1: host not found in upstream "api" in /etc/nginx/nginx.conf:82
nginx: [emerg] host not found in upstream "api" in /etc/nginx/nginx.conf:82
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: IPv6 listen already enabled
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
2026/03/12 16:20:13 [notice] 1#1: using the "epoll" event method
2026/03/12 16:20:13 [notice] 1#1: nginx/1.29.6
2026/03/12 16:20:13 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0) 
2026/03/12 16:20:13 [notice] 1#1: OS: Linux 6.8.0-101-generic
2026/03/12 16:20:13 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/03/12 16:20:13 [notice] 1#1: start worker processes
2026/03/12 16:20:13 [notice] 1#1: start worker process 22
2026/03/12 16:20:13 [notice] 1#1: start worker process 23
2026/03/12 16:20:13 [notice] 1#1: start worker process 24
2026/03/12 16:20:13 [notice] 1#1: start worker process 25
2026/03/12 16:20:13 [notice] 1#1: start worker process 26
2026/03/12 16:20:13 [notice] 1#1: start worker process 27
2026/03/12 16:35:54 [error] 23#23: *66 api could not be resolved (2: Server failure), client: 64.121.33.94, server: myorbisvoice.com, request: "POST /api/auth/login HTTP/1.1", host: "myorbisvoice.com", referrer: "https://myorbisvoice.com/login"
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
