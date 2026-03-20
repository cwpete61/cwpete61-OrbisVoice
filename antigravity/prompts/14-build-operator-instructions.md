\# Build Operator Instructions

\## Antigravity Execution Entry File for OrbisVoice Tiered VoiceAgent Infrastructure



This file is the operator-facing execution control file for Antigravity.



Its purpose is to instruct Antigravity to:

\- load the correct prompt package in the correct order

\- inspect the current codebase before making changes

\- follow phased execution

\- avoid destructive rewrites

\- validate after each bounded phase

\- stop when instability or ambiguity exceeds safe thresholds



This file is not the deep architectural specification.

It is the runtime operating instruction for the build process.



\---



\## Primary Directive



Read and obey the referenced prompt files in the exact order listed below.



Do not skip discovery.

Do not start with a full rewrite.

Do not make broad speculative changes before architecture and workflow inspection are complete.



Build in phases.

Validate after each phase.

Use bounded self-healing only after a concrete failure is observed.



\---



\## Required Prompt Load Order



Load these files in this exact order:



1\. `00-global-orchestrator.md`

2\. `01-tier-entitlements-spec.md`

3\. `06-plan-matrix-values.md`

4\. `04-specialist-agent-roles.md`

5\. `02-workflow-mutation-agent.md`

6\. `03-self-healing-validation-agent.md`

7\. `05-deliverables-and-stop-conditions.md`

8\. `07-usage-calculation-agent.md`

9\. `08-revenue-and-margin-agent.md`

10\. `09-provider-pricing-registry.md`

11\. `10-admin-finance-controls.md`

12\. `11-agent-runtime-policy-enforcement.md`

13\. `12-runtime-test-scenarios-and-regression-harness.md`

14\. `13-implementation-roadmap-and-phase-execution.md`



All execution must conform to these documents.



If contradictions are found:

\- prefer platform safety

\- prefer non-breaking behavior

\- prefer explicit plan matrix values

\- prefer phased execution over speed

\- report contradictions explicitly before continuing



\---



\## First Execution Rule



On first run, do not begin major implementation immediately.



First perform:

1\. discovery

2\. architecture mapping

3\. workflow mapping

4\. dependency and risk identification

5\. insertion-point planning

6\. migration risk identification

7\. phased implementation recommendation



Produce a discovery report before major code changes.



Do not proceed into broad implementation until discovery is complete.



\---



\## First Task to Execute



Your first task is:



Inspect the full current codebase and produce:

\- architecture map

\- current VoiceAgent runtime map

\- workflow map

\- current plan/feature control map

\- current admin/role/control map

\- provider adapter map

\- schema and migration risk map

\- likely insertion points for:

&#x20; - entitlement system

&#x20; - voice config system

&#x20; - admin overrides

&#x20; - workflow gating

&#x20; - provider execution wrappers

&#x20; - usage tracking

&#x20; - pricing registry

&#x20; - revenue/margin services

&#x20; - runtime policy enforcement

&#x20; - regression harness



Do not perform broad implementation until this output exists.



\---



\## Phase Execution Rule



After discovery, execute using the phase order defined in:



\- `13-implementation-roadmap-and-phase-execution.md`



Do not merge unrelated phases.

Do not skip validation gates.

Do not begin runtime policy enforcement before entitlement foundations exist.

Do not begin finance overage logic before usage and pricing foundations exist.



\---



\## Safe Change Rule



For all changes:

\- inspect before editing

\- prefer additive changes

\- preserve public contracts where possible

\- use adapters when replacing old assumptions

\- create migrations for schema changes

\- preserve historical reporting integrity

\- preserve existing valid behavior for existing tenants where intended



Avoid:

\- destructive rewrites

\- scattered hardcoded pricing

\- scattered ad hoc permission checks

\- direct model execution of sensitive actions

\- silently changing legacy behavior without compatibility handling



\---



\## Self-Healing Rule



Self-healing is allowed only after:

\- a concrete failure is observed

\- the failing surface is identified

\- the patch scope is bounded



Do not use self-healing as an excuse for uncontrolled rewriting.



Repair cycle:

1\. identify failure

2\. isolate smallest failing surface

3\. patch narrowly

4\. rerun relevant tests

5\. rerun broader regression set if needed

6\. stop and report if instability spreads



\---



\## Reporting Requirements



At the end of discovery and each phase, report:



\- objective

\- files inspected

\- files changed

\- risks identified

\- migrations added

\- tests run

\- tests passed

\- tests failed

\- repairs applied

\- known unresolved issues

\- recommendation:

&#x20; - proceed

&#x20; - proceed with caution

&#x20; - pause for review

&#x20; - rollback and narrow scope



Do not claim completion without validation evidence.



\---



\## Stop Conditions



Stop and report instead of continuing when:



\- discovery is incomplete

\- current architecture is too ambiguous for safe mutation

\- critical provider behavior is uncertain

\- schema changes lack safe migration strategy

\- repeated failures indicate broad architectural contradiction

\- historical pricing or finance integrity cannot be preserved

\- runtime enforcement insertion would destabilize live flows

\- regression failures remain unresolved at phase gate



When stopped:

\- summarize the blocker

\- identify affected subsystem

\- identify last stable checkpoint

\- propose the narrowest next safe step



\---



\## Rollback Rule



If a phase becomes unstable:

\- revert to last stable checkpoint

\- preserve diagnostics

\- do not continue compounding changes

\- narrow scope before retrying



Do not carry instability forward into the next phase.



\---



\## Required Build Behavior



You must:

\- use specialist-agent role separation where appropriate

\- keep sensitive actions backend-controlled

\- enforce plan and admin rules centrally

\- preserve auditability for pricing and finance changes

\- preserve compatibility for existing tenants and workflows where intended

\- integrate testing and reconciliation into the build, not as an afterthought



\---



\## Initial Operator Prompt



When execution begins, treat this as the operator instruction:



Read all prompt files listed in this document in order.

Inspect the existing codebase before making major changes.

Complete Phase 0 discovery and produce a discovery report with:

\- architecture map

\- workflow map

\- dependency map

\- risk map

\- insertion-point plan

\- migration risk summary

\- phased implementation recommendation



Do not begin broad implementation until discovery is complete and validated.



\---



\## After Discovery Operator Prompt



After discovery is complete, proceed only with the next approved bounded phase.

At each phase:

\- follow the roadmap

\- validate before proceeding

\- commit stable checkpoints

\- stop on unresolved instability



\---



\## Success Standard



This build is successful only when:

\- the prompt package has been followed in order

\- discovery was completed first

\- phased execution was respected

\- validations were run after each bounded phase

\- no critical instability was carried forward

\- final outputs match the architectural, financial, policy, and runtime goals of the package

