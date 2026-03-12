### deployment Diagnostics
#### Prisma Push Log (Out-of-Band)
```
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "orbisvoice", schema "public" at "postgres:5432"

🚀  Your database is now in sync with your Prisma schema. Done in 1.27s

Running generate... (Use --skip-generate to skip the generators)
[2K[1A[2K[GRunning generate... - Prisma Client
[2K[1A[2K[G✔ Generated Prisma Client (v6.19.2) to ./../../node_modules/@prisma/client in 1
.04s
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
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773353686060,"pid":1,"hostname":"f972803570b1","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773353686061,"pid":1,"hostname":"f972803570b1","msg":"Session manager initialized"}
{"level":30,"time":1773353686061,"pid":1,"hostname":"f972803570b1","msg":"Tool handlers registered"}
{"level":50,"time":1773353686262,"pid":1,"hostname":"f972803570b1","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7268)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:131:13)","code":"P2021","meta":{"modelName":"User","table":"public.User"},"clientVersion":"6.19.2","name":"PrismaClientKnownRequestError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773353686505,"pid":1,"hostname":"f972803570b1","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773353686505,"pid":1,"hostname":"f972803570b1","context":"fastify","msg":"Server listening at http://172.18.0.4:4001"}
{"level":30,"time":1773353686505,"pid":1,"hostname":"f972803570b1","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773353694689,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":48738},"msg":"incoming request"}
{"level":30,"time":1773353694705,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":15.040950000286102,"msg":"request completed"}
{"level":30,"time":1773353704853,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":56958},"msg":"incoming request"}
{"level":30,"time":1773353704854,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.5769180059432983,"msg":"request completed"}
{"level":30,"time":1773353714973,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":38150},"msg":"incoming request"}
{"level":30,"time":1773353714980,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":6.614038020372391,"msg":"request completed"}
{"level":30,"time":1773353725111,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53640},"msg":"incoming request"}
{"level":30,"time":1773353725113,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.3801019787788391,"msg":"request completed"}
{"level":30,"time":1773353735250,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-5","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":48352},"msg":"incoming request"}
{"level":30,"time":1773353735253,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-5","res":{"statusCode":200},"responseTime":2.2817550003528595,"msg":"request completed"}
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1211374,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1211400,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1211198,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1210945,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1211380,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1211406,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1211204,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1210951,fd=8))              
```
#### Container Status
```
NAMES                           STATUS                        PORTS
orbisvoice-nginx-prod           Up About a minute             0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up About a minute             3000/tcp
orbisvoice-voice-gateway-prod   Up About a minute             4001/tcp
orbisvoice-api-prod             Up About a minute (healthy)   0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp
orbisvoice-postgres-prod        Up About a minute (healthy)   0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up About a minute (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
orbis-local-app                 Up 41 hours                   0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
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
2026/03/12 22:14:45 [notice] 1#1: using the "epoll" event method
2026/03/12 22:14:45 [notice] 1#1: nginx/1.29.6
2026/03/12 22:14:45 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0) 
2026/03/12 22:14:45 [notice] 1#1: OS: Linux 6.8.0-101-generic
2026/03/12 22:14:45 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/03/12 22:14:45 [notice] 1#1: start worker processes
2026/03/12 22:14:45 [notice] 1#1: start worker process 30
2026/03/12 22:14:45 [notice] 1#1: start worker process 31
2026/03/12 22:14:45 [notice] 1#1: start worker process 32
2026/03/12 22:14:45 [notice] 1#1: start worker process 33
2026/03/12 22:14:45 [notice] 1#1: start worker process 34
2026/03/12 22:14:45 [notice] 1#1: start worker process 35
```
#### API Logs (Tail 50)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773353686060,"pid":1,"hostname":"f972803570b1","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773353686061,"pid":1,"hostname":"f972803570b1","msg":"Session manager initialized"}
{"level":30,"time":1773353686061,"pid":1,"hostname":"f972803570b1","msg":"Tool handlers registered"}
{"level":50,"time":1773353686262,"pid":1,"hostname":"f972803570b1","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7268)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:131:13)","code":"P2021","meta":{"modelName":"User","table":"public.User"},"clientVersion":"6.19.2","name":"PrismaClientKnownRequestError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773353686505,"pid":1,"hostname":"f972803570b1","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773353686505,"pid":1,"hostname":"f972803570b1","context":"fastify","msg":"Server listening at http://172.18.0.4:4001"}
{"level":30,"time":1773353686505,"pid":1,"hostname":"f972803570b1","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773353694689,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":48738},"msg":"incoming request"}
{"level":30,"time":1773353694705,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":15.040950000286102,"msg":"request completed"}
{"level":30,"time":1773353704853,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":56958},"msg":"incoming request"}
{"level":30,"time":1773353704854,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.5769180059432983,"msg":"request completed"}
{"level":30,"time":1773353714973,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":38150},"msg":"incoming request"}
{"level":30,"time":1773353714980,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":6.614038020372391,"msg":"request completed"}
{"level":30,"time":1773353725111,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53640},"msg":"incoming request"}
{"level":30,"time":1773353725113,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.3801019787788391,"msg":"request completed"}
{"level":30,"time":1773353735250,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-5","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":48352},"msg":"incoming request"}
{"level":30,"time":1773353735253,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-5","res":{"statusCode":200},"responseTime":2.2817550003528595,"msg":"request completed"}
{"level":30,"time":1773353745460,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-6","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":43110},"msg":"incoming request"}
{"level":30,"time":1773353745464,"pid":1,"hostname":"f972803570b1","context":"fastify","reqId":"req-6","res":{"statusCode":200},"responseTime":1.8296769857406616,"msg":"request completed"}
```
