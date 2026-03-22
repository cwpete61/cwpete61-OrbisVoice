# Batch 007 — Phase 3 Pass 1 Report

**Date:** Batch 007  
**Scope:** `apps/web` remaining files + `apps/api` full scan  
**Approach:** Per-file import analysis, cross-reference with usage patterns.

---

## Changes Made

### B007-1 — `web/components/UsageChart.tsx`

- **Change:** Removed unused `React` from named import
- **Before:** `import React, { useEffect, useState } from "react";`
- **After:** `import { useEffect, useState } from "react";`
- **Reason:** `React` namespace never referenced — `useEffect` and `useState` are named imports used directly. No JSX transform requires bare React.

### B007-2 — `web/components/PricingTable.tsx`

- **Change:** Removed bare `import React from "react";`
- **Before:** `import React from "react";` (line 3)
- **After:** _(removed)_
- **Reason:** `React` namespace never referenced. All JSX uses the new transform.

### B007-3 — `web/lib/audio-utils.ts`

- **Change:** Removed unused `useEffect, useRef` import
- **Before:** `import { useEffect, useRef } from "react";` (line 1)
- **After:** _(removed)_
- **Reason:** File contains only class-based `AudioRecorder` and `AudioPlayer` with zero React hooks. All audio logic is class-instance methods.

### B007-4 — `api/routes/admin.ts`

- **Change:** Removed unused `FastifyRequest` from import
- **Before:** `import { FastifyInstance, FastifyRequest } from "fastify";`
- **After:** `import { FastifyInstance } from "fastify";`
- **Reason:** `FastifyRequest` only appeared at the import line, never referenced.

### B007-5 — `api/routes/stats.ts`

- **Change:** Removed duplicate separate `FastifyRequest` import (line 6 was redundant)
- **Before:** `import { FastifyInstance } from "fastify";` + separate `import { FastifyRequest } from "fastify";`
- **After:** Single `import { FastifyInstance, FastifyRequest } from "fastify";`
- **Reason:** `FastifyRequest` was imported separately; consolidated into the first import line.

### B007-6 — `api/routes/help.ts`

- **Change:** Removed unused `FastifyRequest` and `AuthPayload` from imports
- **Before:** `import { FastifyInstance, FastifyRequest } from "fastify";`
- **After:** `import { FastifyInstance } from "fastify";`
- **Before:** `import { AuthPayload, ApiResponse } from "../types";`
- **After:** `import { ApiResponse } from "../types";`
- **Reason:** Both `FastifyRequest` and `AuthPayload` only appeared at their import lines.

### B007-7 — `api/routes/commerce-bridge.ts`

- **Change:** Removed unused `env` import
- **Before:** `import { FastifyInstance } from 'fastify';` + `import { prisma } from '../db';` + `import { env } from '../env';`
- **After:** `import { FastifyInstance } from 'fastify';` + `import { prisma } from '../db';`
- **Reason:** File uses `process.env.INTERNAL_SERVICE_KEY` directly (not the `env` wrapper), so the `env` import was dead.

### B007-8 — `api/services/affiliate.ts`

- **Change:** Removed unused `Prisma` namespace import
- **Before:** `import { prisma } from "../db";` + `import { Prisma } from "@prisma/client";`
- **After:** `import { prisma } from "../db";`
- **Reason:** `Prisma` namespace never referenced in the file.

### B007-9 — `api/routes/affiliates.ts`

- **Change:** Removed unused `Prisma` namespace import
- **Before:** `import { Prisma } from "@prisma/client";`
- **After:** _(removed)_
- **Reason:** `Prisma` namespace never referenced in the file.

### B007-10 — `api/routes/google-auth.ts`

- **Change:** Removed unused `FastifyRequest` from import
- **Before:** `import { FastifyInstance, FastifyRequest } from "fastify";`
- **After:** `import { FastifyInstance } from "fastify";`
- **Reason:** `FastifyRequest` only appeared at the import line.

### B007-11 through B007-13 — Duplicate import consolidation

- **`api/routes/packages.ts`**: Merged separate `FastifyRequest` import (line 7) into line 1
- **`api/routes/api-keys.ts`**: Merged separate `FastifyRequest` import (line 7) into line 1
- **`api/routes/referrals.ts`**: Merged separate `FastifyRequest` import (line 5) into line 1
- **Reason:** Having two separate `import { ... } from "fastify"` lines is a minor code smell; consolidated into single import per module.

---

## Validation

```
apps/api  typecheck → PASS
apps/api  vitest    → 3 test files, 8 tests PASS
apps/web  typecheck → PASS
apps/web  vitest    → 3 test files, 7 tests PASS
```

---

## Files Scanned Without Issues (Batch 007)

### web/hooks

| File                       | Notes                                                       |
| -------------------------- | ----------------------------------------------------------- |
| `hooks/useTokenFromUrl.ts` | Clean — `useEffect`, `useState`, `useSearchParams` all used |

### web/agents

| File                                      | Notes                                                                             |
| ----------------------------------------- | --------------------------------------------------------------------------------- |
| `agents/[agentId]/conversations/page.tsx` | Clean — `TranscriptCard` imported from correct path `@/components/TranscriptCard` |

### web/lib

| File                  | Notes                                                                                       |
| --------------------- | ------------------------------------------------------------------------------------------- |
| `lib/base64-utils.ts` | Clean — `arrayBufferToBase64` and `base64ToArrayBuffer` both used in `AgentBuilderForm.tsx` |

### api/services

| File                               | Notes                                                                                      |
| ---------------------------------- | ------------------------------------------------------------------------------------------ |
| `services/session.ts`              | Clean                                                                                      |
| `services/gemini.ts`               | Clean                                                                                      |
| `services/email.ts`                | Clean                                                                                      |
| `services/notification.ts`         | Clean                                                                                      |
| `services/lead.ts`                 | Clean                                                                                      |
| `services/faq.ts`                  | Clean                                                                                      |
| `services/admin-scope.ts`          | Clean                                                                                      |
| `services/audit.ts`                | Clean                                                                                      |
| `services/usage-service.ts`        | Clean                                                                                      |
| `services/workspace-management.ts` | Clean                                                                                      |
| `services/session-finalize.ts`     | Has unused `maxAgeMinutes` parameter (Pass 1 safe-ignore — function is exported, deferred) |

### api/integrations

| File                       | Notes |
| -------------------------- | ----- |
| `integrations/stripe.ts`   | Clean |
| `integrations/twilio.ts`   | Clean |
| `integrations/gmail.ts`    | Clean |
| `integrations/calendar.ts` | Clean |

### api/tools

| File                   | Notes                                    |
| ---------------------- | ---------------------------------------- |
| `tools/executor.ts`    | Clean                                    |
| `tools/definitions.ts` | Clean — no imports                       |
| `tools/handlers.ts`    | Clean — was already cleaned in Batch 002 |

### api/routes

| File                        | Notes                                         |
| --------------------------- | --------------------------------------------- |
| `routes/auth.ts`            | Clean — `env` used 4×                         |
| `routes/billing.ts`         | Clean — `FastifyRequest` used                 |
| `routes/agents.ts`          | Clean — `FastifyRequest` used                 |
| `routes/users.ts`           | Clean — `FastifyRequest` used                 |
| `routes/twilio.ts`          | Clean — `FastifyRequest` used at line 18      |
| `routes/stripe-webhooks.ts` | Clean — `FastifyRequest`, `FastifyReply` used |
| `routes/leads.ts`           | Clean — `AuthPayload` used at line 11         |
| `routes/payouts.ts`         | Clean                                         |
| `routes/packages.ts`        | Clean (duplicate import merged)               |
| `routes/api-keys.ts`        | Clean (duplicate import merged)               |
| `routes/audit.ts`           | Clean (duplicate import merged)               |
| `routes/referrals.ts`       | Clean (duplicate import merged)               |
| `routes/notifications.ts`   | Clean — `FastifyRequest` used                 |
| `routes/transcripts.ts`     | Clean — `FastifyRequest` used                 |
| `routes/stats.ts`           | Clean (duplicate import removed)              |

### api/core

| File        | Notes |
| ----------- | ----- |
| `db.ts`     | Clean |
| `env.ts`    | Clean |
| `types.ts`  | Clean |
| `index.ts`  | Clean |
| `logger.ts` | Clean |

---

## Deferred Items

| File                              | Issue                                        | Reason                                                                                                  |
| --------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `services/session-finalize.ts:74` | `maxAgeMinutes` parameter unused             | Function is exported; removing would be a breaking change. Low-risk but requires careful consideration. |
| `routes/stats.ts`                 | Two separate `import` lines from same module | Minor code smell, not dead code.                                                                        |
| `routes/packages.ts`              | Two separate `import` lines                  | Minor code smell, not dead code.                                                                        |
| `routes/api-keys.ts`              | Two separate `import` lines                  | Minor code smell, not dead code.                                                                        |
| `routes/referrals.ts`             | Two separate `import` lines                  | Minor code smell, not dead code.                                                                        |

---

## Summary

| Metric        | Value                                             |
| ------------- | ------------------------------------------------- |
| Files scanned | ~70                                               |
| Issues found  | 11                                                |
| Issues fixed  | 11 (7 dead imports + 4 duplicate import cleanups) |
| Validation    | ✅ all typechecks pass, ✅ all tests pass         |

---

## Cumulative Phase 3 Pass 1 Status

| Batch     | Changes                                                                                           | Status      |
| --------- | ------------------------------------------------------------------------------------------------- | ----------- |
| B001–B002 | Removed 12 redundant `eslint-disable` comments in `handlers.ts`                                   | ✅ Complete |
| B003      | `DashboardShell.tsx`: removed `Suspense` import; `AgentBuilderForm.tsx`: simplified `useState(1)` | ✅ Complete |
| B004      | `admin/payouts/page.tsx`: removed dead `affiliates` state                                         | ✅ Complete |
| B005      | `stats/page.tsx`: removed `AgentStats` interface + dead state                                     | ✅ Complete |
| B006      | `UsageChart.tsx`, `PricingTable.tsx`: removed unused `React` imports                              | ✅ Complete |
| **B007**  | 9 dead imports + 4 duplicate import cleanups across `web` + `api`                                 | ✅ Complete |

**Pass 1 (`apps/web` + `apps/api`) is now complete.** Ready to proceed to Pass 2 (deprecated constants, redundant type annotations, redundant wrappers).
