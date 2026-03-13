### deployment Diagnostics
#### Prisma Push Log (Out-of-Band)
```
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "orbisvoice", schema "public" at "postgres:5432"

The database is already in sync with the Prisma schema.

Running generate... (Use --skip-generate to skip the generators)
[2K[1A[2K[GRunning generate... - Prisma Client
[2K[1A[2K[G✔ Generated Prisma Client (v6.19.2) to ./../../node_modules/@prisma/client in 6
36ms
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.2 -> 7.5.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

```
#### API Logs (Last 50 lines)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773398195870,"pid":1,"hostname":"efa4b21de28d","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773398195871,"pid":1,"hostname":"efa4b21de28d","msg":"Session manager initialized"}
{"level":30,"time":1773398195872,"pid":1,"hostname":"efa4b21de28d","msg":"Tool handlers registered"}
{"level":30,"time":1773398196152,"pid":1,"hostname":"efa4b21de28d","msg":"Admin roles synchronized"}
{"level":30,"time":1773398196372,"pid":1,"hostname":"efa4b21de28d","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773398196372,"pid":1,"hostname":"efa4b21de28d","context":"fastify","msg":"Server listening at http://172.18.0.4:4001"}
{"level":30,"time":1773398196372,"pid":1,"hostname":"efa4b21de28d","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773398204682,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":50252},"msg":"incoming request"}
{"level":30,"time":1773398204693,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":10.654928982257843,"msg":"request completed"}
{"level":30,"time":1773398214794,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":32918},"msg":"incoming request"}
{"level":30,"time":1773398214799,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":3.0360229909420013,"msg":"request completed"}
{"level":30,"time":1773398224936,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53070},"msg":"incoming request"}
{"level":30,"time":1773398224938,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":2.067775994539261,"msg":"request completed"}
{"level":30,"time":1773398235092,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49328},"msg":"incoming request"}
{"level":30,"time":1773398235094,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.4671519994735718,"msg":"request completed"}
{"level":30,"time":1773398245207,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-5","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49132},"msg":"incoming request"}
{"level":30,"time":1773398245209,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-5","res":{"statusCode":200},"responseTime":1.0474829971790314,"msg":"request completed"}
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1498104,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1498130,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1497930,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1497671,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1498110,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1498137,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1497936,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1497679,fd=8))              
```
#### Container Status
```
NAMES                           STATUS                        PORTS
orbisvoice-nginx-prod           Up 56 seconds                 0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up 56 seconds                 3000/tcp
orbisvoice-api-prod             Up 56 seconds (healthy)       0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp
orbisvoice-voice-gateway-prod   Up 56 seconds                 4001/tcp
orbisvoice-postgres-prod        Up About a minute (healthy)   0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up About a minute (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
orbis-local-app                 Up 2 days                     0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
```
#### Nginx Logs (Tail 30)
```
/docker-entrypoint.sh: /docker-entrypoint.d/ is not empty, will attempt to perform configuration
/docker-entrypoint.sh: Looking for shell scripts in /docker-entrypoint.d/
/docker-entrypoint.sh: Launching /docker-entrypoint.d/10-listen-on-ipv6-by-default.sh
10-listen-on-ipv6-by-default.sh: info: Getting the checksum of /etc/nginx/conf.d/default.conf
10-listen-on-ipv6-by-default.sh: info: Enabled listen on IPv6 in /etc/nginx/conf.d/default.conf
/docker-entrypoint.sh: Sourcing /docker-entrypoint.d/15-local-resolvers.envsh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/20-envsubst-on-templates.sh
/docker-entrypoint.sh: Launching /docker-entrypoint.d/30-tune-worker-processes.sh
/docker-entrypoint.sh: Configuration complete; ready for start up
2026/03/13 10:36:35 [notice] 1#1: using the "epoll" event method
2026/03/13 10:36:35 [notice] 1#1: nginx/1.29.6
2026/03/13 10:36:35 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0) 
2026/03/13 10:36:35 [notice] 1#1: OS: Linux 6.8.0-101-generic
2026/03/13 10:36:35 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/03/13 10:36:35 [notice] 1#1: start worker processes
2026/03/13 10:36:35 [notice] 1#1: start worker process 29
2026/03/13 10:36:35 [notice] 1#1: start worker process 30
2026/03/13 10:36:35 [notice] 1#1: start worker process 31
2026/03/13 10:36:35 [notice] 1#1: start worker process 32
2026/03/13 10:36:35 [notice] 1#1: start worker process 33
2026/03/13 10:36:35 [notice] 1#1: start worker process 34
```
#### API Logs (Tail 50)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 encrypt with Dotenvx: https://dotenvx.com

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773398195870,"pid":1,"hostname":"efa4b21de28d","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773398195871,"pid":1,"hostname":"efa4b21de28d","msg":"Session manager initialized"}
{"level":30,"time":1773398195872,"pid":1,"hostname":"efa4b21de28d","msg":"Tool handlers registered"}
{"level":30,"time":1773398196152,"pid":1,"hostname":"efa4b21de28d","msg":"Admin roles synchronized"}
{"level":30,"time":1773398196372,"pid":1,"hostname":"efa4b21de28d","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773398196372,"pid":1,"hostname":"efa4b21de28d","context":"fastify","msg":"Server listening at http://172.18.0.4:4001"}
{"level":30,"time":1773398196372,"pid":1,"hostname":"efa4b21de28d","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773398204682,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":50252},"msg":"incoming request"}
{"level":30,"time":1773398204693,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":10.654928982257843,"msg":"request completed"}
{"level":30,"time":1773398214794,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":32918},"msg":"incoming request"}
{"level":30,"time":1773398214799,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":3.0360229909420013,"msg":"request completed"}
{"level":30,"time":1773398224936,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53070},"msg":"incoming request"}
{"level":30,"time":1773398224938,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":2.067775994539261,"msg":"request completed"}
{"level":30,"time":1773398235092,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49328},"msg":"incoming request"}
{"level":30,"time":1773398235094,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.4671519994735718,"msg":"request completed"}
{"level":30,"time":1773398245207,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-5","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49132},"msg":"incoming request"}
{"level":30,"time":1773398245209,"pid":1,"hostname":"efa4b21de28d","context":"fastify","reqId":"req-5","res":{"statusCode":200},"responseTime":1.0474829971790314,"msg":"request completed"}
```
