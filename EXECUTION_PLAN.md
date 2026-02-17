# Execution Plan

Four-phase phased delivery for OrbisVoice, targeting production MVP by end of Phase 2 and full voice integration by Phase 3.

## Phase 1: Core Monorepo & Auth (Weeks 1–3)

**Goal**: Establish foundational infrastructure, multi-tenant architecture, and authentication.

**Deliverables**:

1. **Monorepo Setup**
   - Yarn Workspaces or npm workspaces across apps/ and packages/
   - Root `package.json` with shared scripts (lint, format, typecheck, test)
   - CI/CD pipeline (GitHub Actions) for lint, build, test on every PR
   - Docker Compose for local dev (postgres, redis, placeholder services)

2. **Shared Packages**
   - `packages/shared`: core TypeScript types (Agent, Tenant, User, ReferralEvent, etc.)
   - `packages/config`: environment schema validation (Zod), loader function
   - Publish as internal npm packages (or monorepo dependencies)

3. **Backend API (Fastify)**
   - Fastify server scaffold (port 3000)
   - PostgreSQL connection setup + Prisma ORM schema
     - `tenants`, `users`, `agents`, `api_keys`, `transcripts`, `referrals`
   - Redis connection (sessions, rate limiting)
   - Authentication middleware: JWT-based multi-tenant auth
   - Base CRUD endpoints:
     - `POST /auth/signup`, `POST /auth/login`
     - `GET /tenants/me`, `PUT /tenants/me`
     - `GET /agents`, `POST /agents` (list, create per tenant)
     - Rate limiting: 100 req/min per API key
   - Error schema + logging (Pino)

4. **Frontend Web App (Next.js)**
   - Next.js 14 scaffold (port 3001)
   - Layout: public landing page + authenticated dashboard
   - Public pages: `/`, `/features`, `/pricing`, `/blog` (placeholder)
   - Protected pages: `/dashboard` (Redirect to login if not authenticated)
   - Auth flow: JWT stored in httpOnly cookie (login/signup forms)
   - Styling: TaillandCSS + brand color palette (from BRAND.md)
   - No voice functionality yet (scaffold only)

5. **Test Coverage**
   - Unit tests for shared packages (utilities, validation)
   - Integration tests for API endpoints (using Supertest)
   - E2E test skeleton (Playwright or Cypress; placeholder)
   - Target: 60% code coverage by end of phase

**Success Criteria**:
- Monorepo builds without errors
- Docker Compose brings up all services + runs migrations
- API endpoints respond correctly (auth, tenant CRUD)
- Dashboard loads (unauthenticated users redirected to login)
- CI/CD pipeline runs on PRs, tests pass

---

## Phase 2: Agent Management & Embedded Widget (Weeks 4–6)

**Goal**: Deliver agent creation UI and production-ready embedded widget (non-voice).

**Deliverables**:

1. **Agent Management Dashboard**
   - UI components: agent list, create/edit/delete forms
   - Form fields: agent name, system prompt, voice selection (placeholder dropdown)
   - Voice preview: list of available Gemini voices (mock data for now)
   - Agent testing: "Try This Agent" button → WebSocket placeholder (non-Gemini)
   - Sync to Backend API: POST/PUT/DELETE `/agents`
   - Error handling + loading states

2. **Embedded Widget**
   - Widget loader script: `<script src="https://cdn.orbisvoice.com/widget.js"></script>`
   - Initialization: `window.OrbisVoice.init({ agentId: "...", apiKey: "..." })`
   - Widget popup: minimalist audio player interface
   - Brand colors + OrbisVoice logo in UI
   - CORS handling: validate origin, prevent unauthorized embeds
   - Session management: connect to voice-gateway placeholder (no Gemini yet)
   - Fallback: if WebSocket fails, show error message + retry button
   - Privacy: show "Call recording" disclaimer, obtain consent
   - Production-ready security: no sensitive data in client logs, rate limit at API layer

3. **WebSocket Scaffold (Voice Gateway)**
   - Node.js ws server (port 4001)
   - Endpoint: `WS /stream`
   - Handshake: validate agentId + API key, retrieve agent config
   - Placeholder audio loop: echo back received audio (no Gemini yet)
   - Session timeout: close connection after 30 min idle
   - Error codes: 1000 (normal close), 4000 (invalid agent), 4001 (rate limit)
   - Logging: connection/close events, errors

4. **Analytics Dashboard (UI)**
   - Page showing placeholder metrics:
     - Total calls today/week/month
     - Average call duration
     - Top agents
   - Backend endpoint: `GET /analytics` (stub data for now)

5. **Documentation & Onboarding**
   - Widget installation guide (README, code snippets)
   - Agent setup tutorial (docs/tutorial.md)
   - Embed examples (HTML code, iframe examples)
   - API reference skeleton (list of endpoints)

6. **Quality & Performance**
   - Widget size: < 50 KB (gzipped)
   - Load time: widget ready in < 1s
   - Integration tests: widget initialization, WebSocket connection, error recovery
   - Browser compatibility: Chrome, Firefox, Safari, Edge (modern versions)

**Success Criteria**:
- Agents can be created/edited/deleted via dashboard
- Embedded widget loads on external websites (CORS working)
- WebSocket connects and echoes audio (no Gemini yet)
- Widget works on mobile + desktop
- Analytics page loads (stub data visible)
- All tests pass

---

## Phase 3: Gemini Voice Integration (Weeks 7–9)

**Goal**: Full voice streaming from client → gateway → Gemini → client response.

**Deliverables**:

1. **Gemini API Integration**
   - Implement voice-gateway `WS /stream` endpoint with real Gemini Audio API
   - Request format: bidirectional streaming (REST + Server-Sent Events or gRPC)
   - Audio format: PCM 24 kHz (or Opus per Gemini spec)
   - Session context: pass agent.systemPrompt to Gemini as system message
   - Voice ID: select Gemini voice from agent.voiceId
   - Error handling: graceful fallback if Gemini is down

2. **Tool/Function Calling**
   - Gemini supports function calling (e.g., "book a meeting")
   - Voice gateway intercepts function calls
   - Route to Backend API: `POST /agents/:id/tools/:toolId/invoke`
   - Pass tool result back to Gemini for next response
   - Example: agent can call "sendEmail" tool via gateway

3. **Session State Management**
   - Store session context in Redis (agent message history, user ID, call start time)
   - Handle interrupts/barge-in: Gemini supports interrupting speech
   - Session expiration: 30 min idle timeout (configurable per agent)
   - Logging: transcript saved to PostgreSQL after session ends

4. **Latency Optimization**
   - Measure end-to-end latency (client audio → Gemini → response audio)
   - Target: < 500ms response time for typical exchanges
   - Profile: identify bottlenecks (gateway, network, Gemini)
   - Optimize: batch audio chunks, pre-cache agent config, reuse connections

5. **Testing & QA**
   - Manual testing: multiple voice agents with different prompts
   - Load testing: 50 concurrent WebSocket connections
   - Audio quality: test various audio input qualities (background noise, accents, etc.)
   - Error scenarios: network interruptions, Gemini timeout, tool call failures

6. **Referral Integration (Preview)**
   - Backend API emits: `user.activated` event (first voice call)
   - RefRef service listens and records activation
   - Attribution UI: dashboard shows "Acquired via referral" badge

**Success Criteria**:
- Live voice calls work end-to-end (speech → text → Gemini → speech response)
- Tool calling works (agent can invoke external tools)
- Session transcripts stored correctly
- Latency < 500 ms for typical exchanges
- 50+ concurrent WebSocket connections without errors
- Load test passes

---

## Phase 4: Growth Loop (Referrals/Affiliates) (Weeks 10–12)

**Goal**: Monetization + acquisition engine (referrals/affiliates) fully operational.

**Deliverables**:

1. **RefRef Integration**
   - Self-host RefRef service (or wrap as library)
   - Sync with Backend API: webhook receiver for events
   - Events emitted by API: `user.signup`, `user.activated`, `subscription.created`, `invoice.paid`
   - RefRef stores attribution: maps events to referral source
   - Referral data syndicated back to API for dashboard display

2. **Referral Dashboard (Authenticated User)**
   - Page: `/dashboard/referrals`
   - Components:
     - "Your Referral Link": unique URL per user
     - Copy-to-clipboard button
     - Referral stats: clicks, signups, activations, estimated earnings
     - Referral history: recent referrals + status
   - Real-time updates: refresh count every 5 min or WebSocket push

3. **Public Affiliate Portal**
   - Page: `/affiliates` (public, no auth required)
   - Content:
     - "Join Our Affiliate Program" CTA
     - Program benefits (commission rate, how to earn, payout timing)
     - Signup form + email verification
     - TOS acceptance
   - After signup: user redirected to affiliate dashboard (see referral stats, link)

4. **Payout System (Stub for Now)**
   - Backend logic: calculate earnings per user (signups × commission + activations × bonus)
   - API endpoint: `GET /referrals/me/earnings` (returns estimated payout)
   - Payout execution: deferred (manual Stripe transfer for now; automate in future)
   - Webhook receiver: can process external payout requests (placeholder)

5. **Email Campaigns (Optional MVP)**
   - Transactional emails: referral signup confirmation, new referral activity
   - Email template: branded with OrbisVoice colors
   - Service: SendGrid or similar (config via .env)

6. **Analytics & Reporting**
   - Dashboard chart: referral cohort performance (sign up → activate → revenue)
   - API endpoint: `GET /admin/referral-analytics` (admin-only)
   - CSV export: referral data for accounting/reconciliation

**Success Criteria**:
- Users can generate + share unique referral links
- Public affiliate signup works (verified emails)
- Referral attributions tracked correctly (signup → activation → revenue)
- Dashboard displays earnings accurately
- Payout calculation verified (manual spot-check)
- Referral program drives 10%+ of new signups (target)

---

## Milestones & Timeline

| Milestone | Phase | Week | Deliverable |
|-----------|-------|------|-------------|
| MVP Launch | 1 + 2 | 6 | Web app + widget (non-voice) deployed to staging |
| Voice Live | 3 | 9 | First live voice agents in production |
| Growth Engine | 4 | 12 | Referral program live, driving new customers |

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Gemini API latency high | Profile early, may use gRPC instead of REST |
| WebSocket scalability issues | Load test in Phase 3, right-size infrastructure |
| RefRef licensing compliance | Legal review early; track AGPL compliance obligations |
| Referral attribution bugs | Extensive testing of event pipeline; audit logs |
| Database performance | Migrations tested in staging; indexes created proactively |

---

## Success Metrics (Overall)

- **MVP**: 50 test agents deployed (internal + beta users)
- **Voice Launch**: 100+ active voice agents, < 2% error rate
- **Growth**: 30+ new signups via referral program by end of Phase 4
- **Quality**: 99% voice gateway uptime, < 1% Gemini API error rate
