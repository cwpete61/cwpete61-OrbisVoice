# Master Prompt: OrbisVoice

## Objective

Build a Monorepo SaaS application called "OrbisVoice". This platform allows businesses to create, configure, and embed real-time AI voice agents on their websites. The agents utilize Google Gemini Voice (via AI Studio) for natural, low-latency conversational AI (speech-to-speech) with role and voice control, all without requiring self-hosted GPU infrastructure.

## Key Features

- **Voice Agent Creation**: Businesses define agent personality, system prompt, and voice via a dashboard.
- **Widget Embedding**: Drop-in JavaScript widget for easy website integration.
- **Real-Time Audio**: Full-duplex WebSocket streaming between client and voice-gateway.
- **Gemini Voice Integration**: Gateway proxies audio and chat requests to Google's Gemini API (AI Studio).
- **Referral Program**: RefRef-powered affiliate/referral module for user acquisition and partner incentives.
- **Multi-Tenant**: Tenant isolation, rate limiting, and usage tracking.
- **Analytics**: Basic call metrics, transcript logging, and referral attribution.

## Voice Stack (Gemini AI Studio)

- **Voice Engine Runtime**: Google Gemini API (AI Studio endpoint, no self-hosted GPU needed).
- **Integration Method**: REST/gRPC over HTTPS (managed by Google, no infrastructure burden).
- **Audio Format**: Supports WAV, opus, MP3 (Google Gemini Voice specs).
- **Latency**: Cloud-managed; Google handles scaling and performance.
- **Cost Model**: Pay-per-request via Google Cloud Billing.

## Technology Stack (Strict)

### Frontend (apps/web)
- Next.js 14+ (React, Server Components where appropriate)
- TypeScript
- TailwindCSS (brand colors from BRAND.md)
- Embedded widget: vanilla JS or iframe-based

### Backend API (apps/api)
- Fastify (HTTP server, JSON RPC or REST endpoints)
- TypeScript
- PostgreSQL (tenants, agents, usage, transcripts)
- Redis (sessions, rate limiting, caching)

### Voice Gateway (apps/voice-gateway)
- Node.js + ws (WebSocket server)
- TypeScript
- Bidirectional streaming (client ↔ gateway ↔ Gemini)
- Session state, turn-taking, interrupt handling (as supported by Gemini Voice API)
- Tool/function calling bridge to Backend API

### Referrals (apps/referrals)
- RefRef service (self-hosted or as a library integration)
- Referral links, attribution tracking, affiliate portal
- Webhook integration with Backend API for signup/purchase events
- **Licensing Note**: RefRef is AGPL-3.0; treat as explicit constraint

### Shared (packages/)
- packages/shared: types, contracts, utilities
- packages/config: environment schema, validation

## Deployment Order (When Time Comes)

1. **Cloudflare**: DNS, edge caching, DDoS protection
2. **Insforge**: Container orchestration or managed platform
3. **Render**: Managed hosting for API/Gateway (alternative to Insforge)
4. **Lumadock (Docker)**: Local/self-hosted Docker Compose for dev and on-premises

## Execution Plan (Four Phases)

### Phase 1: Core Monorepo & Auth
- Scaffold apps (web, api, voice-gateway, referrals)
- Next.js web app with marketing landing + protected dashboard
- PostgreSQL schema, Redis setup
- Multi-tenant auth (API key or OAuth)
- Fastify API with base CRUD endpoints

### Phase 2: Agent Management & Widget
- Agent creation/config UI (dashboard)
- Voice selection, system prompt, fallback behavior
- Embedded widget scaffold (production-ready CORS, iframe security)
- WebSocket proof-of-concept (non-Gemini placeholder)

### Phase 3: Gemini Voice Integration
- Implement voice-gateway WebSocket handshake
- Integrate Gemini AI Studio API (audio streaming)
- Tool/function calling: intercept and route to Backend API
- Error recovery, session timeout handling

### Phase 4: Growth Loop (Referrals/Affiliates)
- Integrate RefRef service
- Attribution events (signup, subscription, invoice paid)
- User + public affiliate portals
- Basic payout hooks (execution deferred if billing is stubbed)

## Success Metrics

- MVP launch by end of Phase 2
- Production voice agents live by end of Phase 3
- 50+ agent instances deployed by Phase 4

## Notes

- GPU not required; no self-hosted inference burden.
- Referral/affiliate system is a first-class feature (not add-on).
- Brand direction in BRAND.md: deep space + studio hardware aesthetic.
- All services assume HTTPS in production.
