### deployment Diagnostics
#### File Layout
```
/opt/orbisvoice:
backups
deployment_report.md
docker-compose.prod.yml
nginx

/opt/orbisvoice/backups:
db_backup_20260312_180856.sql

/opt/orbisvoice/nginx:
certs
nginx.conf

/opt/orbisvoice/nginx/certs:
cert.pem
chain.pem
fullchain.pem
privkey.pem
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1083236,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1083261,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1083066,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1082803,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1083242,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1083268,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1083078,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1082809,fd=8))              
```
#### Container Status
```
CONTAINER ID   IMAGE                                              COMMAND                  CREATED          STATUS                    PORTS                                                                          NAMES
99e7cad63f2b   nginx:alpine                                       "/docker-entrypoint.…"   32 seconds ago   Up 20 seconds             0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp   orbisvoice-nginx-prod
a95e92ac4cc3   ghcr.io/cwpete61/orbisvoice-web:latest             "docker-entrypoint.s…"   33 seconds ago   Up 20 seconds             3000/tcp                                                                       orbisvoice-web-prod
60ccbf9716cb   ghcr.io/cwpete61/orbisvoice-api:latest             "docker-entrypoint.s…"   33 seconds ago   Up 21 seconds (healthy)   0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp                                    orbisvoice-api-prod
1e4be178b991   ghcr.io/cwpete61/orbisvoice-voice-gateway:latest   "docker-entrypoint.s…"   33 seconds ago   Up 21 seconds             4001/tcp                                                                       orbisvoice-voice-gateway-prod
996ab87f4df3   postgres:15-alpine                                 "docker-entrypoint.s…"   34 seconds ago   Up 32 seconds (healthy)   0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp                                    orbisvoice-postgres-prod
a2d29c8eb63c   redis:7-alpine                                     "docker-entrypoint.s…"   34 seconds ago   Up 32 seconds (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp                                    orbisvoice-redis-prod
378d39a98e68   orbis_geo-orbis-local                              "node dashboard/serv…"   6 days ago       Up 36 hours               0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp                                    orbis-local-app
```
#### Nginx Logs (First 50 lines)
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
```
#### API Logs (Last 100 lines)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
{"level":30,"time":1773335619739,"pid":1,"hostname":"60ccbf9716cb","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773335619740,"pid":1,"hostname":"60ccbf9716cb","msg":"Session manager initialized"}
{"level":30,"time":1773335619741,"pid":1,"hostname":"60ccbf9716cb","msg":"Tool handlers registered"}
{"level":50,"time":1773335619891,"pid":1,"hostname":"60ccbf9716cb","err":{"type":"PrismaClientInitializationError","message":"\nInvalid `prisma.user.updateMany()` invocation:\n\n\nAuthentication failed against database server, the provided database credentials for `postgres` are not valid.\n\nPlease make sure to provide valid database credentials for the database server at the configured address.","stack":"PrismaClientInitializationError: \nInvalid `prisma.user.updateMany()` invocation:\n\n\nAuthentication failed against database server, the provided database credentials for `postgres` are not valid.\n\nPlease make sure to provide valid database credentials for the database server at the configured address.\n    at ei.handleRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:7568)\n    at ei.handleAndLogRequestError (/app/node_modules/@prisma/client/runtime/library.js:121:6593)\n    at ei.request (/app/node_modules/@prisma/client/runtime/library.js:121:6300)\n    at async a (/app/node_modules/@prisma/client/runtime/library.js:130:9551)\n    at async start (/app/apps/api/dist/index.js:131:13)","clientVersion":"6.19.2","name":"PrismaClientInitializationError"},"msg":"Bootstrap failed"}
{"level":30,"time":1773335620094,"pid":1,"hostname":"60ccbf9716cb","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773335620095,"pid":1,"hostname":"60ccbf9716cb","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773335620095,"pid":1,"hostname":"60ccbf9716cb","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773335628634,"pid":1,"hostname":"60ccbf9716cb","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":57812},"msg":"incoming request"}
{"level":30,"time":1773335628648,"pid":1,"hostname":"60ccbf9716cb","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":12.450253993272781,"msg":"request completed"}
{"level":30,"time":1773335638729,"pid":1,"hostname":"60ccbf9716cb","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":51794},"msg":"incoming request"}
{"level":30,"time":1773335638732,"pid":1,"hostname":"60ccbf9716cb","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":3.1237040013074875,"msg":"request completed"}
```
