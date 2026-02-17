# Deployment Plan

When ready for production launch, follow this deployment order to progressively roll out OrbisVoice infrastructure with minimal risk.

## Deployment Order

1. **Cloudflare** (DNS + Edge)
2. **Insforge** (Container Orchestration)
3. **Render** (Alternative Managed Hosting)
4. **Lumadock** (On-Premises Docker)

---

## 1. Cloudflare Setup (15–30 min)

**Purpose**: DNS, SSL/TLS, DDoS protection, CDN for static assets.

### Prerequisites
- Domain name purchased and registrar access

### Setup Steps

1. **Create Cloudflare Account** (free tier)
   - Sign up at cloudflare.com
   - Add domain to Cloudflare
   - Update nameservers at domain registrar to Cloudflare NS hosts

2. **DNS Configuration**
   - `api.orbisvoice.com` → CNAME → `<insforge-api-lb>.insforge.io` (or Render endpoint)
   - `voice.orbisvoice.com` → CNAME → `<insforge-gateway-lb>.insforge.io`
   - `www.orbisvoice.com` → CNAME → `<web-cdn-endpoint>`
   - `orbisvoice.com` → CNAME → `www.orbisvoice.com`

3. **SSL/TLS**
   - Cloudflare Free SSL enabled by default (Full encryption)
   - Certificate auto-renewal handled

4. **Edge Caching**
   - Cache Level: Aggressive
   - Browser Cache: 4 hours (for widget JS, CSS)
   - Rules: Cache static assets (JS, CSS, images); bypass cache for API calls

5. **DDoS Protection**
   - Enable: Web Application Firewall (WAF)
   - Rules: Block known attack patterns
   - Rate Limiting: Optional (50 req/10s per IP for public endpoints)

6. **Email Routing** (Optional)
   - Forward admin@orbisvoice.com → your email
   - Used for alert notifications

### Verification
```bash
dig api.orbisvoice.com                    # Should resolve to Cloudflare IP
curl -I https://api.orbisvoice.com        # Should return 200 + Cloudflare headers
```

### Constraints & Notes
- Free tier: 10 DDoS rules, basic WAF
- Upgrade to Pro if needed: 20 DDoS rules, advanced WAF
- TTL: Set DNS TTL to 1 hour initially (for quick corrections)

---

## 2. Insforge Deployment (1–2 hours)

**Purpose**: Managed container orchestration for API, Voice Gateway, Web App.

### Prerequisites
- Docker images built and pushed to registry (Docker Hub or private)
- PostgreSQL + Redis credentials + connection strings ready
- Gemini API key configured as secret

### Setup Steps

1. **Create Account** (insforge.io or equivalent managed platform)
   - Sign up, create project
   - Link GitHub repo (optional, for CI/CD)

2. **Configure Services**

   **a) Backend API (Fastify)**
   - Container image: `your-registry/orbisvoice-api:production`
   - Port: 3000 (internal), exposed on HTTPS
   - Environment variables:
     ```
     DATABASE_URL=<managed-postgres-connection>
     REDIS_URL=<managed-redis-connection>
     NODE_ENV=production
     API_KEY_JWT_SECRET=<generated-secret>
     ```
   - Health check: `GET /health` (Fastify endpoint)
   - Resources: 1 CPU, 512 MB RAM (scale up based on load)
   - Instances: 2 (for redundancy)

   **b) Voice Gateway (Node.js WebSocket)**
   - Container image: `your-registry/orbisvoice-voice-gateway:production`
   - Port: 4001 (internal), exposed on HTTPS
   - Environment variables:
     ```
     GEMINI_API_KEY=<secret>
     GEMINI_MODEL=gemini-2.0-flash
     REDIS_URL=<managed-redis-connection>
     API_HOST=<api-service-internal-url>
     API_PORT=3000
     ```
   - Health check: WS health endpoint (if available)
   - Resources: 1 CPU, 512 MB RAM
   - Instances: 2–4 (auto-scale based on connections)
   - Sticky sessions: Enable if state stored in-memory (recommend Redis instead)

   **c) Frontend (Next.js)**
   - Container image: `your-registry/orbisvoice-web:production`
   - Port: 3001 (or 3000 if using Next.js server)
   - Environment variables:
     ```
     NEXT_PUBLIC_API_URL=https://api.orbisvoice.com
     NEXT_PUBLIC_VOICE_GATEWAY_URL=wss://voice.orbisvoice.com
     ```
   - Health check: `GET /health` (or HEAD `/`)
   - Resources: 512 MB RAM, 1 CPU
   - Instances: 2

3. **Load Balancing**
   - Create load balancer for each service
   - API LB: routes `api.orbisvoice.com:443` → API instances
   - Gateway LB: routes `voice.orbisvoice.com:443` → Gateway instances
   - Web LB: routes `orbisvoice.com:443` → Web instances
   - Health checks: enabled (30s interval, 2 failed = remove instance)

4. **PostgreSQL & Redis**
   - Provision managed PostgreSQL (standard tier, 20 GB initial)
   - Provision managed Redis (standard tier, 1 GB)
   - Backup PostgreSQL: daily snapshots, 7-day retention
   - Enable encryption at rest + in transit

5. **Secrets Management**
   - Store Gemini API key in vault (not in code/docker image)
   - Inject as environment variable at runtime
   - Rotate every 90 days

6. **CI/CD Pipeline** (Optional but Recommended)
   - GitHub Actions workflow: build image → push to registry → redeploy on main branch
   - Staging environment for testing before production

### Verification
```bash
# Test API endpoint
curl -H "X-API-Key: test" https://api.orbisvoice.com/agents

# Test voice gateway
wscat -c wss://voice.orbisvoice.com/stream --ca false

# Test web app
curl -I https://orbisvoice.com
```

### Constraints & Notes
- Startup time: 2–3 minutes for all services
- Zero-downtime deployments: use rolling updates (1 instance at a time)
- Auto-scaling: enable for Voice Gateway (Gemini latency may spike)
- Cost: ~$50–150/month depending on traffic

---

## 3. Render Deployment (Alternative) (30–60 min)

**Purpose**: Simple alternative to Insforge if you prefer single-vendor hosting.

### Prerequisites
- GitHub repo (Render integrates with GitHub)
- PostgreSQL + Redis managed instances

### Setup Steps

1. **Create Account** (render.com)
   - Sign up, connect GitHub

2. **Deploy Backend API**
   - Service type: Web Service
   - GitHub repo: select branch (main)
   - Build command: `npm install && npm run build`
   - Start command: `npm run start`
   - Environment:
     ```
     DATABASE_URL=<postgres>
     REDIS_URL=<redis>
     NODE_ENV=production
     ```
   - Plan: Standard tier (~$7/month)

3. **Deploy Voice Gateway**
   - Service type: Web Service
   - Same repo or separate (if split)
   - Build/Start commands: same as API
   - Plan: Standard tier (~$7/month)
   - Note: Render WebSocket support may have latency; validate with Gemini

4. **Deploy Frontend**
   - Service type: Static Site or Web Service
   - Build command: `npm install && npm run build`
   - Publish directory: `.next` (if using Node server) or `out/` (if static export)
   - Plan: Free tier (unlimited)

5. **PostgreSQL Managed Database**
   - Render supports PostgreSQL alongside services
   - Enable backups + connection limit

6. **Connect Services**
   - Update environment variables to point to internal Render URLs
   - DNS: Update Cloudflare CNAME to Render service URLs

### Verification
```bash
curl https://<render-api-service>.onrender.com/health
```

### Constraints & Notes
- Simpler than Insforge; good for small teams
- Free tier limitations (services spin down after 15 min inactivity)
- Upgrade to paid for production reliability
- Cost: ~$14–50/month for full stack

---

## 4. Lumadock: On-Premises Deployment (1–4 hours)

**Purpose**: Self-hosted Docker Compose for on-premises or hybrid deployments.

### Prerequisites
- Linux server (Ubuntu 20.04+, 4 CPU, 8 GB RAM minimum)
- Docker + Docker Compose installed
- SSL certificate (self-signed or Let's Encrypt)
- Reverse proxy (Nginx or Caddy)

### Setup Steps

1. **Prepare Server**
   - SSH access to Linux machine
   - Create `/opt/orbisvoice` directory
   - Clone monorepo: `git clone <repo> /opt/orbisvoice`

2. **Create Production Docker Compose**
   ```yaml
   version: '3.8'
   services:
     postgres:
       image: postgres:15-alpine
       environment:
         POSTGRES_DB: orbisvoice
         POSTGRES_PASSWORD: <secure-password>
       volumes:
         - postgres_data:/var/lib/postgresql/data
       healthcheck:
         test: ["CMD-SHELL", "pg_isready -U postgres"]
         interval: 10s
         timeout: 5s
         retries: 5

     redis:
       image: redis:7-alpine
       volumes:
         - redis_data:/data
       healthcheck:
         test: ["CMD", "redis-cli", "ping"]
         interval: 10s
         timeout: 5s
         retries: 5

     api:
       build: ./apps/api
       depends_on:
         postgres:
           condition: service_healthy
         redis:
           condition: service_healthy
       environment:
         DATABASE_URL: postgres://postgres:<password>@postgres:5432/orbisvoice
         REDIS_URL: redis://redis:6379
         GEMINI_API_KEY: ${GEMINI_API_KEY}
       restart: always
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
         interval: 30s
         timeout: 10s
         retries: 3

     voice-gateway:
       build: ./apps/voice-gateway
       depends_on:
         redis:
           condition: service_healthy
       environment:
         REDIS_URL: redis://redis:6379
         API_HOST: api
         API_PORT: 3000
         GEMINI_API_KEY: ${GEMINI_API_KEY}
       restart: always
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:4001/health"]
         interval: 30s
         timeout: 10s
         retries: 3

     web:
       build: ./apps/web
       environment:
         NEXT_PUBLIC_API_URL: https://<your-domain>/api
         NEXT_PUBLIC_VOICE_GATEWAY_URL: wss://<your-domain>/voice
       restart: always
       healthcheck:
         test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
         interval: 30s
         timeout: 10s
         retries: 3

   volumes:
     postgres_data:
     redis_data:
   ```

3. **Setup Nginx Reverse Proxy**
   ```nginx
   upstream api {
     server api:3000;
   }
   upstream gateway {
     server voice-gateway:4001;
   }
   upstream web {
     server web:3001;
   }

   server {
     listen 443 ssl http2;
     server_name orbisvoice.example.com;

     ssl_certificate /etc/letsencrypt/live/orbisvoice.example.com/fullchain.pem;
     ssl_certificate_key /etc/letsencrypt/live/orbisvoice.example.com/privkey.pem;

     # API
     location /api/ {
       proxy_pass http://api/;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $remote_addr;
     }

     # Voice Gateway WebSocket
     location /voice/ {
       proxy_pass http://gateway/;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $remote_addr;
     }

     # Web frontend
     location / {
       proxy_pass http://web/;
       proxy_set_header Host $host;
       proxy_set_header X-Forwarded-For $remote_addr;
     }
   }
   ```

4. **Deploy**
   ```bash
   cd /opt/orbisvoice
   export GEMINI_API_KEY=<your-key>
   docker-compose -f docker-compose.prod.yml up -d
   docker-compose logs -f api                    # view logs
   ```

5. **Monitoring** (Optional)
   - Docker stats: `watch docker stats`
   - Prometheus + Grafana for metrics (optional)
   - Log aggregation: send Docker logs to ELK Stack (optional)

6. **Backup Strategy**
   - PostgreSQL: daily snapshots to external storage
   - Command: `docker exec orchisvoice_postgres_1 pg_dump -U postgres orbisvoice > backup_$(date +%s).sql`

### Verification
```bash
curl -k https://localhost/api/health
wscat -c wss://localhost/voice/stream --ca false
curl -k https://localhost/
```

### Constraints & Notes
- Self-hosted = responsibility for uptime, backups, SSL renewal
- SSL renewal: use Let's Encrypt with auto-renewal
- Scaling: limited to single machine; use orchestration (Kubernetes) for multi-node
- Cost: only infrastructure (VM + storage)

---

## Post-Deployment Checklist

- [ ] All services responding on correct ports
- [ ] Cloudflare DNS + SSL working
- [ ] Database migrations applied
- [ ] Gemini API requests succeed (test call)
- [ ] WebSocket connections stable (50+ concurrent test)
- [ ] Logs centralized + monitoring active
- [ ] Backups automated + verified
- [ ] Team notified + runbook created

---

## Rollback Plan

If deployment fails:
1. Revert container images to previous version
2. Keep database schema unchanged (migrations are one-way)
3. Test in staging first before re-deploying
4. Monitor error logs + Gemini API status
