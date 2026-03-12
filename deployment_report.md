### deployment Diagnostics
#### File Health Check
```
-rw-r--r-- 1 1001 1001 3700 Mar 12 18:40 /opt/orbisvoice/nginx/nginx.conf
-rw-r--r-- 1 1001 1001 62 Mar 12 18:40 /opt/orbisvoice/nginx/certs/cert.pem
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1095959,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1095983,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1095781,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1095563,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1095965,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1095989,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1095788,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1095574,fd=8))              
```
#### Container Status
```
NAMES                           STATUS                    PORTS
orbisvoice-nginx-prod           Up 20 seconds             0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up 21 seconds             3000/tcp
orbisvoice-api-prod             Up 21 seconds (healthy)   0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp
orbisvoice-voice-gateway-prod   Up 21 seconds             4001/tcp
orbisvoice-postgres-prod        Up 33 seconds (healthy)   0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up 33 seconds (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
orbis-local-app                 Up 36 hours               0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
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
2026/03/12 17:41:56 [notice] 1#1: using the "epoll" event method
2026/03/12 17:41:56 [notice] 1#1: nginx/1.29.6
2026/03/12 17:41:56 [notice] 1#1: built by gcc 15.2.0 (Alpine 15.2.0) 
2026/03/12 17:41:56 [notice] 1#1: OS: Linux 6.8.0-101-generic
2026/03/12 17:41:56 [notice] 1#1: getrlimit(RLIMIT_NOFILE): 1024:524288
2026/03/12 17:41:56 [notice] 1#1: start worker processes
2026/03/12 17:41:56 [notice] 1#1: start worker process 30
2026/03/12 17:41:56 [notice] 1#1: start worker process 31
2026/03/12 17:41:56 [notice] 1#1: start worker process 32
2026/03/12 17:41:56 [notice] 1#1: start worker process 33
2026/03/12 17:41:56 [notice] 1#1: start worker process 34
2026/03/12 17:41:56 [notice] 1#1: start worker process 35
```
#### API Logs (Tail 50)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🤖 agentic secret storage: https://dotenvx.com/as2

⚠️  WARNING: Missing production environment variables:
   - STRIPE_API_KEY
   - STRIPE_WEBHOOK_SECRET
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":30,"time":1773337316887,"pid":1,"hostname":"76d883c066e8","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773337316888,"pid":1,"hostname":"76d883c066e8","msg":"Session manager initialized"}
{"level":30,"time":1773337316888,"pid":1,"hostname":"76d883c066e8","msg":"Tool handlers registered"}
{"level":50,"time":1773337317054,"pid":1,"hostname":"76d883c066e8","err":{"type":"PrismaClientInitializationError","message":"\nInvalid `prisma.user.updateMany()` invocation:\n\n\nAuthentication failed against database server, the provided database credentials for `postgres` are not valid.\n\nPlease make sure to provide valid database credentials for the database server at the configured address.","stack":"PrismaClientInitializationError: \nInvalid `prisma.user.updateMany()` invocation:\n\n\nAuthentication failed against database server, the provided database credentials for `postgres` are not valid.\n\nPlease make sure to provide valid database credentials for the database server at the configured address.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7568)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:131:13)","clientVersion":"6.19.2","name":"PrismaClientInitializationError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773337317263,"pid":1,"hostname":"76d883c066e8","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773337317263,"pid":1,"hostname":"76d883c066e8","context":"fastify","msg":"Server listening at http://172.18.0.4:4001"}
{"level":30,"time":1773337317263,"pid":1,"hostname":"76d883c066e8","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773337325476,"pid":1,"hostname":"76d883c066e8","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":33972},"msg":"incoming request"}
{"level":30,"time":1773337325499,"pid":1,"hostname":"76d883c066e8","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":22.131242990493774,"msg":"request completed"}
{"level":30,"time":1773337335616,"pid":1,"hostname":"76d883c066e8","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":59120},"msg":"incoming request"}
{"level":30,"time":1773337335617,"pid":1,"hostname":"76d883c066e8","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.0155540108680725,"msg":"request completed"}
```
