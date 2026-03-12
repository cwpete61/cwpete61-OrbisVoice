### deployment Diagnostics
#### API Logs (Last 50 lines)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚡️ secrets for agents: https://dotenvx.com/as2

⚠️  WARNING: Missing production environment variables:
   - STRIPE_API_KEY
   - STRIPE_WEBHOOK_SECRET
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773340367072,"pid":1,"hostname":"0d78d0356950","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773340367073,"pid":1,"hostname":"0d78d0356950","msg":"Session manager initialized"}
{"level":30,"time":1773340367073,"pid":1,"hostname":"0d78d0356950","msg":"Tool handlers registered"}
{"level":50,"time":1773340367253,"pid":1,"hostname":"0d78d0356950","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7268)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:131:13)","code":"P2021","meta":{"modelName":"User","table":"public.User"},"clientVersion":"6.19.2","name":"PrismaClientKnownRequestError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773340367434,"pid":1,"hostname":"0d78d0356950","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773340367434,"pid":1,"hostname":"0d78d0356950","context":"fastify","msg":"Server listening at http://172.18.0.4:4001"}
{"level":30,"time":1773340367434,"pid":1,"hostname":"0d78d0356950","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773340375890,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":47208},"msg":"incoming request"}
{"level":30,"time":1773340375902,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":10.255137994885445,"msg":"request completed"}
{"level":30,"time":1773340386004,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":51702},"msg":"incoming request"}
{"level":30,"time":1773340386006,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.2779130041599274,"msg":"request completed"}
{"level":30,"time":1773340396111,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":52404},"msg":"incoming request"}
{"level":30,"time":1773340396114,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":2.9422819912433624,"msg":"request completed"}
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1117874,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1117900,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1117700,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1117446,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1117885,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1117907,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1117706,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1117456,fd=8))              
```
#### Container Status
```
NAMES                           STATUS                    PORTS
orbisvoice-nginx-prod           Up 30 seconds             0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up 31 seconds             3000/tcp
orbisvoice-voice-gateway-prod   Up 31 seconds             4001/tcp
orbisvoice-api-prod             Up 31 seconds (healthy)   0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp
orbisvoice-postgres-prod        Up 42 seconds (healthy)   0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up 42 seconds (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
orbis-local-app                 Up 37 hours               0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
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
2026/03/12 18:32:46 [notice] 1#1: using the "epoll" event method
2026/03/12 18:32:46 [notice] 1#1: nginx/1.29.6
2026/03/12 18:32:46 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0) 
2026/03/12 18:32:46 [notice] 1#1: OS: Linux 6.8.0-101-generic
2026/03/12 18:32:46 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/03/12 18:32:46 [notice] 1#1: start worker processes
2026/03/12 18:32:46 [notice] 1#1: start worker process 29
2026/03/12 18:32:46 [notice] 1#1: start worker process 30
2026/03/12 18:32:46 [notice] 1#1: start worker process 31
2026/03/12 18:32:46 [notice] 1#1: start worker process 32
2026/03/12 18:32:46 [notice] 1#1: start worker process 33
2026/03/12 18:32:46 [notice] 1#1: start worker process 34
```
#### API Logs (Tail 50)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚡️ secrets for agents: https://dotenvx.com/as2

⚠️  WARNING: Missing production environment variables:
   - STRIPE_API_KEY
   - STRIPE_WEBHOOK_SECRET
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773340367072,"pid":1,"hostname":"0d78d0356950","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773340367073,"pid":1,"hostname":"0d78d0356950","msg":"Session manager initialized"}
{"level":30,"time":1773340367073,"pid":1,"hostname":"0d78d0356950","msg":"Tool handlers registered"}
{"level":50,"time":1773340367253,"pid":1,"hostname":"0d78d0356950","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7268)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:131:13)","code":"P2021","meta":{"modelName":"User","table":"public.User"},"clientVersion":"6.19.2","name":"PrismaClientKnownRequestError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773340367434,"pid":1,"hostname":"0d78d0356950","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773340367434,"pid":1,"hostname":"0d78d0356950","context":"fastify","msg":"Server listening at http://172.18.0.4:4001"}
{"level":30,"time":1773340367434,"pid":1,"hostname":"0d78d0356950","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773340375890,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":47208},"msg":"incoming request"}
{"level":30,"time":1773340375902,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":10.255137994885445,"msg":"request completed"}
{"level":30,"time":1773340386004,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":51702},"msg":"incoming request"}
{"level":30,"time":1773340386006,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.2779130041599274,"msg":"request completed"}
{"level":30,"time":1773340396111,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":52404},"msg":"incoming request"}
{"level":30,"time":1773340396114,"pid":1,"hostname":"0d78d0356950","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":2.9422819912433624,"msg":"request completed"}
```
