# Technology Stack

## Frontend Stack

**Web App (apps/web)**
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript 5.7+
- **Styling**: TailwindCSS 3.4 (Stable v3)
- **State**: React Context / React Server Components
- **Authentication**: Firebase / Google OAuth (Live)
- **Embedded Widget**: Vanilla JS loader script (managed via `apps/api`)

**Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge); audio requires HTTPS + getUserMedia permission

## Backend Stack

**API (apps/api)**
- **Runtime**: Node.js 20+ (LTS)
- **Framework**: Fastify 5.x
- **Language**: TypeScript 5.7+
- **Database**:
  - PostgreSQL 15+ (primary data store)
  - Redis 7+ (Rate limiting, caching)
- **ORM**: Prisma 6.x
- **Validation**: Zod
- **Authentication**: JWT tokens + Google Auth verification
- **Rate Limiting**: `@fastify/rate-limit` (Redis-backed)
- **Security Headers**: `@fastify/helmet`
- **Logging**: Pino 10.x
- **Testing**: Vitest 4.x

**API Architecture**:
- REST endpoints (JSON request/response)
- `/api/v1/*` versioning
- Error responses: consistent error schema with HTTP status codes
- Middleware: auth, CORS, rate limiting, request logging

## Voice Stack

**Voice Gateway (apps/voice-gateway)**
- **Runtime**: Node.js 18+
- **Framework**: Express.js or vanilla Node.js http + ws library
- **Language**: TypeScript
- **WebSocket Library**: ws (native Node.js WebSocket implementation)
- **Audio Format**: 
  - Inbound: PCM 16kHz/24kHz or Opus
  - Outbound: PCM 24kHz (Gemini Voice spec)
- **Gemini Integration**: 
  - REST or gRPC over HTTPS to Google Gemini AI Studio
  - Authentication: JWT Bearer token (Google Cloud service account or OAuth 2.0)
- **Session Management**: In-memory (for local dev) or Redis-backed (production)
- **Logging**: Pino (structured JSON logs)
- **Error Handling**: WebSocket close codes (1000 normal, 1006 abnormal, 4000-4999 custom app errors)

**Gemini API Details**:
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/*` (Google AI Studio)
- Model: `gemini-2.0-flash` or latest available
- Request format: bidirectional streaming gRPC or REST + Server-Sent Events (SSE)
- Audio context + system prompt + user input → Gemini → audio response

## Referrals Stack

**Referrals Service (apps/referrals)**
- **Base**: RefRef service (AGPL-3.0 licensed; self-hosted or wrapped library)
- **Integration**: Webhook receivers for backend events
- **Database**: Shared PostgreSQL (with referral-specific tables) or isolated instance
- **API**: REST endpoints for referral link generation, stats, affiliate portal
- **Payout**: Stripe or placeholder (deferred integration)

**Licensing Constraint**:
- RefRef is AGPL-3.0, which requires source code disclosure if you modify and deploy as a network service.
- Recommend: legal review + explicit compliance plan.

## Shared Stack

**packages/shared**
- **Language**: TypeScript
- **Contents**:
  - Common types (Agent, Tenant, User, ReferralEvent, etc.)
  - Utility functions (validation, parsing, helpers)
  - Shared constants (error codes, status enums, etc.)
- **Distribution**: Published as npm package or monorepo dependency

**packages/config**
- **Language**: TypeScript
- **Contents**:
  - Environment schema (Zod)
  - Configuration loader (load from .env, validate, export as module)
  - Build-time config (e.g., API URLs, CDN paths)

## Infrastructure & Deployment

**Local Development (Lumadock / Docker Compose)**
- PostgreSQL container (postgres:15-alpine)
- Redis container (redis:7-alpine)
- Backend API (Fastify, port 3000)
- Voice Gateway (Node.js ws, port 4001)
- Frontend dev server (Next.js, port 3001 with HMR)
- Optional: Referrals service (port 5000)

**Production Deployment (Live)**
- **Hosting**: Contabo VPS (Linux Ubuntu)
- **IP**: `147.93.183.4`
- **Orchestration**: Docker Compose (`docker-compose.prod.yml`)
- **CI/CD**: GitHub Actions (Triggered on push to `master`)
- **SSL**: Cloudflare (Full Encryption) + Nginx Proxy

**Deployment Workflow (Legacy/Preferred)**:
1. `git push origin master`
2. GitHub Action builds images -> Pushes to GHCR
3. GitHub Action SSHs to VPS -> Runs `/opt/orbisvoice/deploy-vps.sh`
4. Containers are updated and restarted.

## Observability & Monitoring

**Logging**:
- Pino (JSON structured logs)
- Log level: debug (dev), info (staging), info/warn (production)
- Aggregation: stdout → Docker logs (Lumadock) or cloud logging (Render, Insforge)

**Metrics** (Future):
- Prometheus counters: API requests, WebSocket connections, Gemini call latency
- Dashboards: Grafana (optional)

**Error Tracking** (Future):
- Sentry or similar for exception reporting

## Security Considerations

- **Secrets Management**: `.env` files (gitignored) + environment variables in deployment
- **API Key Validation**: Backend API validates incoming requests with tenant-scoped API keys
- **CORS**: Strict origins for widget embedding
- **HTTPS Only**: All external API calls must be HTTPS
- **Rate Limiting**: Redis-based per-key/tenant
- **Database**: SQL injection prevention via Prisma/ORM, parameterized queries
- **WebSocket**: Validate origin, authenticate connection
- **Gemini Auth**: JWT Bearer token, rotated per deployment environment

## Version Pinning

- Node.js: ^18.0.0 (LTS)
- Next.js: ^14.0.0
- Fastify: ^4.0.0
- TypeScript: ^5.0.0
- React: ^18.0.0
- Zod: ^3.20.0
- Prisma: ^5.0.0
- ws: ^8.14.0
- @fastify/helmet: ^11.0.0
- @fastify/rate-limit: ^9.0.0
