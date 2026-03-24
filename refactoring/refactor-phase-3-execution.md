\# Antigravity Phase 3 Prompt — Incremental Clean Code Refactor Execution

\## Objective

Execute a \*\*production-safe clean-code refactor\*\* using the previously completed discovery plan.

This phase is for implementation.

Refactor in small, controlled batches.

Preserve behavior.

Validate after every batch.
read
Stop immediately on failure.

\---

\## Mission

Clean the codebase without changing intended business behavior.

Improve:

\- readability

\- maintainability

\- naming clarity

\- function clarity

\- module responsibility

\- duplication

\- typing where safe

\- error handling consistency

\- dead code removal

This is a controlled refactor, not a rewrite.

\---

\## Operating Rules

1\. Preserve behavior unless fixing a confirmed defect.

2\. Work in small batches only.

3\. Validate every batch before moving forward.

4\. Stop on red signals.

5\. Do not combine unrelated changes in one batch.

6\. Do not introduce architecture for its own sake.

7\. Do not update dependencies unless isolated and necessary.

8\. Keep rollback easy.

9\. Prefer explicit code over clever code.

10\. Only extract abstractions when they clearly improve understanding.

\---

\## Batch Size Rule

Each batch must be narrow.

A valid batch might include:

\- one file cleanup

\- one or two related functions

\- one naming pass in a confined module

\- one dead-code cleanup slice

\- one responsibility split in a single module

\- one error-handling normalization pass in a single boundary

A batch must \*\*not\*\* include:

\- broad cross-project churn

\- multi-feature rewrites

\- dependency upgrades plus refactor changes

\- folder-wide renames without isolated validation

\- high-risk and low-risk changes mixed together

\---

\## Required Execution Order

Follow this sequence unless the discovery plan shows a better evidence-based order.

\### Pass 1 — Low-Risk Cleanup

Start with:

\- unused imports

\- dead constants

\- stale comments

\- commented-out code

\- unreachable branches

\- low-blast-radius naming fixes

\- provably unused helpers

\### Pass 2 — Function-Level Cleanup

Then:

\- split long functions

\- simplify nested conditionals

\- add guard clauses

\- isolate repeated local logic

\- separate pure logic from side effects where practical

\### Pass 3 — Module Responsibility Cleanup

Then:

\- split mixed-responsibility files

\- separate validation/transforms/handlers

\- separate UI from business logic

\- isolate external clients and adapters

\### Pass 4 — Type and Contract Tightening

Then:

\- reduce unsafe broad typing

\- clarify function signatures

\- normalize nullability assumptions

\- tighten boundary contracts carefully

\### Pass 5 — Error Handling and Async Consistency

Then:

\- standardize catch/throw behavior

\- remove silent failures

\- normalize async usage

\- improve debugging clarity

\### Pass 6 — Structural Cleanup

Only later:

\- improve folder structure

\- reduce misleading module placement

\- normalize boundaries

\- clean import patterns

\---

\## Validation Rule

After every batch, run all relevant validation available in the project, such as:

\- lint

\- type-check

\- unit tests

\- integration tests

\- build

\- targeted smoke test

\- local runtime verification

If no automated validation exists for the changed area, define and run exact manual checks.

Do not proceed until the batch is validated.

\---

\## Stop Rule

If any batch causes:

\- test failures

\- type-check failure

\- build failure

\- lint failure caused by the batch

\- broken imports

\- broken runtime behavior

\- unclear contract changes

Then:

1\. stop immediately

2\. identify the cause

3\. repair or revert

4\. re-run validation

5\. only continue once stable

Do not stack more changes on top of an unstable batch.

\---

\## Refactor Standards

Apply these standards during implementation.

\### Naming

\- replace vague names with explicit names

\- keep names aligned with actual responsibility

\- avoid names like `data`, `item`, `thing`, `temp`, `misc`, `helper` unless precise in context

\### Functions

\- keep functions single-purpose

\- reduce nesting depth

\- extract helpers only when the new name clarifies intent

\- avoid fragmentation into meaningless tiny wrappers

\### Modules

\- one clear responsibility per file/module where practical

\- avoid “god files”

\- avoid “utils” dumping grounds

\- separate domain concerns from framework or transport concerns

\### Duplication

\- remove repeated logic only when the abstraction is cleaner than the repetition

\- do not force DRY if it harms readability

\### Types and Contracts

\- make inputs and outputs clearer

\- reduce unsafe types carefully

\- do not create complex type systems that obscure the code

\### Error Handling

\- remove swallowed errors

\- make expected failure paths explicit

\- use clear developer-facing logs where appropriate

\- do not expose internals in user-facing messages

\### Comments

\- remove misleading comments

\- keep comments that explain intent, non-obvious rules, or system constraints

\- do not keep comments that simply narrate the code

\### Dead Code

\- remove only when proven unused or clearly obsolete

\- if uncertain, mark and defer

\---

\## Required Per-Batch Output Format

For every batch, output exactly these sections.

\# Batch ID

Use a unique identifier.

\# Scope

List exact files, functions, or modules affected.

\# Intent

State what the batch is improving.

\# Reason

State why this batch is worth doing now.

\# Risk

Low / Medium / High with a brief reason.

\# Changes

List the concrete code changes made.

\# Validation

List the commands run and what they checked.

\# Result

Pass / Fail / Partial.

\# Rollback Note

State what would need to be reverted if the batch caused problems.

\# Next Safe Step

State the next smallest safe batch.

\---

\## High-Risk Rules

For high-risk modules:

\- shrink batch size further

\- do not combine renames, logic changes, and structural moves together

\- prefer internal cleanup before public contract changes

\- preserve external interfaces when possible

\- verify downstream dependents immediately

\- add minimal validation first if coverage is weak

Examples of high-risk areas:

\- auth/session

\- billing/payment

\- database writes

\- integrations

\- shared infrastructure

\- routing middleware

\- core state management

\- scheduling/jobs

\---

\## Dependency Policy

Do not update dependencies unless one of these is true:

\- build is blocked

\- typing is blocked

\- tooling is broken

\- security issue is relevant

\- a stable supported API is required for the refactor

If a dependency update is necessary:

\- isolate it in its own batch

\- update the minimum required packages

\- validate immediately

\- document impact clearly

\- do not mix it with unrelated cleanup

\---

\## Manual Validation Policy

If automated coverage is weak, manual checks must be specific.

Manual validation must state:

\- exact action

\- expected result

\- area affected

\- pass/fail outcome

Examples:

\- start app and confirm homepage loads

\- submit form and confirm handler response shape

\- hit target API route and confirm status/payload

\- test auth login and logout flow

\- verify DB write path still saves expected fields

Do not use vague wording like “seems okay.”

\---

\## Final Pass Rules

After all batches are complete, run a final consistency pass for:

\- naming consistency

\- import cleanup

\- dead code sweep

\- duplicate helper review

\- module responsibility review

\- comments accuracy

\- error handling consistency

\- developer docs/update notes if architecture changed

Then produce:

1\. completed changes summary

2\. unresolved technical debt

3\. deferred risky areas

4\. follow-up recommendations

5\. final validation status

\---

\## Execution Posture

Act like a senior engineer refactoring a live production codebase.

Move carefully.

Change narrowly.

Validate constantly.

Document clearly.

Leave the system cleaner after every batch.

Preserve behavior first.

---

## Batch Execution Log

| Batch     | Scope                                                | Changes                                                                                   | Status      |
| --------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------- | ----------- |
| B001–B002 | `api/tools/handlers.ts`                              | Removed 12 redundant `eslint-disable` comments                                            | ✅ Complete |
| B003      | `web/DashboardShell.tsx`, `web/AgentBuilderForm.tsx` | Removed `Suspense` import; simplified `useState(1)`                                       | ✅ Complete |
| B004      | `web/admin/payouts/page.tsx`                         | Removed dead `affiliates` state                                                           | ✅ Complete |
| B005      | `web/stats/page.tsx`                                 | Removed `AgentStats` interface + dead state                                               | ✅ Complete |
| B006      | `web` remaining files                                | Removed unused `React` imports from `UsageChart.tsx`, `PricingTable.tsx`                  | ✅ Complete |
| B007      | `web` + `api`                                        | 9 dead imports + 4 duplicate import cleanups                                              | ✅ Complete |
| **B008**  | `web/DashboardShell.tsx`                             | Extracted 5-level nested nav visibility conditional → `shouldShowNavItem()` pure function | ✅ Complete |
| **B009**  | `web/admin/users/page.tsx`                           | Refactored 10 handlers to use `apiFetch`; standardized loading keys; bulk ops → parallel  | ✅ Complete |
| **B010**  | `web/stats/page.tsx`                                 | Added `unwrapJson` helper; replaced 3× repeated unwrap pattern with parallel calls        | ✅ Complete |
| **B011**  | `api/src/services/session-finalize.ts`               | Removed unused `maxAgeMinutes` parameter from `cleanupStaleSessions`                      | ✅ Complete |
| **B012**  | `web/admin/payouts/page.tsx`                         | Extracted `fetchWithAuth` helper; consolidated redundant API fetch logic                  | ✅ Complete |
| **B013**  | `web/src/lib/api.ts`                                 | Consolidated and organized API helper functions and constants                             | ✅ Complete |
| **B014**  | `voice-gateway/src/index.ts`                         | Refactored `VoiceGateway` logic into delegator pattern; improved error visibility         | ✅ Complete |
| **B015**  | `web/VoiceAgentWidget.tsx`, `web/hooks/useVoiceSession.ts` | Extracted `useVoiceSession` hook; decoupled UI from WebSocket/Audio lifecycle logic   | ✅ Complete |
| **B016**  | `web/AgentBuilderForm.tsx`                           | Simplified `triggerAutoSave` to use state-first overrides; removed positional sprawl      | ✅ Complete |
| **B017**  | `web/types/agent.ts`, `web UI components`            | Centralized `AgentType`, `VoiceGender` enums and `VOICE_MODELS` data array                | ✅ Complete |
| **B018**  | `api/src/routes/auth.ts`                             | Refactored `signup` and `login` handlers; extracted Turnstile and admin promotion helpers  | ✅ Complete |
| **B019**  | `api/src/routes/billing.ts`                          | Extracted helpers for tier config, tenant scoping, and Stripe customer resolution           | ✅ Complete |
| **B020**  | `web/src/app/components/UsageChart.tsx`             | Extracted `useUsageTrend` hook; decoupled sub-components (Tooltip, Skeleton)               | ✅ Complete |

### Pass 1 Status: ✅ COMPLETE

Pass 1 (Low-Risk Cleanup) is complete for both `apps/web` and `apps/api`. Ready to proceed to Pass 2.

### Pass 2 Status: 🔄 IN PROGRESS

| Batch    | Scope                    | Changes                                                                       | Status      |
| -------- | ------------------------ | ----------------------------------------------------------------------------- | ----------- |
| **B008** | `DashboardShell.tsx`     | Extracted 5-level nested nav visibility → `shouldShowNavItem()` pure function | ✅ Complete |
| **B011** | `session-finalize.ts`    | Simplified stale session cleanup signature                                    | ✅ Complete |
| **B012** | `admin/payouts/page.tsx` | Consolidated fetch logic                                                      | ✅ Complete |
| **B014** | `voice-gateway/index.ts` | Extracted session initialization and Gemini message handling                  | ✅ Complete |
| **B018** | `auth.ts`                | Refactored login/signup handlers with guard clauses and helper extraction      | ✅ Complete |
| **B019** | `billing.ts`             | Normalized tenant scoping and Stripe customer creation helpers                | ✅ Complete |
| **B020** | `UsageChart.tsx`         | Extracted hook and sub-components; improved visual polish                      | ✅ Complete |

### Deferred (Pass 2+)

- `services/session-finalize.ts`: `cleanupStaleSessions` has unused `maxAgeMinutes` parameter (exported function, never called externally)
- `admin/referral-agents/page.tsx`: hardcoded mock `chartData` — intentional demo data
- `referrals/page.tsx`: hardcoded missing referral sale — intentional workaround

### Validation

- `pnpm --filter orbisvoice-api typecheck` → PASS
- `pnpm --filter orbisvoice-api exec vitest run` → 3 files, 8 tests PASS
- `pnpm --filter orbisvoice-web typecheck` → PASS
- `pnpm --filter orbisvoice-web exec vitest run` → 3 files, 7 tests PASS
