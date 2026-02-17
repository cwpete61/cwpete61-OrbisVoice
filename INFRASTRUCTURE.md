# Infrastructure

## Overview

OrbisVoice is a cloud-native SaaS application. No GPU infrastructure is required; all heavy lifting is delegated to Google's Gemini API (managed service). The system is containerized and designed for horizontal scaling.

## Local Development (Docker Compose)

**Goal**: Single `docker-compose.yml` for local development, including all required services.

**Services**:
- `postgres` (PostgreSQL 15 Alpine, port 5432)
- `redis` (Redis 7 Alpine, port 6379)
- `api` (Fastify backend, port 3000)
- `voice-gateway` (Node.js WebSocket server, port 4001)
- `web` (Next.js dev server, port 3001)
- `referrals` (RefRef service placeholder, port 5000) [optional]

**Environment Variables** (from `.env.local`):
```
DATABASE_URL=postgres://postgres:postgres@postgres:5432/orbisvoice
REDIS_URL=redis://redis:6379
GEMINI_API_KEY=<your-google-ai-studio-key>
GEMINI_MODEL=gemini-2.0-flash
VOICE_GATEWAY_HOST=voice-gateway
VOICE_GATEWAY_PORT=4001
API_HOST=api
API_PORT=3000
```

**Docker Compose Profiles**:
- `default`: Runs all services (web, api, gateway, postgres, redis)
- `gpu`: Not applicable (no self-hosted GPU inference)
- `referrals`: Includes RefRef service (optional addon)

**Running Locally**:
```bash
docker-compose up -d                    # Start all services
docker-compose logs -f api              # View API logs
docker-compose exec api npm run migrate # Run DB migrations
docker-compose down                     # Stop and remove containers
```

## Production Deployment

### Deployment Order (When Ready)

1. **Cloudflare**
   - DNS management (CNAME pointing to origin)
   - TLS/SSL (Cloudflare free tier)
   - DDoS protection, rate limiting
   - Optional: Cloudflare Workers for edge caching or request routing
   - Setup: 15 min (domain config + SSL)

2. **Insforge**
   - Managed container platform or Kubernetes
   - Hosts: api, voice-gateway, web
   - Database: PostgreSQL managed (RDS-equivalent) or bring-your-own
   - Redis: Managed cache layer or self-hosted in cluster
   - Auto-scaling policies for voice-gateway (expect variable load)
   - Setup: 30-60 min (container push, service config)

3. **Render** (Alternative to Insforge)
   - Render.com: simple managed hosting for small/medium teams
   - Deploy via GitHub integration
   - Built-in CI/CD, SSL, PostgreSQL managed database
   - Supports multiple services + environment secrets
   - Setup: 20 min (GitHub connect + build config)

4. **Lumadock (Docker)**
   - On-premises or self-hosted Docker Compose
   - Production-hardened `docker-compose.yml` + health checks
   - Reverse proxy (Nginx) for TLS termination
   - Data persistence: mounted volumes or distributed storage
   - Monitoring: Docker logs aggregation
   - Setup: 1-2 hours (infrastructure provisioning + monitoring)

## Scalability Considerations

### Horizontal Scaling

**Voice Gateway**:
- Stateless session management (Redis-backed, not in-memory)
- Load balance across multiple voice-gateway instances (L4 load balancer)
- Each instance handles ~500-1000 concurrent WebSocket connections (tunable)

**Backend API**:
- Stateless design (all state in PostgreSQL/Redis)
- Scale horizontally via load balancer
- Connection pooling: PgBouncer in front of PostgreSQL

**Frontend (Web)**:
- Static Next.js export (CDN-friendly, edge-cached via Cloudflare)
- Or Next.js server-side rendering (scale via load balancer)

### Database Scaling

**PostgreSQL**:
- Read-only replicas for heavy query loads (analytics, transcripts)
- Connection pooling via PgBouncer
- Backup strategy: daily snapshots + WAL archiving

**Redis**:
- Single node sufficient for rate limiting + sessions (most deployments)
- Optional: Redis Cluster or Sentinel for HA
- Persistence: RDB snapshots or AOF

## Cost Optimization

1. **Gemini API**: Pay-per-request; optimize prompt size, cache context where possible.
2. **Database**: Right-size PostgreSQL instance; archive old transcripts to cold storage.
3. **Cloudflare**: Free tier sufficient for small/medium traffic; upgrade if needed.
4. **Render/Insforge**: Monitor instance utilization; auto-scale based on metrics.
5. **Outbound Bandwidth**: WebSocket connections incur modest bandwidth; monitor Gemini API calls.

## Monitoring & Logging

### Metrics to Track

- **API**:
  - Request latency (p50, p95, p99)
  - Error rate (4xx, 5xx)
  - Database query latency
  - Rate limit hits

- **Voice Gateway**:
  - WebSocket connection count (current, peak)
  - Audio streaming latency to Gemini
  - Session duration distribution
  - Tool call success rate

- **Backend Integration**:
  - Gemini API response time (including audio)
  - Tool call latency (Backend API response time)
  - Referral event processing delay

### Log Aggregation

- Local: Docker logs via `docker-compose logs`
- Production: Cloudflare Logpush → S3 / Google Cloud Storage
- Optional: ELK Stack (Elasticsearch, Logstash, Kibana) or Loki + Grafana

## Security Hardening

### Secrets Management

- Use `.env` files in development (gitignored)
- Production: environment variables in container orchestrator (Insforge, Render, Lumadock systemd/supervisor)
- Rotate Gemini API keys periodically
- Use service accounts with minimal IAM permissions

### Network Security

- VPC isolation (if self-hosted or on Insforge/Render)
- PostgreSQL: restrict connections to API + voice-gateway only
- Redis: no public access; only local network
- Cloudflare: enable DNSSEC, WAF rules for suspicious patterns

### API Security

- CORS: whitelist only known widget domains
- Rate limiting: aggressive limits for public endpoints
- API key expiration: implement token refresh
- Audit logging: log all sensitive operations (agent creation, referral payouts)

## Backup & Disaster Recovery

### Data Backups

- PostgreSQL: daily snapshots (managed service) or manual backups
- Redis: RDB snapshots (non-critical, can be regenerated)
- Transcripts: archive to S3/GCS after 30 days (compliance + cost saving)

### Recovery Plan

- **RTO (Recovery Time)**: 1-4 hours (data restore + service restart)
- **RPO (Recovery Point)**: Last 24-hour backup
- Test recovery monthly

## Compliance & Privacy

- **GDPR**: Offer data export/deletion for user transcripts
- **HIPAA** (if needed): encrypt data at rest and in transit; audit logging
- **SOC 2** (future): implement change control, access logging, incident response

## Monitoring Checklist

- [ ] PostgreSQL: connection pool, query performance, backup verification
- [ ] Redis: memory usage, eviction policy, persistence check
- [ ] Voice Gateway: WebSocket throughput, Gemini latency, error rates
- [ ] API: HTTP status codes, response times, database lock times
- [ ] Cloudflare: DDoS events, SSL errors, rate limit enforcement
- [ ] Referral System: event processing delay, attribution accuracy
- [ ] Logs: centralized aggregation working, retention policy enforced
