# 1. Stack Summary

- **Languages**: TypeScript-first monorepo, with small JS/config surfaces.
- **Frameworks**: Next.js 16 (`apps/web`, `apps/phase-dashboard`), Fastify (`apps/api`, `apps/commerce-agent`), ws-based gateway (`apps/voice-gateway`).
- **Runtime**: Node.js.
- **Package manager**: `pnpm` workspace monorepo.
- **Type system**: TypeScript + Prisma-generated DB types.
- **Build systems**: Next.js build for web apps, `tsc` for service apps.
- **Entry points**:
  - `apps/web` -> Next app router entry (`src/app/*`)
  - `apps/phase-dashboard` -> Next app router (`app/*`)
  - `apps/api` -> `src/index.ts`
  - `apps/commerce-agent` -> `src/index.ts`
  - `apps/voice-gateway` -> `src/index.ts`
  - `apps/referrals` -> `src/index.ts`
- **Major domains/features**: auth/session, admin/system settings, users/tenants, affiliate/referral, billing/Stripe, notifications/email, calendar/Google integrations, voice gateway/tool execution.

# 2. Project Structure Summary

- Top-level structure is a **multi-package workspace** under `apps/*`.
- Style is a **modular monolith + service sidecars**:
  - web UI and dashboard apps,
  - central API,
  - specialized services (voice gateway, commerce agent, referrals).
- Hand-written source and generated Prisma artifacts are co-located in app trees, increasing refactor noise and review overhead.

# 3. Baseline Health Signals

- Root scripts available in `package.json`:
  - `dev`: `pnpm -r --parallel dev`
  - `build`: `pnpm -r build`
  - `lint`: `pnpm -r lint`
- Per-package validations appear available:
  - `apps/api`: `lint`, `typecheck`, `test`, `build`
  - `apps/web`: `lint`, `typecheck`, `test`, `build`
  - `apps/voice-gateway`: `lint`, `typecheck`, `test`, `build`
  - `apps/referrals`: `lint`, `typecheck`, `test`, `build`
- Weaknesses observed during baseline work:
  - environment-sensitive startup conflicts (port reuse/stale processes),
  - DB/schema drift and extension prerequisites (Prisma + `vector` type),
  - monorepo-wide test command is not standardized at root.

# 4. Refactor Inventory

- **oversized files**
  - `apps/web/src/app/settings/page.tsx` (~3832 lines): broad admin UI + data logic + integrations in one file.
  - `apps/api/src/routes/users.ts` (~1968 lines): many unrelated user/admin/integration responsibilities.
  - `apps/web/src/app/components/AgentBuilderForm.tsx` (~1101 lines): UI + sockets + autosave + orchestration.

- **oversized functions**
  - Long, nested async route handlers in `apps/api/src/routes/users.ts`.
  - Large component-level control flow blocks in `apps/web/src/app/settings/page.tsx`.

- **weak naming**
  - Heavy use of generic identifiers (`data`, `body`, `err`, `config`) in dense handlers; intent is often implicit.

- **duplication**
  - Repeated fetch + token + error handling patterns in web admin pages.
  - Repeated request user extraction and fallback logic across API route files.
  - Similar response envelopes and catch/500 logic repeated ad hoc.

- **mixed responsibilities**
  - `apps/web/src/app/settings/page.tsx`: rendering, transport, config normalization, auth token handling.
  - `apps/api/src/routes/users.ts`: validation, policy checks, DB writes, third-party config, response shaping.
  - `apps/api/src/tools/handlers.ts`: tool registration + fallback stubs + live integration behavior.

- **dead code candidates**
  - Placeholder/TODO tool handlers in `apps/api/src/tools/handlers.ts` (product/inventory/escalation stubs).
  - Disabled/commented feature blocks in UI/auth areas are candidate stale paths.
  - Not classified as dead without execution/path evidence.

- **weak typing / weak contracts**
  - Widespread `any` usage in critical paths (`settings` page, `users` routes, `voice-gateway` runtime handlers).
  - Inconsistent API response typing at page boundaries.

- **error handling issues**
  - Many broad catches emit generic 500s without normalized error metadata.
  - Inconsistent logging depth and message specificity across modules.

- **structure issues**
  - Route mega-files acting as utility + policy + transport dumping grounds.
  - Generated artifacts committed alongside source increase cognitive load and diff churn.

- **fragile integrations**
  - Auth/session: `apps/api/src/routes/auth.ts`, `apps/api/src/middleware/auth.ts`.
  - Billing/payments: `apps/api/src/routes/billing.ts`, `apps/api/src/routes/stripe-webhooks.ts`, `apps/api/src/integrations/stripe.ts`.
  - Notifications and external comms: `apps/api/src/services/notification.ts`, `apps/api/src/routes/google-auth.ts`, `apps/voice-gateway/src/index.ts`.

# 5. Risk Map

- **Low Risk**
  - Small presentational UI components without side effects.
  - Isolated pure transformation helpers.

- **Medium Risk**
  - Admin page modules that mix view logic with repetitive request wrappers.
  - Read-heavy routes with contained DB access.

- **High Risk**
  - `apps/api/src/routes/auth.ts`, `apps/api/src/middleware/auth.ts`
    - **Why risky**: cross-cutting authentication/session enforcement.
    - **Depends on it**: all protected endpoints and user context extraction.
    - **Validate later with**: login/logout flows, token expiry, protected route matrix.

  - `apps/api/src/routes/billing.ts`, `apps/api/src/routes/stripe-webhooks.ts`
    - **Why risky**: external payment side effects and idempotency concerns.
    - **Depends on it**: subscription state, checkout, financial events.
    - **Validate later with**: webhook replay/idempotency tests, checkout smoke, status reconciliation.

  - `apps/api/src/routes/users.ts`
    - **Why risky**: combines identity, role, tenant, and integration writes.
    - **Depends on it**: admin/user operations and settings surfaces.
    - **Validate later with**: contract tests per endpoint group and role-based access checks.

  - `apps/voice-gateway/src/index.ts`, `apps/api/src/tools/handlers.ts`
    - **Why risky**: realtime session coordination + tool dispatch + third-party failures.
    - **Depends on it**: voice interactions, async tool execution reliability.
    - **Validate later with**: socket/session smoke tests and tool execution regression suite.

# 6. Ranked Refactor Candidates

1. **Split `apps/web/src/app/settings/page.tsx` into feature panels + hooks**
   - Clarity Gain: **High**
   - Regression Risk: **Medium**
   - Dependency Spread: **Wide**
   - Validation Ease: **Moderate**

2. **Decompose `apps/api/src/routes/users.ts` into focused route/service modules**
   - Clarity Gain: **High**
   - Regression Risk: **High**
   - Dependency Spread: **Wide**
   - Validation Ease: **Hard**

3. **Create typed request/response adapters for web API calls**
   - Clarity Gain: **High**
   - Regression Risk: **Medium**
   - Dependency Spread: **Moderate**
   - Validation Ease: **Moderate**

4. **Standardize API error response construction**
   - Clarity Gain: **Medium**
   - Regression Risk: **Low**
   - Dependency Spread: **Moderate**
   - Validation Ease: **Easy**

5. **Reduce `any` usage at high-risk boundaries first**
   - Clarity Gain: **High**
   - Regression Risk: **Medium**
   - Dependency Spread: **Moderate**
   - Validation Ease: **Moderate**

6. **Split `apps/api/src/tools/handlers.ts` by domain tool packs**
   - Clarity Gain: **Medium**
   - Regression Risk: **Medium**
   - Dependency Spread: **Moderate**
   - Validation Ease: **Moderate**

# 7. Recommended Execution Order

1. Low-risk extraction in `apps/web/src/app/settings/page.tsx` (pure structure first, behavior unchanged).
2. Introduce typed web API adapters and migrate selected pages.
3. Add API response/error helper utilities and adopt in low-risk route groups.
4. Split `apps/api/src/routes/users.ts` by concern (profile/admin/integrations) with contract parity.
5. Refactor integration-heavy modules (`tools/handlers`, voice gateway) only after targeted regression harness exists.

# 8. Validation Strategy

- Validate each batch in-package before cross-package checks:
  - `pnpm --filter orbisvoice-web lint && pnpm --filter orbisvoice-web typecheck && pnpm --filter orbisvoice-web build`
  - `pnpm --filter orbisvoice-api lint && pnpm --filter orbisvoice-api typecheck && pnpm --filter orbisvoice-api test`
- For high-risk modules, require targeted smoke suites:
  - auth login/protected-route checks,
  - billing checkout + webhook processing,
  - notifications and integration endpoint sanity checks.
- Keep one refactor axis per batch (no dependency upgrades + behavioral changes bundled).
- Coverage gaps to acknowledge: realtime gateway paths and external-integration failure modes are weakly automated.

# 9. Immediate No-Go Zones

- `apps/api/src/routes/stripe-webhooks.ts`: payment event correctness risk.
- `apps/api/src/routes/auth.ts` and `apps/api/src/middleware/auth.ts`: cross-cutting auth blast radius.
- `apps/voice-gateway/src/index.ts`: realtime orchestration/timing-sensitive behavior.
- Prisma migration-sensitive code paths while schema/environment remains unstable.
- Any mixed batch that combines refactor + dependency/migration changes.

# 10. Phase 2 Handoff Plan

- **Batch 1 (Low risk)**: split `apps/web/src/app/settings/page.tsx` into panel components and local hooks with identical behavior.
- **Batch 2 (Low-Medium)**: introduce typed web API layer and replace repeated fetch/error code in selected pages.
- **Batch 3 (Medium)**: standardize API response/error helpers and adopt in low-risk route files.
- **Batch 4 (Medium-High)**: decompose `apps/api/src/routes/users.ts` into bounded modules while preserving endpoint contracts.
- **Batch 5 (High)**: refactor integration-heavy handlers and voice gateway after dedicated regression checks are in place.
- **Exit criteria per batch**: lint + typecheck + tests/build pass, plus targeted smoke checks for touched risk areas.
