# Architecture

## System Overview

OrbisVoice is a multi-service monorepo SaaS where businesses deploy AI voice agents on their sites via a managed platform. The system separates concerns:

- **Web App** (public marketing + authenticated dashboard)
- **Backend API** (core business logic, multi-tenancy, tooling)
- **Voice Gateway** (WebSocket proxy for real-time audio streaming to Gemini)
- **Email System** (transactional notifications and templating)
- **Referrals** (affiliate/referral attribution and tracking)
- **Shared Libraries** (types, configs, utilities)

## Module Breakdown

### 1. Web App (apps/web)

**Purpose**: Public marketing landing page, business dashboard, and embedded widget setup.

**Endpoints/Responsibilities**:
- Public landing page (features, pricing, CTA)
- Authenticated dashboard for agent creation/configuration
- Agent management: create, edit, delete, test voice agents
- Voice selection UI (browse Gemini voice options)
- Analytics dashboard: call logs, transcripts, usage metrics
- Referral dashboard: "Refer & Earn" for authenticated users
- Public affiliate signup (for non-users)

**Technology**: Next.js 14, React, TailwindCSS, TypeScript

### 2. Backend API (apps/api)

**Purpose**: Core multi-tenant business logic, agent/tenant/user management, tool execution, and billing events.

**Endpoints/Responsibilities**:
- `POST /auth/login`, `/auth/signup` (multi-tenant)
- `GET /agents`, `POST /agents`, `PUT /agents/:id`, `DELETE /agents/:id`
- `GET /agents/:id/transcripts` (call history, transcripts)
- `POST /agents/:id/tools/:toolId/invoke` (function calling bridge)
- `POST /events` (webhook receiver for RefRef: signup, subscription, invoice)
- `GET /usage` (tenant usage metrics)
- `GET /referrals/me` (current user's referral/affiliate data)
- **Security**: Rate limiting (100 req/min), Helmet security headers, `isBlocked` JWT enforcement.
- **Email**: `EmailService` with template support (console mock for dev).
- Rate limiting per tenant/API key

**Technology**: Fastify, TypeScript, PostgreSQL, Redis

**Database Schema** (subset):
- `tenants` (org-level)
- `users` (team members per tenant)
- `agents` (voice agent config per tenant)
- `transcripts` (call logs)
- `api_keys` (for widget/client auth)
- `referrals` (RefRef sync or local attribution)

### 3. Voice Gateway (apps/voice-gateway)

**Purpose**: Real-time bidirectional WebSocket proxy between web/mobile clients and Google Gemini Voice API.

**Endpoints/Responsibilities**:
- `WS /stream` (main WebSocket endpoint)
  - Client connects with agentId + API key
  - Gateway validates tenant/agent + rate limits
  - Gateway opens stream to Gemini AI Studio
  - Bi-directional audio streaming (PCM 24kHz, Opus, or WAV per Gemini spec)
  - Session state management (context, turn-taking, interrupts)
  - Tool call interception: when Gemini suggests a tool (e.g., "call Backend API"), gateway intercepts and routes to Backend API, then feeds result back to Gemini

**Technology**: Node.js, ws library, TypeScript

**Session Flow**:
1. Client connects with agentId + authToken
2. Gateway validates ticket, retrieves agent config (system prompt, voice ID, etc.)
3. Gateway initializes Gemini session
4. Audio streams bidirectionally until timeout or explicit close

### 4. Referrals (apps/referrals)

**Purpose**: Referral link generation, attribution tracking, and affiliate partner management.

**Endpoints/Responsibilities**:
- `POST /referral-links` (generate new referral URL for authenticated user)
- `GET /referral-links` (list user's active links)
- `GET /affiliate-dashboard` (referral stats, earnings estimate)
- Webhook receiver: integrates with Backend API to track signup/purchase attribution
- Payout hooks (stub for now; full Stripe integration deferred)

**Technology**: RefRef service (self-hosted or library wrapper), TypeScript

**Integration Points**:
- Backend API emits events: `user.created`, `subscription.created`, `invoice.paid`
- Referrals service listens and attributes to referral source
- Referral data syndicated back to Backend API for dashboard display

### 5. Shared (packages/shared, packages/config)

**Purpose**: Reusable types, CLI utilities, and config validation.

**Contents**:
- `packages/shared/types`: Common TS interfaces (Agent, Tenant, User, ReferralEvent, etc.)
- `packages/shared/utils`: Helper functions (validate agent config, parse transcripts, etc.)
- `packages/config`: Environment schema (Zod or similar), load from `.env`

## Data Flow Diagram (Text)

```
┌─────────────────────┐
│   Web Client        │
│   (Browser Widget)  │
└──────────┬──────────┘
           │
           │ (WebSocket)
           │
┌──────────▼──────────────────┐
│   Voice Gateway              │
│   (Node.js, ws server)       │
│                              │
│  - Session mgmt              │
│  - Audio streaming           │
│  - Tool call routing         │
└──────────┬──────────────────┘
           │
           ├────────────────────────────────────────┐
           │                                        │
           │ (REST/gRPC HTTPS)                      │ (REST HTTPS)
           │                                        │
      ┌────▼────────────────────┐         ┌────────▼─────────────┐
      │ Google Gemini API        │         │   Backend API        │
      │ (AI Studio)              │         │   (Fastify)          │
      │                          │         │                      │
      │ - Voice streaming        │         │ - Tool execution     │
      │ - Speech recognition     │         │ - DB queries         │
      │ - Response generation    │         │ - Rate limiting      │
      └────────────────────────┘         └────────┬──────────────┘
                                                   │
                                                   │ (SQL)
                                                   │
                                         ┌─────────▼──────────┐
                                         │   PostgreSQL       │
                                         │   Redis            │
                                         └────────────────────┘

Dashboard (Web App) ←────────→ Backend API ←──→ PostgreSQL, Redis
Referral Portal   ←────────→ Referrals Service ←──→ Webhook events
```

## Multi-Tenancy Model

- **Tenant**: Organization owning one or more voice agents
- **Agent**: Isolated config (system prompt, voice ID, tools) per tenant
- **API Key**: Per-agent or per-tenant key for widget embedding
- **Rate Limiting**: Applied per API key / per tenant
- **Data Isolation**: SQL queries filtered by tenant_id

## Error Handling & Resilience

- WebSocket reconnection logic (client-side exponential backoff)
- Session timeout (default 30 min idle)
- Tool call timeout (Backend API response time limit)
- Fallback responses if Gemini or Backend API fail
- Logging: all errors to PostgreSQL + centralized log aggregation (future)
