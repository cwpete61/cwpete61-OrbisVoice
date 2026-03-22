# Batch 006 — Phase 3 Pass 1 Report

**Date:** Batch 006  
**Scope:** Remaining `apps/web/src/app/**/*.tsx` files  
**Approach:** Scan each file for unused imports, dead constants, stale comments, and provably useless conditionals.

---

## Changes Made

### B006-1 — `components/UsageChart.tsx`

- **Change:** Removed unused `React` from named import
- **Before:** `import React, { useEffect, useState } from "react";`
- **After:** `import { useEffect, useState } from "react";`
- **Reason:** `React` was imported but never referenced in the file (no `React.Fragment`, `React.Component`, etc.). The `useEffect` and `useState` named imports are actively used.
- **Risk:** None — the new JSX transform (React 17+) doesn't require a bare `React` import.

### B006-2 — `components/PricingTable.tsx`

- **Change:** Removed unused `import React from "react";`
- **Before:** `import React from "react";` (line 3)
- **After:** _(removed)_
- **Reason:** `React` was imported but never referenced. The component uses JSX directly without needing the React namespace.
- **Risk:** None — new JSX transform means no bare React import needed.

---

## Validation

```
pnpm --filter orbisvoice-web typecheck  → PASS
pnpm --filter orbisvoice-web exec vitest run  → 3 test files, 7 tests PASS
```

---

## Files Scanned Without Issues

The following files were read in full (or significant portions) and found **clean** — no dead code found:

### Pages

| File                                               | Notes                                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `settings/page.tsx` (3832 lines)                   | `Suspense`, `useState`, `useEffect`, `useSearchParams` all used; no dead imports or state |
| `billing/page.tsx` (621 lines)                     | `retrySyncUntilPaid` from `./sync-utils` IS used at line 55; all imports active           |
| `auth/google/gmail/callback/page.tsx` (2 lines)    | Re-export — clean                                                                         |
| `auth/google/calendar/callback/page.tsx` (2 lines) | Re-export — clean                                                                         |
| `a/[slug]/page.tsx` (31 lines)                     | Clean — all imports used                                                                  |
| `test/page.tsx` (159 lines)                        | Clean — WebSocket test console, all code active                                           |
| `help/page.tsx` (190 lines)                        | Clean — `Suspense` used at line 189                                                       |
| `blog/page.tsx` (105 lines)                        | Clean — static marketing content                                                          |
| `pricing/page.tsx` (240 lines)                     | Clean — `useEffect`, `useState` used                                                      |
| `notifications/page.tsx` (147 lines)               | Clean — `Suspense` used at line 146                                                       |
| `partner/page.tsx` (137 lines)                     | Clean — async server component                                                            |
| `partner/apply/page.tsx` (158 lines)               | Clean — all imports used                                                                  |
| `admin/help/page.tsx` (280 lines)                  | Clean — `Suspense` used at line 279                                                       |
| `admin/subscribers/[id]/page.tsx` (469 lines)      | Clean — `SubscriberDetail`, `TwilioConfig`, `TenantGoogleConfig`, `authHeader` all used   |
| `admin/page.tsx` (355 lines)                       | Clean — all recharts imports and state used                                               |
| `auth/google/callback/page.tsx` (109 lines)        | Clean — `Suspense` used at line 105                                                       |
| `auth/gmail/callback/page.tsx` (96 lines)          | Clean — `Suspense` used at line 92                                                        |
| `page.tsx` (home, 343 lines)                       | Clean — static marketing page                                                             |
| `admin/tenants/page.tsx` (208 lines)               | Clean — `React.Fragment` used at line 109                                                 |

### Components

| File                                             | Notes                                             |
| ------------------------------------------------ | ------------------------------------------------- |
| `components/Toggle.tsx` (19 lines)               | Clean                                             |
| `components/PasswordInput.tsx` (39 lines)        | Clean                                             |
| `components/Footer.tsx` (117 lines)              | Clean                                             |
| `components/FAQItem.tsx` (33 lines)              | Clean                                             |
| `components/IdleTimeoutModal.tsx` (109 lines)    | Clean — all imports used                          |
| `components/PublicNav.tsx` (111 lines)           | Clean                                             |
| `components/ProfileMenu.tsx` (411 lines)         | Clean — all imports used                          |
| `components/UserInfoCard.tsx` (142 lines)        | Clean — all imports used                          |
| `components/OriginalFAQAccordion.tsx` (42 lines) | Clean                                             |
| `components/AffiliateShell.tsx` (157 lines)      | Clean                                             |
| `components/TenantSettingsPanel.tsx` (246 lines) | Clean — no `React` import, all named imports used |
| `layout.tsx` (23 lines)                          | Clean                                             |

---

## Deferred Items (Not Dead Code)

- **`components/TranscriptCard.tsx`** imported from wrong path in `agents/[agentId]/conversations/page.tsx` — a path bug, not dead code. Deferred for a separate fix.
- **`admin/referral-agents/page.tsx`** has hardcoded mock `chartData` (lines 224–232) — intentional demo data.
- **`referrals/page.tsx`** has hardcoded missing referral sale (lines 434–454) — intentional stabilization workaround.
- **`settings/page.tsx`** is 3832 lines — a candidate for future splitting, but no dead code found within.

---

## Suspense Import Verification

All 20 files that import `Suspense` were verified — every single one uses `<Suspense>` in its JSX output. No false positives.

---

## Summary

| Metric        | Value                              |
| ------------- | ---------------------------------- |
| Files scanned | ~40                                |
| Issues found  | 2                                  |
| Issues fixed  | 2                                  |
| Validation    | ✅ typecheck pass, ✅ 7 tests pass |

**Total changes this batch:** Removed 2 unused `React` imports (`UsageChart.tsx`, `PricingTable.tsx`).

---

## Next Steps (Batch 007+)

1. **`apps/web/src/hooks/`** — scan custom hooks for unused exports
2. **`apps/web/src/app/agents/[agentId]/page.tsx`** — not yet scanned
3. **Check `apps/web/src/lib/api.ts`** — export audit (which exports are actually used by consumers)
4. **Begin scanning `apps/api`** for Pass 1 dead code cleanup
5. **Fix** `agents/[agentId]/conversations/page.tsx` import path bug (separate low-risk fix)
