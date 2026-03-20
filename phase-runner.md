\# OrbisVoice Phase Runner

\## Sequential Execution Controller for Antigravity



This file is the operational runner for phased execution.



It is not the architecture spec.

It is not the deep system design.

It is the execution guide that tells Antigravity what to do next, in order, with validation gates between phases.



\---



\## Core Directive



Read:

\- `\_00 READ.md`

\- the active control file

\- all prompt files required by `\_00 READ.md`



Then execute only the currently requested phase.



Do not skip ahead.

Do not combine unrelated phases.

Do not perform broad rewrites.

Do not continue if the current phase fails validation.



\---



\## Active Control File Rule



The operator must specify one of:



\- `control.md`

\- `control.staging.md`

\- `control.production.md`



If no control file is specified:

\- default to `control.md`

\- do not execute high-risk or production actions



\---



\## Global Phase Rules



For every phase:



1\. inspect relevant code before editing

2\. identify dependencies

3\. make bounded changes only

4\. validate after changes

5\. report results

6\. stop if instability appears



Every phase output must include:

\- phase name

\- objective

\- files inspected

\- files changed

\- tests run

\- risks found

\- repairs applied

\- recommendation



\---



\## Phase 0 — Discovery Only



\### Objective

Map the current system without mutation.



\### Execute

\- architecture discovery

\- workflow discovery

\- gateway discovery

\- provider adapter discovery

\- schema and migration discovery

\- prompt/control alignment check



\### Do Not

\- edit code

\- edit schema

\- introduce new abstractions

\- refactor



\### Required Output

\- architecture map

\- workflow map

\- dependency map

\- risk map

\- insertion point plan



\### Validation Gate

Proceed only if discovery is complete and coherent.



\### Operator Prompt

Run:

`Phase 0 — discovery only, no mutations.`



\---



\## Phase 1 — Architecture Lock



\### Objective

Confirm the non-rewrite baseline and safe insertion points.



\### Execute

\- confirm protected components

\- confirm gateway-first architecture

\- confirm audio pipeline preservation

\- confirm migration-vs-rewrite boundaries



\### Do Not

\- rewrite `audio-utils.ts`

\- redesign voice system

\- bypass gateway

\- move into broad implementation



\### Required Output

\- protected components list

\- safe extension points

\- anti-rewrite confirmation



\### Validation Gate

Proceed only if protected components are explicitly preserved.



\### Operator Prompt

Run:

`Phase 1 — confirm architecture baseline and safe extension points only.`



\---



\## Phase 2 — Controlled Mutation Test



\### Objective

Prove that Antigravity can make a small safe change.



\### Execute

\- add a low-risk tool definition

\- include backend validation

\- include logging

\- include idempotency where needed



\### Recommended Task

\- `send\_reminder\_sms`



\### Do Not

\- alter existing working flows

\- touch gateway migration yet

\- change multiple subsystems



\### Required Output

\- changed files

\- tool registration details

\- validation report



\### Validation Gate

Proceed only if no regression occurs.



\### Operator Prompt

Run:

`Phase 2 — add send\_reminder\_sms with backend validation only, no existing flow changes.`



\---



\## Phase 3 — Gateway Migration



\### Objective

Move Gemini Live from browser prototype into gateway.



\### Execute

\- extract `startTalking` logic conceptually

\- move live session ownership into `voice-gateway`

\- preserve frontend audio capture/playback

\- remove API key dependence from browser



\### Do Not

\- redesign audio encoding

\- replace `audio-utils.ts`

\- change UI unnecessarily

\- rebuild voice system from scratch



\### Required Output

\- migration patch summary

\- session ownership shift summary

\- parity validation results



\### Validation Gate

Proceed only if:

\- voice still works

\- latency remains acceptable

\- no frontend Gemini direct dependency remains



\### Operator Prompt

Run:

`Phase 3 — migrate Gemini Live from frontend to voice-gateway, preserve behavior exactly.`



\---



\## Phase 4 — Tool Interception Layer



\### Objective

Enable gateway-side tool interception and response injection.



\### Execute

\- intercept Gemini tool calls

\- map to canonical tool contract

\- route to backend services

\- return tool results to Gemini



\### Do Not

\- block audio stream

\- allow direct provider execution from model

\- skip idempotency and audit hooks



\### Required Output

\- interception flow summary

\- tool execution path summary

\- non-blocking execution evidence



\### Validation Gate

Proceed only if:

\- tools execute correctly

\- voice stream remains stable

\- no duplicate side effects occur



\### Operator Prompt

Run:

`Phase 4 — implement gateway tool interception with non-blocking execution and structured responses.`



\---



\## Phase 5 — Staging Validation Mode



\### Objective

Turn on staging-safe policy and validation behavior.



\### Execute

\- use `control.staging.md`

\- validate runtime policy in partial enforcement

\- validate compliance checks

\- validate feature gating

\- validate logs and audit flow



\### Do Not

\- enable unrestricted high-risk features

\- enable production billing

\- enable bulk actions



\### Required Output

\- staging runtime policy report

\- blocked/allowed action summary

\- known issues list



\### Validation Gate

Proceed only if staging behavior is predictable and safe.



\### Operator Prompt

Run:

`Read \_00 READ.md and control.staging.md, then validate runtime policy behavior with tool execution.`



\---



\## Phase 6 — Usage Tracking



\### Objective

Track usage and raw cost signals.



\### Execute

\- track tokens

\- track minutes

\- track SMS/email/tool usage

\- store per session and per tenant



\### Do Not

\- hardcode final pricing assumptions into usage logic

\- mix usage tracking with production billing decisions



\### Required Output

\- usage event model summary

\- aggregation summary

\- validation summary



\### Validation Gate

Proceed only if usage records reconcile with observed sessions.



\### Operator Prompt

Run:

`Phase 6 — implement usage tracking for tokens, minutes, tool usage, per session and per tenant.`



\---



\## Phase 7 — Pricing Registry



\### Objective

Centralize cost and price resolution.



\### Execute

\- implement versioned provider pricing

\- implement plan pricing

\- implement included usage and overage structure

\- replace scattered hardcoded costs



\### Do Not

\- overwrite historical pricing destructively

\- couple pricing directly to UI-only logic



\### Required Output

\- pricing model summary

\- resolver summary

\- migration notes



\### Validation Gate

Proceed only if pricing resolution is deterministic and auditable.



\### Operator Prompt

Run:

`Phase 7 — implement versioned pricing registry with provider costs and plan pricing, no scattered hardcoded costs.`



\---



\## Phase 8 — Revenue and Margin



\### Objective

Add finance intelligence on top of usage and pricing.



\### Execute

\- calculate session cost

\- calculate session revenue allocation

\- calculate margin

\- flag low margin

\- support overage analysis



\### Do Not

\- enable production overage billing unless explicitly approved

\- mix analytical allocation with invoice truth without labeling it



\### Required Output

\- finance model summary

\- reconciliation summary

\- alert summary



\### Validation Gate

Proceed only if finance outputs reconcile correctly.



\### Operator Prompt

Run:

`Phase 8 — implement revenue, cost, margin, and low-margin alerting per session and tenant.`



\---



\## Phase 9 — Runtime Policy Enforcement



\### Objective

Enforce rules during live sessions.



\### Execute

\- enforce plan limits

\- enforce admin overrides

\- enforce compliance

\- enforce cost thresholds

\- require confirmation/approval where appropriate



\### Do Not

\- silently block without fallback

\- allow sensitive action bypass

\- destabilize live sessions



\### Required Output

\- runtime enforcement summary

\- denied action summary

\- fallback behavior summary



\### Validation Gate

Proceed only if live sessions remain stable and rules are enforced correctly.



\### Operator Prompt

Run:

`Phase 9 — enable runtime policy enforcement for plan limits, compliance, and cost thresholds.`



\---



\## Phase 10 — Regression Harness



\### Objective

Protect the system from future breakage.



\### Execute

\- create runtime scenario tests

\- create finance reconciliation tests

\- create duplicate suppression tests

\- create migration compatibility tests



\### Do Not

\- create shallow tests only

\- ignore end-to-end flow coverage



\### Required Output

\- regression suite summary

\- scenario coverage summary

\- unresolved gaps list



\### Validation Gate

Proceed only if critical flows are covered.



\### Operator Prompt

Run:

`Phase 10 — build regression harness for voice flow, tool execution, duplicate prevention, and finance reconciliation.`



\---



\## Phase 11 — Load and Staging Stress Validation



\### Objective

Test the system under realistic load.



\### Execute

\- concurrent session tests

\- tool-heavy session tests

\- long-session tests

\- latency measurements

\- failure injection where feasible



\### Do Not

\- move to production with unmeasured latency

\- ignore memory/queue growth



\### Required Output

\- load test summary

\- latency summary

\- failure summary

\- scaling recommendation



\### Validation Gate

Proceed only if latency and stability remain within target bounds.



\### Operator Prompt

Run:

`Phase 11 — run staging load scenarios for concurrent calls, tool-heavy sessions, and latency measurement.`



\---



\## Phase 12 — Production Readiness Review



\### Objective

Confirm go-live readiness before production mode.



\### Execute

\- full checklist review

\- rollback readiness review

\- health endpoint review

\- monitoring and alert confirmation

\- production control review



\### Do Not

\- deploy yet

\- apply live production mutations without approval



\### Required Output

\- go/no-go summary

\- open risk list

\- rollback readiness confirmation



\### Validation Gate

Proceed only if no critical blockers remain.



\### Operator Prompt

Run:

`Phase 12 — perform production readiness review, no deployment yet.`



\---



\## Phase 13 — Production Execution



\### Objective

Run under production control and deploy through governed path.



\### Execute

\- use `control.production.md`

\- deploy through CI/CD only

\- monitor post-deploy health

\- monitor latency, errors, and cost anomalies



\### Do Not

\- deploy manually outside governed workflow

\- ignore first-hour telemetry



\### Required Output

\- deployment summary

\- post-deploy health summary

\- first-hour monitoring summary



\### Validation Gate

Stay in production only if health remains stable.



\### Operator Prompt

Run:

`Read \_00 READ.md and control.production.md, then perform governed production execution only.`



\---



\## Quick Operator Commands



\### Discovery

`Read \_00 READ.md and control.md, run discovery only, no mutations.`



\### Small safe mutation

`Run Phase 2 only.`



\### Gateway migration

`Run Phase 3 only.`



\### Staging validation

`Read \_00 READ.md and control.staging.md, run Phase 5 only.`



\### Production readiness

`Run Phase 12 only.`



\### Production deploy

`Read \_00 READ.md and control.production.md, run Phase 13 only.`



\---



\## Stop Rule



If any phase produces:

\- architecture ambiguity

\- voice instability

\- tool duplication

\- finance inconsistency

\- failed regression gate

\- repeated self-healing loops



Stop and report:

\- failing phase

\- failing subsystem

\- last stable checkpoint

\- narrowest safe next step



Do not continue to the next phase.



\---



\## Final Directive



Run one phase at a time.



Protect the existing working voice prototype.

Protect the gateway migration.

Protect finance integrity.

Protect runtime stability.



Progression order is mandatory:

Discovery → Controlled Change → Gateway → Tools → Staging → Usage → Pricing → Finance → Runtime Policy → Regression → Load → Readiness → Production

