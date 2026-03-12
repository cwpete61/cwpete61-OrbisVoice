### deployment Diagnostics
#### File Layout
```
/opt/orbisvoice:
deployment_report.md
docker-compose.prod.yml
nginx

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
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1067677,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1067704,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1067086,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1067688,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1067710,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1067095,fd=8))              
```
#### Container Status
```
CONTAINER ID   IMAGE                                              COMMAND                  CREATED          STATUS                         PORTS                                                                          NAMES
f7c4e9c5e31d   nginx:alpine                                       "/docker-entrypoint.…"   33 seconds ago   Up 20 seconds                  0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp   orbisvoice-nginx-prod
fb8d8fe1815e   ghcr.io/cwpete61/orbisvoice-web:latest             "docker-entrypoint.s…"   33 seconds ago   Up 20 seconds                  3000/tcp                                                                       orbisvoice-web-prod
a1d5a1c79818   ghcr.io/cwpete61/orbisvoice-voice-gateway:latest   "docker-entrypoint.s…"   34 seconds ago   Restarting (1) 4 seconds ago                                                                                  orbisvoice-voice-gateway-prod
ebd3c873375a   ghcr.io/cwpete61/orbisvoice-api:latest             "docker-entrypoint.s…"   34 seconds ago   Restarting (1) 3 seconds ago                                                                                  orbisvoice-api-prod
dfcb0f97acf5   postgres:15-alpine                                 "docker-entrypoint.s…"   36 seconds ago   Up 32 seconds (healthy)        0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp                                    orbisvoice-postgres-prod
1ee11c65d41c   redis:7-alpine                                     "docker-entrypoint.s…"   36 seconds ago   Up 32 seconds (healthy)        0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp                                    orbisvoice-redis-prod
378d39a98e68   orbis_geo-orbis-local                              "node dashboard/serv…"   6 days ago       Up 35 hours                    0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp                                    orbis-local-app
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
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  load multiple .env files with { path: ['.env.local', '.env'] }
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  suppress all logs with { quiet: true }
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🔐 prevent building .env in docker: https://dotenvx.com/prebuild
[dotenv@17.3.1] injecting env (0) from .env -- tip: 🛡️ auth for agents: https://vestauth.com
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚡️ secrets for agents: https://dotenvx.com/as2
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  write to custom object with { processEnv: myObject }
```
