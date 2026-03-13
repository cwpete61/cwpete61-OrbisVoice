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
40ms
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
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773395984031,"pid":1,"hostname":"ac551f2b061e","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773395984032,"pid":1,"hostname":"ac551f2b061e","msg":"Session manager initialized"}
{"level":30,"time":1773395984032,"pid":1,"hostname":"ac551f2b061e","msg":"Tool handlers registered"}
{"level":30,"time":1773395984337,"pid":1,"hostname":"ac551f2b061e","msg":"Admin user created"}
{"level":30,"time":1773395984351,"pid":1,"hostname":"ac551f2b061e","msg":"Platform settings bootstrapped"}
{"level":30,"time":1773395984593,"pid":1,"hostname":"ac551f2b061e","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773395984594,"pid":1,"hostname":"ac551f2b061e","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773395984594,"pid":1,"hostname":"ac551f2b061e","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773395992868,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":33896},"msg":"incoming request"}
{"level":30,"time":1773395992876,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":7.351976990699768,"msg":"request completed"}
{"level":30,"time":1773396003073,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":38852},"msg":"incoming request"}
{"level":30,"time":1773396003077,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":2.948834002017975,"msg":"request completed"}
{"level":30,"time":1773396013192,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":43488},"msg":"incoming request"}
{"level":30,"time":1773396013194,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":1.6659919917583466,"msg":"request completed"}
{"level":30,"time":1773396023312,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53386},"msg":"incoming request"}
{"level":30,"time":1773396023314,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.794750988483429,"msg":"request completed"}
{"level":30,"time":1773396028627,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-5","req":{"method":"POST","url":"/auth/signup","host":"myorbisvoice.com","remoteAddress":"172.18.0.7","remotePort":38910},"msg":"incoming request"}
{"level":30,"time":1773396028865,"pid":1,"hostname":"ac551f2b061e","to":"talk@myorbisvoice.com","subject":"Verify your email address","body":"Welcome to OrbisVoice, Admin! Please verify your email address by clicking the link below:\n\nhttp://localhost:3000/verify-email?token=064298828cd37f9732a3e7f407929acf45302d1ef00513ebe91cead6e07d0583&email=talk%40myorbisvoice.com\n\nIf you did not create an account, please ignore this email.","msg":"📧 [EMAIL CONSOLE FALLBACK]"}

--- EMAIL EMULATION ---
To: talk@myorbisvoice.com
Subject: Verify your email address
Body: Welcome to OrbisVoice, Admin! Please verify your email address by clicking the link below:

http://localhost:3000/verify-email?token=064298828cd37f9732a3e7f407929acf45302d1ef00513ebe91cead6e07d0583&email=talk%40myorbisvoice.com

If you did not create an account, please ignore this email.
-----------------------

{"level":30,"time":1773396028879,"pid":1,"hostname":"ac551f2b061e","userId":"cmmoq7hc80004p101jnvl5g37","email":"talk@myorbisvoice.com","msg":"Verification email sent on signup"}
{"level":30,"time":1773396028880,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-5","res":{"statusCode":201},"responseTime":250.76166999340057,"msg":"request completed"}
{"level":30,"time":1773396033448,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-6","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":47552},"msg":"incoming request"}
{"level":30,"time":1773396033450,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-6","res":{"statusCode":200},"responseTime":1.2386490106582642,"msg":"request completed"}
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1480142,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1480166,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1479971,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1479734,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1480148,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1480174,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1479977,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1479745,fd=8))              
```
#### Container Status
```
NAMES                           STATUS                        PORTS
orbisvoice-nginx-prod           Up 57 seconds                 0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up 57 seconds                 3000/tcp
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
2026/03/13 09:59:43 [notice] 1#1: using the "epoll" event method
2026/03/13 09:59:43 [notice] 1#1: nginx/1.29.6
2026/03/13 09:59:43 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0) 
2026/03/13 09:59:43 [notice] 1#1: OS: Linux 6.8.0-101-generic
2026/03/13 09:59:43 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/03/13 09:59:43 [notice] 1#1: start worker processes
2026/03/13 09:59:43 [notice] 1#1: start worker process 30
2026/03/13 09:59:43 [notice] 1#1: start worker process 31
2026/03/13 09:59:43 [notice] 1#1: start worker process 32
2026/03/13 09:59:43 [notice] 1#1: start worker process 33
2026/03/13 09:59:43 [notice] 1#1: start worker process 34
2026/03/13 09:59:43 [notice] 1#1: start worker process 35
```
#### API Logs (Tail 50)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild

⚠️  WARNING: Missing production environment variables:
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773395984031,"pid":1,"hostname":"ac551f2b061e","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773395984032,"pid":1,"hostname":"ac551f2b061e","msg":"Session manager initialized"}
{"level":30,"time":1773395984032,"pid":1,"hostname":"ac551f2b061e","msg":"Tool handlers registered"}
{"level":30,"time":1773395984337,"pid":1,"hostname":"ac551f2b061e","msg":"Admin user created"}
{"level":30,"time":1773395984351,"pid":1,"hostname":"ac551f2b061e","msg":"Platform settings bootstrapped"}
{"level":30,"time":1773395984593,"pid":1,"hostname":"ac551f2b061e","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773395984594,"pid":1,"hostname":"ac551f2b061e","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773395984594,"pid":1,"hostname":"ac551f2b061e","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773395992868,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":33896},"msg":"incoming request"}
{"level":30,"time":1773395992876,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":7.351976990699768,"msg":"request completed"}
{"level":30,"time":1773396003073,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":38852},"msg":"incoming request"}
{"level":30,"time":1773396003077,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":2.948834002017975,"msg":"request completed"}
{"level":30,"time":1773396013192,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":43488},"msg":"incoming request"}
{"level":30,"time":1773396013194,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":1.6659919917583466,"msg":"request completed"}
{"level":30,"time":1773396023312,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":53386},"msg":"incoming request"}
{"level":30,"time":1773396023314,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.794750988483429,"msg":"request completed"}
{"level":30,"time":1773396028627,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-5","req":{"method":"POST","url":"/auth/signup","host":"myorbisvoice.com","remoteAddress":"172.18.0.7","remotePort":38910},"msg":"incoming request"}
{"level":30,"time":1773396028865,"pid":1,"hostname":"ac551f2b061e","to":"talk@myorbisvoice.com","subject":"Verify your email address","body":"Welcome to OrbisVoice, Admin! Please verify your email address by clicking the link below:\n\nhttp://localhost:3000/verify-email?token=064298828cd37f9732a3e7f407929acf45302d1ef00513ebe91cead6e07d0583&email=talk%40myorbisvoice.com\n\nIf you did not create an account, please ignore this email.","msg":"📧 [EMAIL CONSOLE FALLBACK]"}

--- EMAIL EMULATION ---
To: talk@myorbisvoice.com
Subject: Verify your email address
Body: Welcome to OrbisVoice, Admin! Please verify your email address by clicking the link below:

http://localhost:3000/verify-email?token=064298828cd37f9732a3e7f407929acf45302d1ef00513ebe91cead6e07d0583&email=talk%40myorbisvoice.com

If you did not create an account, please ignore this email.
-----------------------

{"level":30,"time":1773396028879,"pid":1,"hostname":"ac551f2b061e","userId":"cmmoq7hc80004p101jnvl5g37","email":"talk@myorbisvoice.com","msg":"Verification email sent on signup"}
{"level":30,"time":1773396028880,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-5","res":{"statusCode":201},"responseTime":250.76166999340057,"msg":"request completed"}
{"level":30,"time":1773396033448,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-6","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":47552},"msg":"incoming request"}
{"level":30,"time":1773396033450,"pid":1,"hostname":"ac551f2b061e","context":"fastify","reqId":"req-6","res":{"statusCode":200},"responseTime":1.2386490106582642,"msg":"request completed"}
```
