# OrbisVoice

Real-time AI voice agents for your business. Built on Google Gemini Voice (AI Studio), Next.js, Fastify, PostgreSQL, and Redis.

## Overview

OrbisVoice is a production-ready SaaS platform enabling businesses to:
- Create custom AI voice agents with strategic system prompts
- Deploy agents on websites via embedded widget or iframe
- Manage agent conversations, analytics, and integrations
- Integrate with external tools (Gmail, Google Calendar, Stripe, Twilio, etc.)
- Track referrals and affiliate partnerships

**Tech Stack**: Next.js 14 (web) | Fastify 4 (API) | PostgreSQL 14+ | Redis 7+ | TypeScript | Docker Compose | GitHub Actions

## Quick Start

### Prerequisites
- Node.js 18+ (verify with `node --version`)
- Docker & Docker Compose (for database and cache)
- Git

### Installation

1. **Clone and navigate to workspace**
   ```bash
   cd OrbisVoice
   npm install --legacy-peer-deps
   ```

2. **Start local services (PostgreSQL + Redis)**
   ```bash
   docker-compose up -d
   ```

3. **Configure environment**
   ```bash
   cp apps/api/.env.example apps/api/.env.local
   cp apps/web/.env.local.example apps/web/.env.local
   cp apps/voice-gateway/.env.example apps/voice-gateway/.env
   # Edit each file with your actual credentials
   ```

4. **Initialize database**
   ```bash
   cd apps/api
   npx prisma migrate dev --name init
   ```

5. **Start development servers**
   ```bash
   # Terminal 1: API (Fastify)
   npm -w orbisvoice-api run dev

   # Terminal 2: Web App (Next.js)
   npm -w orbisvoice-web run dev

   # Terminal 3: Voice Gateway (WebSocket)
   npm -w orbisvoice-voice-gateway run dev
   ```

   - **API**: http://localhost:3000
   - **Web**: http://localhost:3001
   - **Voice Gateway**: ws://localhost:4001

## Project Structure

```
├── apps/
│   ├── api/               # Fastify backend (auth, agents, CRUD)
│   ├── web/               # Next.js frontend (landing, dashboard)
│   ├── voice-gateway/     # WebSocket proxy for Gemini Voice
│   └── referrals/         # RefRef integration (Phase 2)
├── packages/
│   ├── shared/            # Shared types, utilities
│   └── config/            # Shared configs (ESLint, Prettier, etc.)
├── infra/                 # Infrastructure templates (Docker, K8s, etc.)
├── src/                   # Multi-agent system (9 agents + orchestrator)
└── scripts/               # Automation helpers

```

## API Endpoints (Phase 1)

### Authentication
- `POST /auth/signup` - Create account
- `POST /auth/login` - Login (returns JWT)

### Agents (Protected with JWT)
- `GET /agents` - List tenant's agents
- `POST /agents` - Create new agent
- `GET /agents/:id` - Get agent details
- `PUT /agents/:id` - Update agent
- `DELETE /agents/:id` - Delete agent

## Database Schema

**Tables**: Tenant → User, Agent, ApiKey, Transcript

Multi-tenant isolation via `tenantId` foreign keys. See `apps/api/prisma/schema.prisma` for full schema.

## Development Workflow

### Adding a Feature
1. Create feature branch: `git checkout -b feat/your-feature`
2. Make changes
3. Run linting: `npm run lint`
4. Run type checks: `npm run typecheck`
5. Commit with clear message: `git commit -m "feat: description"`
6. Push and create PR

### Running Tests
```bash
npm -w orbisvoice-api run test
npm -w orbisvoice-web run test
```

### Formatting Code
```bash
npm run format
```

## Planning Documents

- **[PROMPT.md](PROMPT.md)**: Complete product specification and development roadmap
- **[ARCHITECTURE.md](ARCHITECTURE.md)**: System design, data flow, multi-tenancy model
- **[STACK.md](STACK.md)**: Strict tech stack requirements per layer
- **[INFRASTRUCTURE.md](INFRASTRUCTURE.md)**: Local setup, production deployment, monitoring
- **[EXECUTION_PLAN.md](EXECUTION_PLAN.md)**: 4-phase delivery plan (Weeks 1-12)
- **[DEPLOYMENT.md](DEPLOYMENT.md)**: Step-by-step deployment to Cloudflare, Insforge, Render, Lumadock
- **[BRAND.md](BRAND.md)**: Visual design system (colors, typography, motion)

## Phase Roadmap

- **Phase 1** (Weeks 1-3): Core monorepo, authentication, agent CRUD, basic landing/dashboard
- **Phase 2** (Weeks 4-6): Agent management dashboard, embedded widget, WebSocket scaffold
- **Phase 3** (Weeks 7-9): Gemini Voice integration, tool calling, session management
- **Phase 4** (Weeks 10-12): RefRef referrals, referral dashboards, payout system

## Multi-Agent System

9 specialized agents ready for tool integration:
- **CommunicationAgent**: Handle conversations, escalations, routing
- **LeadQualificationAgent**: Score and qualify leads from conversations
- **ProductAgent**: Product info retrieval, recommendations
- **GoogleCalendarAgent**: Booking, availability check
- **GmailAgent**: Email sending, message retrieval
- **StripeAgent**: Payment processing, subscription management
- **PhoneTonesAgent**: Generate phone tones (DTMF)
- **TwilioAgent**: Phone calls, SMS, WhatsApp
- **CodeQualityAgent**: Pre-commit linting, type checking

See `src/agents/` and `src/orchestrator.ts` for implementations.

## Contributing

1. Follow the existing code patterns (TypeScript strict mode, Zod validation)
2. Write tests for new endpoints
3. Update documentation if needed
4. Commit frequently with clear messages

## Support

For questions or issues, check the planning documents or create a GitHub issue.

## License

Proprietary (OrbisVoice). See LICENSE file.
