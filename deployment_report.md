### deployment Diagnostics
#### Container Status
```
NAMES                           STATUS                        PORTS
orbisvoice-nginx-prod           Up About a minute             0.0.0.0:80->80/tcp, [::]:80->80/tcp, 0.0.0.0:443->443/tcp, [::]:443->443/tcp
orbisvoice-web-prod             Up About a minute             3000/tcp
orbisvoice-voice-gateway-prod   Up About a minute             4001/tcp
orbisvoice-api-prod             Up About a minute (healthy)   0.0.0.0:4001->4001/tcp, [::]:4001->4001/tcp
orbisvoice-postgres-prod        Up About a minute (healthy)   0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up About a minute (healthy)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:80        0.0.0.0:*    users:(("docker-proxy",pid=1738023,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:443       0.0.0.0:*    users:(("docker-proxy",pid=1738045,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:4001      0.0.0.0:*    users:(("docker-proxy",pid=1737850,fd=8))              
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1737590,fd=8))              
tcp   LISTEN 0      4096            [::]:80           [::]:*    users:(("docker-proxy",pid=1738030,fd=8))              
tcp   LISTEN 0      4096            [::]:443          [::]:*    users:(("docker-proxy",pid=1738051,fd=8))              
tcp   LISTEN 0      4096            [::]:4001         [::]:*    users:(("docker-proxy",pid=1737855,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1737599,fd=8))              
```
#### API Logs (Last 50 lines)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }
{"level":40,"time":1773435791420,"pid":1,"hostname":"312ce9768eb5","keyLength":0,"isString":true,"val":"[REDACTED]","msg":"StripeClient initialized without a valid API key. Stripe features will be disabled."}
{"level":30,"time":1773435793002,"pid":1,"hostname":"312ce9768eb5","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773435793003,"pid":1,"hostname":"312ce9768eb5","msg":"Session manager initialized"}
{"level":30,"time":1773435793003,"pid":1,"hostname":"312ce9768eb5","msg":"Tool handlers registered"}
{"level":30,"time":1773435793230,"pid":1,"hostname":"312ce9768eb5","msg":"Admin roles synchronized"}
{"level":30,"time":1773435793246,"pid":1,"hostname":"312ce9768eb5","msg":"Admin bootstrap completed"}
{"level":40,"time":1773435793301,"pid":1,"hostname":"312ce9768eb5","keyLength":0,"isString":true,"val":"[REDACTED]","msg":"StripeClient initialized without a valid API key. Stripe features will be disabled."}
{"level":30,"time":1773435793502,"pid":1,"hostname":"312ce9768eb5","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773435793502,"pid":1,"hostname":"312ce9768eb5","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773435793502,"pid":1,"hostname":"312ce9768eb5","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773435800798,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":44852},"msg":"incoming request"}
{"level":30,"time":1773435800819,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":18.827238976955414,"msg":"request completed"}
{"level":30,"time":1773435810945,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":51206},"msg":"incoming request"}
{"level":30,"time":1773435810947,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.2386900186538696,"msg":"request completed"}
{"level":30,"time":1773435821104,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":39196},"msg":"incoming request"}
{"level":30,"time":1773435821106,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":2.579919993877411,"msg":"request completed"}
{"level":30,"time":1773435831271,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":35090},"msg":"incoming request"}
{"level":30,"time":1773435831273,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.8685299754142761,"msg":"request completed"}
{"level":30,"time":1773435841439,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-5","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":37600},"msg":"incoming request"}
{"level":30,"time":1773435841441,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-5","res":{"statusCode":200},"responseTime":1.2361650168895721,"msg":"request completed"}
{"level":30,"time":1773435851556,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-6","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49206},"msg":"incoming request"}
{"level":30,"time":1773435851558,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-6","res":{"statusCode":200},"responseTime":1.7775799930095673,"msg":"request completed"}
{"level":30,"time":1773435861718,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-7","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":34888},"msg":"incoming request"}
{"level":30,"time":1773435861720,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-7","res":{"statusCode":200},"responseTime":1.2072519958019257,"msg":"request completed"}
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
```
#### API Logs (Tail 50)
```
[dotenv@17.3.1] injecting env (0) from .env -- tip: ⚙️  enable debug logging with { debug: true }

⚠️  WARNING: Missing production environment variables:
   - STRIPE_API_KEY (empty string)
   - STRIPE_WEBHOOK_SECRET
   - OPENAI_API_KEY
Some features (Payment, Login, AI) may not work correctly.

{"level":40,"time":1773435791420,"pid":1,"hostname":"312ce9768eb5","keyLength":0,"isString":true,"val":"[REDACTED]","msg":"StripeClient initialized without a valid API key. Stripe features will be disabled."}
{"level":30,"time":1773435793002,"pid":1,"hostname":"312ce9768eb5","msg":"Session manager initialized with Redis"}
{"level":30,"time":1773435793003,"pid":1,"hostname":"312ce9768eb5","msg":"Session manager initialized"}
{"level":30,"time":1773435793003,"pid":1,"hostname":"312ce9768eb5","msg":"Tool handlers registered"}
{"level":30,"time":1773435793230,"pid":1,"hostname":"312ce9768eb5","msg":"Admin roles synchronized"}
{"level":30,"time":1773435793246,"pid":1,"hostname":"312ce9768eb5","msg":"Admin bootstrap completed"}
{"level":40,"time":1773435793301,"pid":1,"hostname":"312ce9768eb5","keyLength":0,"isString":true,"val":"[REDACTED]","msg":"StripeClient initialized without a valid API key. Stripe features will be disabled."}
{"level":30,"time":1773435793502,"pid":1,"hostname":"312ce9768eb5","context":"fastify","msg":"Server listening at http://127.0.0.1:4001"}
{"level":30,"time":1773435793502,"pid":1,"hostname":"312ce9768eb5","context":"fastify","msg":"Server listening at http://172.18.0.5:4001"}
{"level":30,"time":1773435793502,"pid":1,"hostname":"312ce9768eb5","msg":"Server running at http://0.0.0.0:4001"}
{"level":30,"time":1773435800798,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-1","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":44852},"msg":"incoming request"}
{"level":30,"time":1773435800819,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-1","res":{"statusCode":200},"responseTime":18.827238976955414,"msg":"request completed"}
{"level":30,"time":1773435810945,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-2","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":51206},"msg":"incoming request"}
{"level":30,"time":1773435810947,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-2","res":{"statusCode":200},"responseTime":1.2386900186538696,"msg":"request completed"}
{"level":30,"time":1773435821104,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":39196},"msg":"incoming request"}
{"level":30,"time":1773435821106,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-3","res":{"statusCode":200},"responseTime":2.579919993877411,"msg":"request completed"}
{"level":30,"time":1773435831271,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":35090},"msg":"incoming request"}
{"level":30,"time":1773435831273,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-4","res":{"statusCode":200},"responseTime":1.8685299754142761,"msg":"request completed"}
{"level":30,"time":1773435841439,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-5","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":37600},"msg":"incoming request"}
{"level":30,"time":1773435841441,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-5","res":{"statusCode":200},"responseTime":1.2361650168895721,"msg":"request completed"}
{"level":30,"time":1773435851556,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-6","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":49206},"msg":"incoming request"}
{"level":30,"time":1773435851558,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-6","res":{"statusCode":200},"responseTime":1.7775799930095673,"msg":"request completed"}
{"level":30,"time":1773435861718,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-7","req":{"method":"GET","url":"/health","host":"localhost:4001","remoteAddress":"127.0.0.1","remotePort":34888},"msg":"incoming request"}
{"level":30,"time":1773435861720,"pid":1,"hostname":"312ce9768eb5","context":"fastify","reqId":"req-7","res":{"statusCode":200},"responseTime":1.2072519958019257,"msg":"request completed"}
```
