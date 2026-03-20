\# Deployment Architecture and Infrastructure

\## Container Topology, Networking, Scaling Strategy, and Environment Design



You are responsible for designing and implementing the deployment architecture for the OrbisVoice platform.



This system must support:

\- real-time voice streaming

\- low-latency WebSocket connections

\- tool orchestration

\- usage and finance tracking

\- multi-tenant isolation

\- horizontal scalability



The deployment must be:

\- containerized

\- reproducible

\- observable

\- scalable

\- cost-aware



\---



\## Primary Objective



Deploy a production-ready system that:

\- maintains <500ms latency targets

\- scales with concurrent sessions

\- isolates services cleanly

\- supports rolling updates without downtime

\- provides clear observability and failure recovery



\---



\## Core Services



The system is composed of the following services:



\### 1. Voice Gateway (`voice-gateway`)

Role:

\- WebSocket server

\- Gemini Live bridge

\- tool orchestration

\- runtime policy enforcement



Characteristics:

\- stateful per session

\- latency-critical



\---



\### 2. Web App (`web`)

Role:

\- dashboard

\- agent builder

\- widget delivery



Characteristics:

\- stateless

\- CDN-friendly



\---



\### 3. API Service (`api`)

Role:

\- authentication

\- agent config retrieval

\- tenant management

\- billing hooks

\- usage ingestion endpoints



Characteristics:

\- stateless



\---



\### 4. Commerce Agent (`commerce-agent`)

Role:

\- tool execution

\- business logic

\- cart, booking, order actions



Characteristics:

\- stateless

\- async-heavy



\---



\### 5. Worker / Jobs (`worker`)

Role:

\- aggregation (usage, finance)

\- background tasks

\- retries

\- alerts



\---



\### 6. Database (`postgres`)

Role:

\- primary data store

\- tenants, agents, sessions, usage, pricing



\---



\### 7. Cache / Queue (`redis`)

Role:

\- session caching

\- rate limiting

\- queues

\- pub/sub



\---



\### 8. Reverse Proxy / Ingress (`nginx` or cloud LB)

Role:

\- TLS termination

\- routing

\- WebSocket upgrade support



\---



\## Container Architecture



\### Recommended Layout



Each service runs in its own container:



\- voice-gateway

\- api

\- web

\- commerce-agent

\- worker

\- postgres

\- redis

\- nginx (optional locally)



\---



\### Docker Principles



\- one service per container

\- minimal base images

\- environment variables for config

\- no secrets in images

\- health checks required



\---



\## Example Docker Compose (Development)



Services:



\- web → port 3000

\- api → port 4000

\- voice-gateway → port 8080 (WS)

\- commerce-agent → port 5000

\- postgres → 5432

\- redis → 6379



Volumes:

\- postgres data

\- local dev mounts for hot reload



\---



\## Networking Design



\### Internal Network



All services communicate via internal Docker network:



\- `api:4000`

\- `voice-gateway:8080`

\- `redis:6379`

\- `postgres:5432`



\---



\### External Access



Expose:



\- web (HTTP/HTTPS)

\- api (HTTP/HTTPS)

\- voice-gateway (WebSocket over HTTPS)



\---



\### WebSocket Routing



Ingress must support:

\- HTTP → WebSocket upgrade

\- sticky sessions if needed



\---



\## Production Architecture



\### Recommended Topology



Use:



\- Load Balancer (Cloudflare / AWS ALB / Nginx)

\- Multiple voice-gateway instances

\- Multiple API instances

\- Managed Postgres (recommended)

\- Managed Redis (recommended)



\---



\### Horizontal Scaling



\#### Voice Gateway



Scale by:

\- number of concurrent sessions



Rule of thumb:

\- 1 vCPU ≈ 20–40 concurrent voice sessions (baseline, depends on load)



\---



\#### API



Scale by:

\- request volume



\---



\#### Workers



Scale by:

\- queue depth



\---



\## VPS / Server Sizing (Baseline)



For your use case (2 medium apps + 1 small + voice system):



\### Minimum Production Starter



\- 4 vCPU

\- 8 GB RAM

\- 80–120 GB SSD



\---



\### Recommended Stable Setup



\- 8 vCPU

\- 16 GB RAM

\- 160+ GB SSD



\---



\### Scaling Tier



\- 16 vCPU

\- 32 GB RAM



\---



\### Resource Allocation



Approx:



\- voice-gateway → 30–40%

\- api → 10–15%

\- web → 5–10%

\- commerce-agent → 10–15%

\- postgres → 20–30%

\- redis → 5–10%



\---



\## Environment Separation



You must support:



\### 1. Development

\- local Docker

\- hot reload

\- mock services allowed



\---



\### 2. Staging

\- production-like

\- real integrations (test mode)

\- full regression testing



\---



\### 3. Production

\- hardened

\- autoscaling

\- monitoring enabled

\- secrets secured



\---



\## Environment Variables



Each service must use env-based config.



\### Required Categories



\- DATABASE\_URL

\- REDIS\_URL

\- GEMINI\_API\_KEY

\- TWILIO\_ACCOUNT\_SID

\- TWILIO\_AUTH\_TOKEN

\- JWT\_SECRET

\- SERVICE\_URLS (api, gateway, etc.)



\---



\### Secret Management



Use:

\- .env for local

\- secret manager in production



Never:

\- commit secrets

\- expose to frontend



\---



\## Deployment Strategy



\### Rolling Deployments



\- deploy new container

\- shift traffic gradually

\- drain old connections



\---



\### Voice Gateway Special Handling



\- allow existing sessions to complete

\- do not drop active WebSocket sessions abruptly



\---



\## Load Balancing



\### Requirements



\- support WebSocket

\- support sticky sessions (optional but recommended)

\- health checks



\---



\### Health Checks



Each service must expose:



\- `/health` endpoint



Check:

\- process alive

\- dependencies reachable



\---



\## Database Strategy



\### PostgreSQL



Use:

\- managed service (recommended)



Requirements:

\- backups enabled

\- connection pooling

\- read replicas (optional)



\---



\### Schema Management



\- Prisma migrations

\- version-controlled



\---



\## Redis Strategy



Use for:



\- session cache

\- rate limiting

\- pub/sub

\- background queues



\---



\## Queue System



Use Redis or dedicated queue (BullMQ recommended).



Jobs:

\- usage aggregation

\- billing

\- retries

\- alerts



\---



\## Observability Stack



\### Logging



\- structured logs (JSON)

\- include:

&#x20; - sessionId

&#x20; - tenantId

&#x20; - traceId



\---



\### Metrics



Track:

\- latency

\- active sessions

\- error rates

\- tool latency

\- queue depth



\---



\### Monitoring Tools



Options:

\- Prometheus + Grafana

\- Datadog

\- Cloud provider monitoring



\---



\## Alerting



Trigger alerts on:



\- high latency

\- high error rate

\- gateway crashes

\- queue backlog

\- DB connection issues



\---



\## CI/CD Pipeline



\### Steps



1\. lint

2\. build

3\. test

4\. containerize

5\. deploy to staging

6\. run regression

7\. deploy to production



\---



\## Zero Downtime Requirement



Ensure:



\- rolling deploys

\- backward-compatible schema changes

\- feature flags where needed



\---



\## Security Considerations



\- HTTPS everywhere

\- WSS for voice

\- JWT validation

\- tenant isolation

\- rate limiting



\---



\## Rate Limiting



Apply at:



\- API layer

\- gateway layer



Protect against:

\- abuse

\- cost spikes



\---



\## Backup Strategy



\### Database



\- daily backups

\- point-in-time recovery



\---



\### Config



\- version control

\- infra-as-code preferred



\---



\## Failure Recovery



\### Gateway Failure



\- reconnect client automatically

\- resume session if possible



\---



\### Provider Failure



\- fallback response

\- retry logic



\---



\### DB Failure



\- failover if available

\- degrade gracefully



\---



\## Cost Optimization



\- scale gateway dynamically

\- use spot instances where safe

\- monitor idle services

\- tune resource allocation



\---



\## Deliverables



Produce:



\- docker-compose (dev)

\- production deployment spec

\- environment config templates

\- scaling guidelines

\- monitoring setup

\- CI/CD pipeline config



\---



\## Success Criteria



System is complete when:



\- all services run in containers

\- WebSocket voice works in production

\- scaling handles increased load

\- latency targets are maintained

\- deployments are repeatable

\- monitoring is active

\- failures are recoverable

