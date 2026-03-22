\# Antigravity Global Workflow Prompt — Production-Safe Clean Code Refactor



\## Mission



Refactor the existing codebase for clean code, maintainability, clarity, and consistency without changing intended business behavior.



This workflow is for a \*\*controlled, production-safe refactor\*\*.



This is \*\*not\*\* a rewrite.

This is \*\*not\*\* a redesign.

This is \*\*not\*\* an excuse to rebuild architecture from scratch.



The goal is to leave the codebase measurably cleaner after each pass while preserving behavior and keeping a reliable rollback path.



\---



\# Global Operating Rules



\## Core Rules



1\. Preserve behavior unless fixing a confirmed defect.

2\. Refactor incrementally, never all at once.

3\. Validate after every meaningful change.

4\. Stop on failure. Diagnose. Repair. Re-validate.

5\. Do not continue past a failed gate.

6\. Prefer simple concrete changes over abstract architecture theory.

7\. Do not update major dependencies unless isolated and required.

8\. Keep every change scoped, explainable, and reversible.

9\. Improve readability before abstraction.

10\. Remove complexity, do not relocate it.



\---



\# Refactor Priorities



Apply improvements in this order unless the codebase clearly demands a different sequence:



1\. dead code

2\. unused imports

3\. naming clarity

4\. long functions

5\. nested control flow

6\. duplicate logic

7\. mixed responsibilities

8\. weak typing/contracts

9\. inconsistent error handling

10\. module and folder structure

11\. dependency cleanup

12\. stylistic normalization



\---



\# Hard Constraints



Do \*\*not\*\*:



\- rewrite major subsystems in one pass

\- rename everything blindly

\- change route contracts without documentation

\- change API payload shape unless required and validated

\- move files at large scale before local cleanup

\- introduce a new architectural pattern unless there is a concrete measurable reason

\- replace existing working code with more abstract code that is harder to read

\- remove logic because it looks redundant without proving it is unused

\- mix dependency upgrades with unrelated code refactors

\- proceed past a failed test, build, lint, or type gate



Do \*\*not\*\* assume.



Verify.



\---



\# Required Phase Workflow



\---



\## Phase 0 — Environment Baseline



\### Goal

Establish current reality before touching code.



\### Required Actions

\- inspect project structure

\- identify language, framework, package manager, runtime, test runner, linter, formatter, build system

\- identify application entry points

\- identify critical runtime flows

\- record current:

&#x20; - install status

&#x20; - build status

&#x20; - lint status

&#x20; - type-check status

&#x20; - test status

&#x20; - known warnings/errors



\### Required Output

\- stack summary

\- project structure summary

\- validation command inventory

\- baseline health report

\- known blockers list



\### Gate 0

Do not refactor until baseline is documented.



If the project does not build, lint, or run, identify whether:

\- the failure is pre-existing

\- the failure blocks refactoring

\- the failure must be stabilized first



If stabilization is required, fix only the minimum needed to create a safe baseline.



\---



\## Phase 1 — Discovery and Refactor Inventory



\### Goal

Map the codebase before changing it.



\### Required Actions

Create a ranked inventory of:



\- oversized files

\- oversized functions

\- weak names

\- dead code candidates

\- repeated logic

\- mixed UI/business/data concerns

\- inconsistent async/error patterns

\- weak typing or unsafe contracts

\- overly coupled modules

\- fragile integration points

\- temporary hacks and stale comments

\- modules with too many responsibilities



\### Also Produce

\#### Risk Map

Classify files/modules as:

\- Low Risk

\- Medium Risk

\- High Risk



High-risk examples:

\- authentication

\- billing

\- DB writes

\- external integrations

\- scheduling

\- background jobs

\- routing middleware

\- schema validation

\- shared utilities with many dependents



\#### Refactor Order

Rank opportunities by:

\- clarity gain

\- regression risk

\- dependency spread

\- validation ease



\### Gate 1

Do not start code modifications until the inventory, risk map, and refactor order are complete.



\---



\## Phase 2 — Validation Coverage Setup



\### Goal

Ensure refactor work has a safety net.



\### Required Actions

Identify existing:

\- unit tests

\- integration tests

\- end-to-end tests

\- contract tests

\- manual smoke flows



For critical areas with no test protection, add minimal safety coverage where practical.



If full tests are not feasible, define manual verification procedures for:

\- app startup

\- key route responses

\- key user journeys

\- data fetch/save flows

\- auth/session flows

\- external service boundaries



\### Required Output

\- coverage summary

\- test gaps

\- added minimal safeguards

\- manual smoke checklist



\### Gate 2

Before any medium-risk or high-risk refactor:

\- at least one validation path must exist for the affected behavior



\---



\## Phase 3 — Low-Risk Cleanup Pass



\### Goal

Remove obvious clutter first.



\### Allowed Changes

\- unused imports

\- dead constants

\- unreachable branches

\- commented-out code

\- stale helper functions proven unused

\- misleading comments

\- obvious naming fixes with low blast radius

\- minor formatting inconsistencies if local to touched files



\### Required Per-Batch Procedure

For each batch:

1\. declare exact files

2\. declare exact cleanup scope

3\. make the changes

4\. run validation

5\. summarize result



\### Required Validation

Run whatever is available and relevant:

\- lint

\- type-check

\- tests

\- build

\- local smoke verification where needed



\### Gate 3

If any validation fails:

\- stop

\- isolate cause

\- repair

\- re-run validation

\- only continue when green or when a documented pre-existing failure is proven unrelated



\---



\## Phase 4 — Function-Level Refactor Pass



\### Goal

Improve readability and maintainability inside functions.



\### Focus Areas

\- split long functions

\- replace deep nesting with guard clauses

\- extract repeated local logic into well-named helpers

\- isolate pure logic from side effects

\- make function inputs/outputs clearer

\- reduce boolean confusion

\- simplify branching and conditions

\- reduce mutable state where it harms clarity



\### Rules

\- keep behavior identical

\- do not extract helpers prematurely

\- only extract when the new name improves understanding

\- prefer local clarity over DRY purity

\- do not create “utils” dumping grounds



\### Required Per-Batch Output

\- target functions

\- reason for refactor

\- before/after responsibility summary

\- validation result

\- residual risk



\### Gate 4

Each function-level refactor batch must pass validation before the next batch begins.



\---



\## Phase 5 — Module Responsibility Pass



\### Goal

Make files and modules own one clear responsibility.



\### Focus Areas

\- split mixed-responsibility files

\- separate UI from domain logic

\- separate transport/API code from transforms

\- separate DB access from presentation logic

\- separate validators/schemas from handlers

\- isolate external service clients

\- move shared logic only when reuse is real and proven



\### Rules

\- do not reorganize the entire tree in one move

\- preserve import stability where possible

\- move in small slices

\- validate import paths and exports immediately



\### Gate 5

Any file move or responsibility split must be followed by:

\- import resolution check

\- type-check

\- tests

\- build

\- runtime verification if applicable



\---



\## Phase 6 — Type and Contract Tightening



\### Goal

Make code safer and clearer at boundaries.



\### Focus Areas

\- remove unsafe broad types where practical

\- define explicit function return types where clarity improves

\- tighten null/undefined handling

\- improve schema or validation usage if the stack already supports it

\- align DTOs, interfaces, and domain objects

\- identify hidden contract mismatches



\### Rules

\- do not add type complexity that reduces readability

\- do not create giant generic systems for no reason

\- document contract changes if any are unavoidable



\### Gate 6

Type improvements must pass:

\- type-check

\- build

\- affected tests

\- boundary smoke tests



\---



\## Phase 7 — Error Handling and Async Consistency



\### Goal

Normalize failure behavior.



\### Focus Areas

\- replace silent catches

\- standardize error propagation

\- improve error messages

\- handle expected failure cases explicitly

\- normalize async/await usage

\- remove inconsistent promise chains where clarity suffers

\- centralize repeated error translation only if it simplifies understanding



\### Rules

\- do not expose sensitive internals in user-facing errors

\- do not swallow exceptions

\- do not add noisy logging without purpose



\### Gate 7

All changes in this phase must be verified against:

\- affected user flows

\- logs/runtime output

\- tests if present



\---



\## Phase 8 — Structural Reorganization Pass



\### Goal

Improve project layout after lower-risk cleanup is stable.



\### Focus Areas

\- align folders with actual responsibilities

\- group by feature or layer consistently

\- remove misleading folder names

\- reduce accidental cross-layer dependencies

\- standardize barrel/index usage only if it improves clarity



\### Rules

\- do this late

\- keep changes incremental

\- avoid cosmetic churn

\- document new structure clearly



\### Gate 8

Every structural batch must pass:

\- import path validation

\- lint

\- type-check

\- tests

\- build



\---



\## Phase 9 — Dependency Review and Controlled Updates



\### Goal

Handle dependency cleanup only when necessary.



\### Allowed Reasons

\- broken tooling

\- security need

\- blocked type/build/lint flow

\- known incompatible package issue

\- refactor requires a stable supported API



\### Rules

\- isolate dependency changes from refactor logic

\- update the minimum number of packages

\- prefer patch/minor over major when possible

\- validate immediately after upgrade

\- document impact and rollback notes



\### Gate 9

No dependency update proceeds without:

\- install success

\- build success

\- lint success

\- type-check success

\- test pass where applicable



\---



\## Phase 10 — Final Consistency Pass



\### Goal

Finish with coherence, not churn.



\### Final Checks

\- naming consistency

\- duplicate helper review

\- dead code re-scan

\- import cleanup

\- comments accuracy

\- contract alignment

\- error handling consistency

\- folder clarity

\- readme or developer notes update if structure changed



\### Final Deliverables

Produce:

1\. summary of completed refactors

2\. unresolved issues

3\. deferred refactor candidates

4\. risk notes

5\. recommended next steps

6\. rollback-sensitive areas

7\. technical debt still remaining



\### Gate 10

The process ends only after final validation passes.



\---



\# Per-Batch Reporting Format



For every batch, output exactly these sections:



\## Batch ID

Unique identifier for this refactor batch.



\## Scope

Files, functions, modules affected.



\## Intent

What is being improved.



\## Risk

Low / Medium / High with reason.



\## Changes

Concrete modifications made.



\## Validation

Commands run and what they checked.



\## Result

Pass / Fail / Partial.



\## Notes

Anything that needs monitoring or follow-up.



\---



\# Validation Policy



Use the smallest sufficient safety loop first, then broader checks as needed.



Preferred validation ladder:

1\. targeted type/lint/test check

2\. module-level test

3\. app build

4\. local runtime smoke test

5\. broader regression pass



If no automated tests exist, define manual checks with exact steps and expected outcomes.



Never claim “done” without evidence.



\---



\# Pause Gates



These are mandatory stop points.



Stop and report after:

\- baseline creation

\- discovery completion

\- validation setup completion

\- each refactor batch

\- each file/module relocation batch

\- each dependency update

\- final pass



At each stop point, present:

\- current status

\- what changed

\- what remains

\- whether the next step is safe



\---



\# Rollback Rules



Maintain a rollback mindset at all times.



For every batch:

\- keep scope small enough to revert cleanly

\- do not interleave unrelated changes

\- document files touched

\- identify likely rollback points



If a batch introduces instability:

\- revert or repair immediately

\- re-run validation

\- do not stack more changes on top of a failing batch



\---



\# Decision Heuristics



When uncertain:

\- choose simpler code

\- choose explicit names

\- choose lower-risk sequence

\- choose local clarity

\- choose proven patterns already used in the codebase

\- choose fewer moving parts



Avoid:

\- clever abstractions

\- pattern inflation

\- utility sprawl

\- cosmetic churn with no maintainability gain



\---



\# Definition of Done



The refactor is complete only if:



\- behavior is preserved

\- critical flows still work

\- the code is easier to read

\- major functions are clearer or smaller

\- duplication is reduced where helpful

\- dead code is removed

\- naming is more explicit

\- module responsibilities are clearer

\- validation passes

\- remaining risks are documented

\- the codebase is safer for future work than before the refactor began



\---



\# Execution Posture



Act like a senior software engineer cleaning a live production system.



Do not rush.

Do not rewrite blindly.

Do not hide uncertainty.

Do not continue through red signals.



Inspect carefully.

Change narrowly.

Validate immediately.

Document clearly.

Leave the codebase cleaner after every batch.

