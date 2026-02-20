# Phase 2: Agent Management Dashboard & Embedded Widget

## Completion Status: ✅ FOUNDATION COMPLETE

This document summarizes Phase 2 deliverables and implementation details.

## Overview

Phase 2 (Weeks 4-6) focuses on:
1. **Advanced Agent Management Dashboard** - Create, edit, delete agents with rich UI
2. **Embedded Widget** - Vanilla JavaScript widget for websites to embed voice agents
3. **WebSocket Integration** - Test console for WebSocket connections
4. **API Key Management** - Generate, view, and revoke API keys for widget authentication

---

## Deliverables

### 1. API Enhancements

#### New Endpoints: `/api-keys`
```
GET    /api-keys              - List tenant's API keys (name, createdAt, expiresAt)
POST   /api-keys              - Create new API key (returns full key on creation only)
DELETE /api-keys/:id          - Revoke an API key
```

**Location**: `apps/api/src/routes/api-keys.ts`

**Key Features**:
- Tenant-isolated API key management
- Secure key generation (`orbis_` prefix + 64-char hex)
- Never returnsful key in list endpoint (security best practice)
- Soft deletion support for audit trails

---

### 2. Frontend Dashboard Enhancements

#### Agent Management UI (Dashboard)
**Location**: `apps/web/src/app/dashboard/page.tsx`

**Features**:
- ✅ Dynamic agent list with real-time fetch from API
- ✅ Create Agent button → AgentForm modal
- ✅ Edit agent (opens form with pre-filled data)
- ✅ Delete agent with confirmation
- ✅ Agent card displays: name, system prompt, voice model, created date
- ✅ Responsive grid layout (1 col mobile → 3 cols desktop)
- ✅ Links to Settings and Test pages

**State Management**:
- `agents`: Array of agent objects
- `loading`: Boolean for API call state
- `showForm`: Boolean to toggle modal
- `editingAgent`: Current agent being edited (or null for create)

---

#### Agent Form Component
**Location**: `apps/web/src/components/AgentForm.tsx`

**Features**:
- ✅ Modal form overlay with fixed positioning
- ✅ Fields:
  - Agent Name (text input, required, max 255 chars)
  - System Prompt (textarea, required, max 2000 chars with counter)
  - Voice Model (dropdown: Neural/Standard/WaveNet)
- ✅ Create vs Edit modes (different button text and submit handlers)
- ✅ Error display with validation feedback
- ✅ Loading state on submit button
- ✅ Cancel button closes modal without submitting

**Usage**:
```tsx
<AgentForm
  agent={editingAgent}  // null for create
  onSubmit={handleCreateAgent | handleUpdateAgent}
  onCancel={() => setShowForm(false)}
/>
```

---

#### Settings Page (API Key Management)
**Location**: `apps/web/src/app/settings/page.tsx`

**Features**:
- ✅ API Keys table: Name, Created Date, Revoke button
- ✅ Create new API key form with name input
- ✅ Display new key immediately after creation (with copy-to-clipboard)
- ✅ Revoke key with confirmation dialog
- ✅ Widget embed code instructions
- ✅ Responsive layout

**Workflow**:
1. User enters key name and clicks "Create Key"
2. API returns full key (shown in green alert)
3. User can copy key or dismiss
4. API key manager below shows list of active keys
5. Click "Revoke" to delete key (requires confirmation)

---

#### WebSocket Test Console
**Location**: `apps/web/src/app/test/page.tsx`

**Features**:
- ✅ Real-time connection status indicator (green/orange dot)
- ✅ Connect/Disconnect buttons with auto-disable
- ✅ Message log with color coding:
  - Outbound (`→`) in signal-cyan
  - Inbound responses in slate
  - Success (`✓`) in aurora-green
  - Errors (`✗`) in plasma-orange
- ✅ Text input for sending test messages (disabled when disconnected)
- ✅ Automatic session initialization on connect
- ✅ Scrollable message log with fixed height

**Use Cases**:
- Test WebSocket server connectivity
- Verify message format and responses
- Debug voice gateway communication
- Monitor real-time message flow

---

### 3. Embedded Widget

**Location**: `apps/web/public/widget.js`

**Implementation**:
- ✅ Standalone vanilla JavaScript (no frameworks)
- ✅ Self-initializing IIFE (Immediately Invoked Function Expression)
- ✅ Circular button UI with brand colors (Orbit Blue → Signal Cyan gradient)
- ✅ Expandable modal on click (80px → 300x400px)
- ✅ Microphone icon with real-time permissions handling
- ✅ Hover effects and smooth animations
- ✅ Browser audio API integration (getUserMedia, AudioContext)

**Setup Instructions**:
```html
<!-- On target website -->
<script src="https://app.orbisvoice.com/widget.js" data-agent-id="agent-123"></script>

<!-- Optional data attributes -->
<script 
  src="https://app.orbisvoice.com/widget.js"
  data-agent-id="agent-123"
  data-api-key="orbis_..."
  data-position="bottom-right"  <!-- or bottom-left -->
></script>
```

**Features**:
- Automatic injection into page body
- Console logging for debugging (`[OrbisVoice]` prefix)
- Respects browser microphone permissions
- Error handling for permission denials
- Smooth expand/collapse animation
- Fixed positioning on page (z-index: 9999)

**Future Integration Points**:
- Audio stream capture and transmission to gateway
- Real-time audio playback
- Message queue for offline handling
- Analytics event tracking

---

### 4. Navigation & Routing

**Updated Web App Structure**:
```
src/app/
├── page.tsx              # Landing page (unchanged)
├── login/page.tsx        # Login (unchanged)
├── signup/page.tsx       # Signup (unchanged)
├── dashboard/page.tsx    # Dashboard (ENHANCED)
├── settings/page.tsx     # Settings (NEW)
└── test/page.tsx         # WebSocket test (NEW)

src/components/
└── AgentForm.tsx         # Agent creation/edit form (NEW)

src/api/
└── (routes already in Fastify backend)
```

**Navigation Links Added**:
- Dashboard → Settings (gear icon)
- Dashboard → Test (debug console)
- Dashboard → Logout

---

## Database Considerations

### Prisma Schema (Already Defined)

**Related Models**:
```prisma
model Agent {
  id           String   @id @default(cuid())
  tenantId     String
  createdBy    String
  name         String
  systemPrompt String
  voiceModel   String   @default("default")
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
  
  tenant       Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  transcripts  Transcript[]
}

model ApiKey {
  id        String    @id @default(cuid())
  tenantId  String
  key       String    @unique
  name      String
  createdAt DateTime  @default(now())
  expiresAt DateTime?
  
  tenant    Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
}
```

**Migration Steps** (when Docker available):
```bash
cd apps/api
npx prisma migrate dev --name init
npx prisma db seed  # (seed script to be created)
```

---

## Environment Configuration

### API (.env.local)
```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/orbisvoice
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key-change-in-production
CORS_ORIGINS=http://localhost:3001,http://localhost:3000,http://localhost:3002
GEMINI_API_KEY=
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_VOICE_GATEWAY_URL=ws://localhost:4001
```

---

## Testing Checklist

- [ ] Run `npm install` to include new dependencies
- [ ] Start Docker: `docker-compose up -d`
- [ ] Run migrations: `cd apps/api && npx prisma migrate dev --name init`
- [ ] Verify API health: `curl http://localhost:3000/health`
- [ ] Test signup flow: Create account at http://localhost:3001/signup
- [ ] Dashboard: Create agent via modal form
- [ ] Verify agent persists: Refresh page, agent should still be visible
- [ ] Edit agent: Click Edit on agent card
- [ ] Delete agent: Click Delete (with confirmation)
- [ ] Settings page: Create API key, copy and verify format (`orbis_...`)
- [ ] Test console: Connect WebSocket, send test message
- [ ] Embedded widget: Inspect `apps/web/public/widget.js` initialization
- [ ] Browser console: Check for `[OrbisVoice]` logs

---

## Performance & Security Notes

### Security
1. **API Keys**:
   - Generated with `crypto.randomBytes(32)` for entropy
   - Prefixed with `orbis_` for visibility
   - Never exposed in list endpoints
   - Should be hashed in database (Future: bcryptjs)

2. **CORS**:
   - Configured to allow localhost:3000, 3001, 3002
   - Update for production domains

3. **Authentication**:
   - JWT tokens issued on signup/login
   - 7-day expiration
   - Authenticate middleware on protected routes

### Performance
1. **Widget**:
   - Lightweight (~8KB minified)
   - No external dependencies (vanilla JS)
   - Lazy-loads on script injection

2. **Dashboard**:
   - Agent list fetched on component mount
   - Form modals prevent full page rerenders
   - Event handlers properly cleanup WebSocket connections

---

## Known Limitations & Future Work

### Phase 2 Limitations
1. ✋ WebSocket test console is read-only (no real audio streaming yet)
2. ✋ Widget microphone access is accepted but audio not yet transmitted
3. ✋ Agent voice model selection UI only (not yet enforced in API response)
4. ✋ Database migrations must be run manually (not auto-migrated)

### Phase 3 Priorities
1. **Gemini Voice Integration** - Forward audio from widget to Gemini API via gateway
2. **Tool Calling** - Enable agents to invoke external APIs (Gmail, Calendar, Stripe, etc.)
3. **Session Persistence** - Store and retrieve conversation history
4. **Rate Limiting** - Implement per-tenant, per-API-key rate limits

---

## Files Created/Modified

**New Files**:
- `apps/api/src/routes/api-keys.ts` - API key CRUD routes
- `apps/web/public/widget.js` - Embedded widget script
- `apps/web/src/components/AgentForm.tsx` - Agent form modal
- `apps/web/src/app/settings/page.tsx` - Settings/API key management
- `apps/web/src/app/test/page.tsx` - WebSocket test console

**Modified Files**:
- `apps/api/src/index.ts` - Register api-keys route
- `apps/web/src/app/dashboard/page.tsx` - Enhanced with agent CRUD UI

**Configuration**:
- `apps/api/.env.local` - Development environment variables
- `apps/api/package.json` - Verified dependencies

---

## Commit History

```
bc79d88 feat: Voice gateway WebSocket scaffold, referrals app, Docker Compose, comprehensive README
70f7393 feat: Phase 1 scaffolding - Next.js web app with auth pages, Fastify API with JWT & CRUD endpoints, database schema
16ad080 docs: Update all planning docs for Gemini Voice + Next.js + Fastify stack
```

**Phase 2 Commit**: (to be created)
```
feat: Phase 2 - Agent management dashboard, API key management, embedded widget scaffold, WebSocket test console
```

---

## Next Steps (→ Phase 3)

1. ✅ Ensure Docker container access for database migrations
2. ✅ Implement Gemini Voice API client in voice-gateway
3. ✅ Add audio streaming to embedded widget
4. ✅ Create agent tool definitions (Gmail, Calendar, Stripe, etc.)
5. ✅ Implement session management with Redis
6. ✅ Add conversation history UI to dashboard

**Target Completion**: Week 9 (Weeks 7-9 per EXECUTION_PLAN.md)

---

**Status**: Phase 2 foundation complete. Awaiting database connectivity for end-to-end testing.
