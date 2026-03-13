### deployment Diagnostics
#### Prisma Push Log (Out-of-Band)
```
Unable to find image 'ghcr.io/cwpete61/orbisvoice-api:latest' locally
latest: Pulling from cwpete61/orbisvoice-api
4f4fb700ef54: Pulling fs layer
e467536aa8b1: Pulling fs layer
217f5d1e5137: Pulling fs layer
3f4a34a73f27: Pulling fs layer
cf95a6c0d60c: Pulling fs layer
4f4fb700ef54: Already exists
217f5d1e5137: Already exists
e467536aa8b1: Already exists
cf95a6c0d60c: Already exists
3f4a34a73f27: Already exists
4f4fb700ef54: Pull complete
217f5d1e5137: Pull complete
3f4a34a73f27: Pull complete
cf95a6c0d60c: Pull complete
e467536aa8b1: Pull complete
Digest: sha256:481d86441126bd12b27595b8f467331d3c90f4b31fa9549a40d5ede71ec829ef
Status: Downloaded newer image for ghcr.io/cwpete61/orbisvoice-api:latest
warn The configuration property `package.json#prisma` is deprecated and will be removed in Prisma 7. Please migrate to a Prisma config file (e.g., `prisma.config.ts`).
For more information, see: https://pris.ly/prisma-config

Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "orbisvoice", schema "public" at "postgres:5432"

The database is already in sync with the Prisma schema.

Running generate... (Use --skip-generate to skip the generators)
[2K[1A[2K[GRunning generate... - Prisma Client
[2K[1A[2K[G✔ Generated Prisma Client (v6.19.2) to ./../../node_modules/@prisma/client in 5
57ms

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
```
#### Port Usage (Host)
```
tcp   LISTEN 0      4096         0.0.0.0:5440      0.0.0.0:*    users:(("docker-proxy",pid=1522579,fd=8))              
tcp   LISTEN 0      4096            [::]:5440         [::]:*    users:(("docker-proxy",pid=1522592,fd=8))              
```
#### Container Status
```
NAMES                           STATUS                            PORTS
orbisvoice-nginx-prod           Created                           
orbisvoice-web-prod             Created                           
orbisvoice-voice-gateway-prod   Created                           
orbisvoice-api-prod             Created                           
orbisvoice-postgres-prod        Up 4 seconds (health: starting)   0.0.0.0:5440->5432/tcp, [::]:5440->5432/tcp
orbisvoice-redis-prod           Up 4 seconds (health: starting)   0.0.0.0:6379->6379/tcp, [::]:6379->6379/tcp
orbis-local-app                 Up 2 days                         0.0.0.0:3000->3000/tcp, [::]:3000->3000/tcp
```
#### Nginx Logs (Tail 30)
```
```
#### API Logs (Tail 50)
```
```
