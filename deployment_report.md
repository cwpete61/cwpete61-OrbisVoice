### deployment Diagnostics
#### Prisma Push Log (Out-of-Band)
```
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "orbisvoice", schema "public" at "postgres:5432"

🚀  Your database is now in sync with your Prisma schema. Done in 1.25s

Running generate... (Use --skip-generate to skip the generators)
[2K[1A[2K[GRunning generate... - Prisma Client
[2K[1A[2K[G✔ Generated Prisma Client (v6.19.2) to ./../../node_modules/@prisma/client in 9
73ms
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
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🤖 agentic secret storage: https://dotenvx.com/as2

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773390547324,"pid":1,"hostname":"9baddd1040e8","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773390547325,"pid":1,"hostname":"9baddd1040e8","msg":"Session manager initialized"}
{"level":30,"time":1773390547325,"pid":1,"hostname":"9baddd1040e8","msg":"Tool handlers registered"}
{"level":50,"time":1773390547493,"pid":1,"hostname":"9baddd1040e8","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.user.findFirst()` invocation:\n\n\nThe table `public.User` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.user.findFirst()` invocation:\n\n\nThe table `public.User` does not exist in the current database.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7268)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:137:32)","code":"P2021","meta":{"modelName":"User","table":"public.User"},"clientVersion":"6.19.2","name":"PrismaClientKnownRequestError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773390547717,"pid":1,"hostname":"9baddd1040e8","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773390547717,"pid":1,"hostname":"9baddd1040e8","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773390547717,"pid":1,"hostname":"9baddd1040e8","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773390556165,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":52300},"msg":"incoming request"}
{"level":30,"time":1773390556175,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":8.789608001708984,"msg":"request completed"}
{"level":30,"time":1773390566262,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":50164},"msg":"incoming request"}
{"level":30,"time":1773390566265,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":2.1666919887065887,"msg":"request completed"}
{"level":30,"time":1773390576381,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49064},"msg":"incoming request"}
{"level":30,"time":1773390576383,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":1.9511519968509674,"msg":"request completed"}
{"level":30,"time":1773390586480,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":59492},"msg":"incoming request"}
{"level":30,"time":1773390586482,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.7638940215110779,"msg":"request completed"}
{"level":30,"time":1773390596584,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-5","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":54358},"msg":"incoming request"}
{"level":30,"time":1773390596585,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-5","res":{"statusCode":200},"responseTime":1.024060994386673,"msg":"request completed"}
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1444966,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1444994,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1444798,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1444512,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1444974,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1445002,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1444805,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1444519,fd=8))              
```
#### Container Status
```
NAMES                           STATUS                        PORTS
orbisvoice-nginx-prod           Up 57 seconds                 0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up 58 seconds                 3000/tcp
orbisvoice-voice-gateway-prod   Up 58 seconds                 4001/tcp
orbisvoice-api-prod             Up 58 seconds (healthy)       0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp
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
2026/03/13 08:29:07 [notice] 1#1: using the "epoll" event method
2026/03/13 08:29:07 [notice] 1#1: nginx/1.29.6
2026/03/13 08:29:07 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0) 
2026/03/13 08:29:07 [notice] 1#1: OS: Linux 6.8.0-101-generic
2026/03/13 08:29:07 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/03/13 08:29:07 [notice] 1#1: start worker processes
2026/03/13 08:29:07 [notice] 1#1: start worker process 29
2026/03/13 08:29:07 [notice] 1#1: start worker process 30
2026/03/13 08:29:07 [notice] 1#1: start worker process 31
2026/03/13 08:29:07 [notice] 1#1: start worker process 32
2026/03/13 08:29:07 [notice] 1#1: start worker process 33
2026/03/13 08:29:07 [notice] 1#1: start worker process 34
```
#### API Logs (Tail 50)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🤖 agentic secret storage: https://dotenvx.com/as2

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773390547324,"pid":1,"hostname":"9baddd1040e8","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773390547325,"pid":1,"hostname":"9baddd1040e8","msg":"Session manager initialized"}
{"level":30,"time":1773390547325,"pid":1,"hostname":"9baddd1040e8","msg":"Tool handlers registered"}
{"level":50,"time":1773390547493,"pid":1,"hostname":"9baddd1040e8","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.user.findFirst()` invocation:\n\n\nThe table `public.User` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.user.findFirst()` invocation:\n\n\nThe table `public.User` does not exist in the current database.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7268)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:137:32)","code":"P2021","meta":{"modelName":"User","table":"public.User"},"clientVersion":"6.19.2","name":"PrismaClientKnownRequestError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773390547717,"pid":1,"hostname":"9baddd1040e8","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773390547717,"pid":1,"hostname":"9baddd1040e8","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773390547717,"pid":1,"hostname":"9baddd1040e8","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773390556165,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":52300},"msg":"incoming request"}
{"level":30,"time":1773390556175,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":8.789608001708984,"msg":"request completed"}
{"level":30,"time":1773390566262,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":50164},"msg":"incoming request"}
{"level":30,"time":1773390566265,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":2.1666919887065887,"msg":"request completed"}
{"level":30,"time":1773390576381,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49064},"msg":"incoming request"}
{"level":30,"time":1773390576383,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":1.9511519968509674,"msg":"request completed"}
{"level":30,"time":1773390586480,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":59492},"msg":"incoming request"}
{"level":30,"time":1773390586482,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.7638940215110779,"msg":"request completed"}
{"level":30,"time":1773390596584,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-5","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":54358},"msg":"incoming request"}
{"level":30,"time":1773390596585,"pid":1,"hostname":"9baddd1040e8","context":"fastify","reqId":"req-5","res":{"statusCode":200},"responseTime":1.024060994386673,"msg":"request completed"}
```
