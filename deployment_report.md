### deployment Diagnostics
#### API Logs (Last 50 lines)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🤖 agentic secret storage: https://dotenvx.com/as2

⚠️  WARNING: Missing production environment variables:
   - STRIPE_API_KEY
   - STRIPE_WEBHOOK_SECRET
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773339380674,"pid":1,"hostname":"03262094514d","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773339380675,"pid":1,"hostname":"03262094514d","msg":"Session manager initialized"}
{"level":30,"time":1773339380675,"pid":1,"hostname":"03262094514d","msg":"Tool handlers registered"}
{"level":50,"time":1773339380875,"pid":1,"hostname":"03262094514d","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7268)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:131:13)","code":"P2021","meta":{"modelName":"User","table":"public.User"},"clientVersion":"6.19.2","name":"PrismaClientKnownRequestError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773339381102,"pid":1,"hostname":"03262094514d","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773339381102,"pid":1,"hostname":"03262094514d","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773339381102,"pid":1,"hostname":"03262094514d","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773339389572,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":47776},"msg":"incoming request"}
{"level":30,"time":1773339389585,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":11.498659998178482,"msg":"request completed"}
{"level":30,"time":1773339399696,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":38062},"msg":"incoming request"}
{"level":30,"time":1773339399698,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.5977219939231873,"msg":"request completed"}
{"level":30,"time":1773339409800,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":41270},"msg":"incoming request"}
{"level":30,"time":1773339409802,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":1.958862990140915,"msg":"request completed"}
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1110728,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1110755,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1110561,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1110270,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1110736,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1110761,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1110568,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1110276,fd=8))              
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
2026/03/12 18:16:20 [notice] 1#1: using the "epoll" event method
2026/03/12 18:16:20 [notice] 1#1: nginx/1.29.6
2026/03/12 18:16:20 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0) 
2026/03/12 18:16:20 [notice] 1#1: OS: Linux 6.8.0-101-generic
2026/03/12 18:16:20 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/03/12 18:16:20 [notice] 1#1: start worker processes
2026/03/12 18:16:20 [notice] 1#1: start worker process 30
2026/03/12 18:16:20 [notice] 1#1: start worker process 31
2026/03/12 18:16:20 [notice] 1#1: start worker process 32
2026/03/12 18:16:20 [notice] 1#1: start worker process 33
2026/03/12 18:16:20 [notice] 1#1: start worker process 34
2026/03/12 18:16:20 [notice] 1#1: start worker process 35
```
#### API Logs (Tail 50)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🤖 agentic secret storage: https://dotenvx.com/as2

⚠️  WARNING: Missing production environment variables:
   - STRIPE_API_KEY
   - STRIPE_WEBHOOK_SECRET
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773339380674,"pid":1,"hostname":"03262094514d","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773339380675,"pid":1,"hostname":"03262094514d","msg":"Session manager initialized"}
{"level":30,"time":1773339380675,"pid":1,"hostname":"03262094514d","msg":"Tool handlers registered"}
{"level":50,"time":1773339380875,"pid":1,"hostname":"03262094514d","err":{"type":"PrismaClientKnownRequestError","message":"\nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.","stack":"PrismaClientKnownRequestError: \nInvalid `prisma.user.updateMany()` invocation:\n\n\nThe table `public.User` does not exist in the current database.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7268)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:131:13)","code":"P2021","meta":{"modelName":"User","table":"public.User"},"clientVersion":"6.19.2","name":"PrismaClientKnownRequestError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773339381102,"pid":1,"hostname":"03262094514d","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773339381102,"pid":1,"hostname":"03262094514d","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773339381102,"pid":1,"hostname":"03262094514d","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773339389572,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":47776},"msg":"incoming request"}
{"level":30,"time":1773339389585,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":11.498659998178482,"msg":"request completed"}
{"level":30,"time":1773339399696,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":38062},"msg":"incoming request"}
{"level":30,"time":1773339399698,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.5977219939231873,"msg":"request completed"}
{"level":30,"time":1773339409800,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":41270},"msg":"incoming request"}
{"level":30,"time":1773339409802,"pid":1,"hostname":"03262094514d","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":1.958862990140915,"msg":"request completed"}
```
