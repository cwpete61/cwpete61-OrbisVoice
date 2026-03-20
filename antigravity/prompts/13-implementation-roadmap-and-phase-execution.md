\# Implementation Roadmap and Phase Execution

\## Controlled Delivery Plan for Tiered VoiceAgent Infrastructure, Runtime Governance, Usage, Finance, and Regression Safety



You are responsible for executing the VoiceAgent platform enhancement program in a phased, dependency-aware, non-breaking manner.



You must not attempt to build all systems at once.

You must sequence the work so that:

\- lower-level foundations exist before dependent layers

\- runtime enforcement does not precede entitlement resolution

\- finance logic does not precede usage and pricing foundations

\- workflow mutation does not proceed without discovery

\- migration and regression safety are evaluated after each bounded phase

\- unstable areas do not expand into broad rewrites



This roadmap is the execution contract.



\---



\## Primary Objective



Build or improve the system in controlled phases so that the application gains:



\- plan and entitlement enforcement

\- admin controls and overrides

\- voice configuration and selection

\- safe workflow mutation

\- runtime policy enforcement

\- usage and cost tracking

\- revenue, margin, and overage intelligence

\- pricing registry

\- finance governance

\- regression harness



without breaking the existing application.



\---



\## Global Execution Rules



1\. Inspect before editing.

2\. Build foundations before execution-layer dependencies.

3\. Keep phases bounded.

4\. Validate after every phase.

5\. Commit stable checkpoints after every phase.

6\. Use adapters before destructive replacement.

7\. Stop on repeated instability.

8\. Never combine unrelated schema, workflow, and finance rewrites in one phase.

9\. Prefer backwards-compatible expansion.

10\. Produce evidence of stability before moving forward.



\---



\## Phase Structure



Each phase must include:



\- objective

\- dependencies

\- target subsystems

\- files likely to change

\- implementation tasks

\- tests required

\- stop conditions

\- rollback condition

\- completion criteria



Do not move to the next phase until the current phase is validated.



\---



\## Phase 0 — Discovery, Audit, and Current-State Mapping



\### Objective

Understand the current system completely before editing.



\### Dependencies

None.



\### Target Subsystems

\- project structure

\- VoiceAgent runtime

\- current workflow engine or routing logic

\- current config models

\- current plan/billing structures

\- current admin roles

\- current provider adapters

\- current tests and CI

\- current schema and migrations

\- existing logging and observability



\### Tasks

\- map architecture

\- map workflow entry points and tool execution boundaries

\- map existing plan or feature gating logic

\- map existing voice selection logic

\- map existing telephony, messaging, email, and calendar integrations

\- map data models for tenants, agents, sessions, plans, permissions, usage

\- identify insertion points for entitlement and runtime policy layers

\- identify technical debt and coupling risks

\- identify likely migration requirements

\- identify legacy compatibility concerns



\### Required Outputs

\- architecture map

\- dependency map

\- workflow map

\- risk map

\- compatibility constraints

\- proposed phase-risk summary



\### Tests Required

\- baseline app startup or build validation

\- baseline current test suite run

\- smoke checks for critical existing flows



\### Stop Conditions

\- architecture is still unclear

\- workflow boundaries are not identified

\- critical provider integration paths remain ambiguous



\### Rollback Condition

Not applicable unless discovery itself mutates files.



\### Completion Criteria

Discovery outputs are complete and stable enough to guide bounded implementation.



\---



\## Phase 1 — Feature Registry, Tier Registry, and Entitlement Foundations



\### Objective

Create the machine-readable product and entitlement foundation.



\### Dependencies

Phase 0 complete.



\### Target Subsystems

\- plan registry

\- feature/capability registry

\- entitlement schema

\- entitlement resolution service

\- plan/feature enums

\- basic admin override models if needed for resolution



\### Tasks

\- implement central tier registry

\- implement feature registry

\- define typed entitlement objects

\- implement effective entitlement resolution precedence

\- support plan defaults, admin overrides, tenant overrides, permitted agent overrides

\- define human-readable denial reasons

\- implement registry-backed lookup services

\- add tests for plan defaults and precedence

\- avoid coupling to live provider execution at this phase



\### Files Likely to Change

\- config/domain models

\- entitlement services

\- shared type definitions

\- initial migrations if needed

\- tests



\### Tests Required

\- plan default resolution

\- override precedence resolution

\- blocked feature resolution

\- limit value resolution

\- backward compatibility for missing plan assignments



\### Stop Conditions

\- registry logic is incomplete

\- override precedence is ambiguous

\- plan definitions are still unconfirmed



\### Rollback Condition

\- entitlement changes break existing config loading or core app boot



\### Completion Criteria

A stable central entitlement layer exists and passes direct resolution tests.



\---



\## Phase 2 — Voice Configuration Layer and Agent Configuration Resolution



\### Objective

Implement or improve the VoiceAgent configuration layer, including Google voice selection and fallback behavior.



\### Dependencies

Phase 1 complete.



\### Target Subsystems

\- agent config models

\- voice catalog

\- voice selection service

\- tenant/agent config resolution

\- fallback voice resolution

\- selected voice validation



\### Tasks

\- create or improve VoiceAgent config schema

\- add plan-aware voice configuration fields

\- add voice provider catalog model

\- normalize Google voice metadata

\- implement voice resolution by tenant and agent

\- implement fallback behavior for invalid or deprecated voices

\- add tests for voice selection, invalid voice fallback, locale restrictions

\- preserve compatibility with existing agents missing voice configuration



\### Files Likely to Change

\- agent config models

\- voice provider adapters

\- config services

\- migrations/backfills

\- tests



\### Tests Required

\- valid selected voice resolution

\- invalid voice fallback

\- locale restriction behavior

\- plan-aware voice selection behavior

\- legacy agent defaulting behavior



\### Stop Conditions

\- voice selection depends on unknown provider catalog behavior

\- legacy agent configs cannot be safely defaulted



\### Rollback Condition

\- session startup breaks for existing agents after config changes



\### Completion Criteria

Agents resolve voice settings safely, including fallback behavior, without breaking existing sessions.



\---



\## Phase 3 — Admin Overrides, Governance Foundations, and Safe Control Surfaces



\### Objective

Create the initial admin-controlled override and governance foundation.



\### Dependencies

Phases 1–2 complete.



\### Target Subsystems

\- admin override models

\- RBAC baseline

\- approval placeholders or full approval base models

\- audit logging foundations

\- admin-facing config surfaces or service layer



\### Tasks

\- define admin roles and permission categories

\- implement initial override models

\- implement audit event structure for entitlement-sensitive changes

\- add guardrails for high-risk features

\- ensure admin overrides can resolve through entitlement service

\- avoid deep finance approvals at this phase unless minimal scaffolding is needed



\### Files Likely to Change

\- admin auth/permission services

\- override models

\- audit models/services

\- admin APIs or service contracts

\- tests



\### Tests Required

\- authorized override succeeds

\- unauthorized override blocked

\- audit event created

\- override precedence reflected in entitlement resolution



\### Stop Conditions

\- existing admin model is too unclear to extend safely

\- role boundaries are not mappable without deeper auth rewrite



\### Rollback Condition

\- admin flows or auth regress unexpectedly



\### Completion Criteria

Admin controls exist for entitlement-relevant overrides and are auditable.



\---



\## Phase 4 — Workflow Inspection and Safe Workflow Mutation Infrastructure



\### Objective

Add safe workflow mutation capability and insert entitlement-aware boundaries without yet turning on full runtime cost enforcement.



\### Dependencies

Phases 0–3 complete.



\### Target Subsystems

\- workflow engine or routing logic

\- step execution boundaries

\- workflow config schema

\- blocked-step response handling

\- compatibility adapters for old workflows



\### Tasks

\- inspect and document current workflows in code

\- insert feature gating at workflow execution boundaries

\- preserve currently valid behavior where plan allows it

\- add structured blocked-action outcomes

\- add compatibility adapters where old workflows assumed unrestricted features

\- avoid direct provider-layer enforcement duplication; keep mutation layer distinct from runtime policy layer



\### Files Likely to Change

\- workflow engine or step handlers

\- route logic

\- adapter layers

\- tests



\### Tests Required

\- existing booking flow still works where allowed

\- restricted flow now denies safely

\- fallback path works

\- legacy workflow config remains executable where intended



\### Stop Conditions

\- workflow engine is too opaque for bounded mutation

\- required compatibility strategy remains undefined



\### Rollback Condition

\- existing core user flows regress after gating insertion



\### Completion Criteria

Workflow boundaries support entitlement-aware behavior safely and compatibly.



\---



\## Phase 5 — Sensitive Tool Execution Boundaries and Provider Safety Wrappers



\### Objective

Wrap provider execution paths so all sensitive actions pass through controlled execution boundaries.



\### Dependencies

Phases 1–4 complete.



\### Target Subsystems

\- calendar execution

\- email sending execution

\- SMS sending execution

\- telephony execution

\- recording control

\- duplicate suppression/idempotency layer



\### Tasks

\- ensure tool execution passes through backend-owned wrappers

\- add idempotency keys and duplicate suppression

\- normalize execution result payloads

\- enforce that the model cannot directly trigger providers

\- add baseline safety checks before provider call

\- keep this layer execution-focused, not full runtime policy intelligence yet



\### Files Likely to Change

\- provider adapters

\- execution services

\- action routers

\- audit logging integration

\- tests



\### Tests Required

\- provider call only executes through wrapper

\- duplicate booking suppressed

\- duplicate SMS suppressed

\- duplicate email suppressed

\- safe execution result returned



\### Stop Conditions

\- provider adapters are too tightly coupled to existing live flows without clear insertion points



\### Rollback Condition

\- real execution paths become unstable or duplicate provider actions



\### Completion Criteria

Sensitive actions are centrally wrapped and safe to govern.



\---



\## Phase 6 — Usage and Cost Tracking Layer



\### Objective

Track usage and raw operational cost across sessions, tools, telephony, and messaging.



\### Dependencies

Phases 1–5 complete.



\### Target Subsystems

\- usage events

\- session cost state

\- daily/monthly aggregations

\- usage APIs

\- limit tracking inputs



\### Tasks

\- implement usage event model

\- track AI tokens, minutes, SMS, emails, tool events

\- implement per-session running usage state

\- implement daily/monthly aggregations

\- add usage query services and reporting endpoints

\- keep pricing lookups simple or provisional until pricing registry phase completes, if necessary using adapter design for later cutover



\### Files Likely to Change

\- usage services

\- session services

\- aggregation jobs

\- data models/migrations

\- tests



\### Tests Required

\- token tracking accuracy

\- minute tracking accuracy

\- session cost computation structure

\- daily and monthly aggregation correctness

\- no regression in session handling



\### Stop Conditions

\- current runtime lacks reliable event points for usage capture

\- provider usage telemetry assumptions are unresolved



\### Rollback Condition

\- usage tracking disrupts session performance or event flow



\### Completion Criteria

A stable usage and raw cost layer exists for all major interaction types.



\---



\## Phase 7 — Pricing Registry and Effective Price Resolution



\### Objective

Centralize provider costs, plan prices, included usage, and overage pricing into a versioned registry.



\### Dependencies

Phase 6 complete; earlier phases complete.



\### Target Subsystems

\- pricing registry models

\- provider cost versions

\- plan price versions

\- included usage rules

\- overage rate rules

\- pricing resolution services

\- pricing seed data



\### Tasks

\- implement central pricing registry entities

\- implement cost and price resolvers by effective date

\- add tenant-specific override support

\- add promotion/grandfathering support scaffolds if not full implementation

\- replace scattered hardcoded cost logic with registry-backed resolution

\- maintain historical pricing integrity



\### Files Likely to Change

\- pricing models

\- finance services

\- usage-cost resolution services

\- seed data

\- migrations

\- tests



\### Tests Required

\- provider cost resolution by date

\- plan price resolution by date

\- tenant override precedence

\- historical pricing stability

\- usage service reconciliation to registry values



\### Stop Conditions

\- current pricing/billing logic is too fragmented to migrate safely in one pass



\### Rollback Condition

\- historical reporting changes unexpectedly after registry insertion



\### Completion Criteria

Pricing-sensitive calculations resolve through a central, versioned registry.



\---



\## Phase 8 — Revenue, Margin, Overage, and Finance Intelligence



\### Objective

Build financial visibility and overage logic on top of usage and pricing foundations.



\### Dependencies

Phases 6–7 complete.



\### Target Subsystems

\- finance events

\- monthly financial summaries

\- overage engine

\- revenue allocation logic

\- gross margin calculations

\- finance APIs and dashboards contracts



\### Tasks

\- calculate session, daily, monthly cost and margin

\- implement overage behavior modes

\- generate finance events

\- implement tenant profitability and plan profitability views

\- implement alert triggers for low/negative margin

\- preserve clear distinction between analytical revenue allocation and billing source-of-truth



\### Files Likely to Change

\- finance services

\- data models/migrations

\- dashboards/service contracts

\- alerts integration

\- tests



\### Tests Required

\- overage calculation correctness

\- revenue and cost reconciliation

\- gross margin math

\- tenant override pricing applied correctly

\- alert trigger correctness



\### Stop Conditions

\- unresolved billing-source ambiguities would corrupt finance logic

\- revenue allocation strategy remains undefined



\### Rollback Condition

\- monthly summaries become inconsistent or non-reconcilable



\### Completion Criteria

Revenue, cost, margin, and overage logic are stable and reconcilable.



\---



\## Phase 9 — Admin Finance Controls, Approvals, and Guardrails



\### Objective

Add governance around pricing, overages, credits, risk features, and financial actions.



\### Dependencies

Phases 3, 7, and 8 complete.



\### Target Subsystems

\- admin finance permissions

\- approval workflows

\- financial audit logs

\- refund/credit controls

\- financial guardrails

\- admin finance APIs



\### Tasks

\- implement finance-specific RBAC

\- add approval workflows for sensitive finance/risk actions

\- add guardrail thresholds

\- connect risk events and alerts to admin action surfaces

\- ensure high-risk plan/feature changes are approval-aware



\### Files Likely to Change

\- admin services

\- finance admin APIs

\- approval models

\- audit services

\- tests



\### Tests Required

\- unauthorized finance action denied

\- approval-required actions pause correctly

\- approved actions execute correctly

\- audit logs capture before/after state



\### Stop Conditions

\- admin identity or approval model is still too immature for safe extension



\### Rollback Condition

\- finance admin controls block existing legitimate operations unexpectedly



\### Completion Criteria

Financially sensitive actions are governed, permissioned, and auditable.



\---



\## Phase 10 — Runtime Policy Enforcement in Live Sessions



\### Objective

Enforce entitlements, overrides, compliance, cost risk, and approvals in real time during live sessions.



\### Dependencies

Phases 1–9 complete.



\### Target Subsystems

\- live session start path

\- session continuation path

\- sensitive action evaluation

\- runtime fallback service

\- policy event logging

\- cost-constrained modes

\- duplicate and loop prevention integration



\### Tasks

\- implement central runtime policy decision service

\- gate all sensitive runtime actions through it

\- enforce confirmation and approval requirements

\- enforce cost thresholds and constrained modes

\- enforce compliance checks

\- integrate with usage, pricing, finance, and admin services

\- ensure fallback behavior exists for denied actions



\### Files Likely to Change

\- runtime/session services

\- provider execution boundary hooks

\- policy services

\- event logging

\- tests



\### Tests Required

\- allowed runtime action executes

\- denied runtime action blocks correctly

\- approval-gated action pauses correctly

\- duplicate suppression works

\- cost-constrained mode activates correctly

\- compliance block works



\### Stop Conditions

\- live runtime boundaries are still unclear

\- policy insertion would require unsafe full rewrite of live session engine



\### Rollback Condition

\- live sessions destabilize, degrade excessively, or mis-handle allowed actions



\### Completion Criteria

Live runtime enforcement works safely and predictably.



\---



\## Phase 11 — Regression Harness, Failure Injection, and Reconciliation Coverage



\### Objective

Build the full regression harness to protect the system from drift and unsafe refactors.



\### Dependencies

Phases 1–10 complete.



\### Target Subsystems

\- unit and integration test harnesses

\- runtime scenario simulations

\- failure injection tools

\- financial reconciliation tests

\- migration compatibility tests



\### Tasks

\- implement scenario builders and factories

\- implement runtime flow tests

\- implement failure injection tests

\- implement reconciliation tests

\- implement migration safety tests

\- establish stable regression baselines

\- connect failure output to bounded self-healing loop



\### Files Likely to Change

\- test harnesses

\- scenario builders

\- CI configs if applicable

\- validation docs/reports



\### Tests Required

This phase itself is the test buildout; validate harness completeness and representative coverage.



\### Stop Conditions

\- scenario infrastructure cannot simulate enough of the live environment to be meaningful



\### Rollback Condition

\- test scaffolding interferes with runtime code or introduces unwanted dependencies



\### Completion Criteria

The system has a robust regression and reconciliation harness.



\---



\## Phase 12 — Migration, Hardening, Cleanup, and Documentation



\### Objective

Finalize compatibility, remove temporary adapters where safe, harden operations, and document the system.



\### Dependencies

Phases 1–11 complete.



\### Target Subsystems

\- migrations and backfills

\- documentation

\- cleanup of deprecated paths

\- operational notes

\- rollout notes

\- rollback notes



\### Tasks

\- run or prepare safe migrations

\- backfill missing plan/voice/config data

\- remove only those legacy branches proven obsolete

\- finalize docs for entitlements, pricing, runtime policy, approvals, and testing

\- create rollout checklist

\- create rollback checklist

\- create admin operating notes

\- create finance operating notes



\### Files Likely to Change

\- docs

\- migration scripts

\- cleanup commits

\- admin/help docs



\### Tests Required

\- full regression suite

\- migration validation suite

\- reconciliation suite

\- smoke tests on critical runtime flows



\### Stop Conditions

\- full-suite failures remain unresolved

\- rollback path is not credible

\- legacy cleanup would break historical compatibility



\### Rollback Condition

\- post-cleanup tests expose dependency on removed adapter/path



\### Completion Criteria

System is documented, hardened, migration-safe, and ready for controlled rollout.



\---



\## Phase Checkpoint Rules



At the end of every phase:



1\. summarize what changed

2\. list files changed

3\. list migrations added

4\. list risks introduced

5\. list tests run

6\. list failures found

7\. list repairs applied

8\. declare phase status:

&#x20;  - complete

&#x20;  - complete\_with\_known\_risks

&#x20;  - blocked

&#x20;  - rolled\_back



Do not proceed on a blocked or unstable phase.



\---



\## Commit and Checkpoint Rules



Before a phase begins:

\- create a checkpoint commit



After a phase passes:

\- create a stable completion commit



If a phase destabilizes:

\- create a diagnostic branch or equivalent checkpoint

\- revert or restore to last stable state if needed



Suggested commit style:

\- pre-phase-01-entitlements-checkpoint

\- phase-01-entitlements-complete

\- phase-04-workflow-gating-complete

\- phase-10-runtime-policy-complete



\---



\## Validation Gates Between Phases



\### Minimum Gate

Before moving forward:

\- app builds or starts

\- phase-specific tests pass

\- critical smoke flows pass



\### Strong Gate

When phase touches runtime, finance, pricing, or migrations:

\- targeted integration tests pass

\- regression subset passes

\- no unresolved critical severity issues remain



\### Full Gate

Before final hardening:

\- end-to-end flows pass

\- finance reconciliation passes

\- migration suite passes

\- runtime policy scenarios pass

\- no critical or high severity regressions remain



\---



\## Change Isolation Rules



Do not combine these in the same phase unless strictly necessary:



\- large schema redesign + runtime enforcement

\- provider adapter rewrite + finance engine rollout

\- pricing registry migration + admin RBAC rewrite

\- workflow engine mutation + full live session redesign

\- regression harness creation + broad legacy cleanup



If a dependency forces overlap, keep the overlap minimal and explicit.



\---



\## Rollout Strategy Preference



Prefer this rollout path:



1\. shadow or log-only mode where applicable

2\. limited enforcement on low-risk paths

3\. staged enablement by feature or tenant group

4\. wider enablement after validation

5\. full enforcement after regression evidence



Examples:

\- pricing registry can first resolve in parallel with old logic for comparison

\- runtime policy can log decisions before hard blocking certain actions

\- finance alerts can run before automatic billing or hard-cap enforcement



\---



\## Known High-Risk Areas



Treat these as high-risk and phase carefully:



\- live session execution path

\- outbound calling and transfer logic

\- duplicate suppression for provider actions

\- pricing migration from hardcoded constants

\- revenue allocation and margin reporting

\- LTD and Free special-case handling

\- legacy workflow assumptions

\- voice fallback on deprecated provider voices

\- migration of tenants lacking explicit plan assignment



These areas require stronger validation and narrower changes.



\---



\## Required Parallel Work Guidance



Use specialist agents or sub-workstreams where appropriate, but coordinate them through phase boundaries.



Safe parallelization examples:

\- while Phase 1 registry work is underway, discovery deepening on workflow paths may continue

\- while Phase 2 voice config is underway, test fixture design can begin

\- while Phase 7 pricing registry is underway, finance report skeletons can be prepared without locking final formulas



Unsafe parallelization examples:

\- runtime policy enforcement before entitlement registry is stable

\- finance overage billing before pricing registry exists

\- aggressive workflow mutation before compatibility map is produced



\---



\## Phase Exit Report Template



At the end of each phase, produce:



\### Phase Name

\### Objective

\### Dependencies satisfied

\### Files changed

\### Migrations added

\### Tests run

\### Tests passed

\### Tests failed

\### Repairs applied

\### Known risks

\### Rollback readiness

\### Recommendation:

\- proceed

\- proceed with caution

\- pause for review

\- rollback and narrow scope



\---



\## Final Acceptance Criteria



The full program is complete only when:



\- discovery has been documented

\- entitlement resolution is central and reliable

\- voice configuration is safe and backward compatible

\- workflows have been mutated safely

\- provider execution is wrapped and protected

\- usage and cost tracking are accurate

\- pricing resolves from a central registry

\- revenue, margin, and overage logic reconcile

\- finance controls and approvals are enforced

\- runtime policy gates sensitive live actions

\- regression harness proves stability

\- migrations are safe

\- documentation is complete

\- rollback and rollout guidance exist

