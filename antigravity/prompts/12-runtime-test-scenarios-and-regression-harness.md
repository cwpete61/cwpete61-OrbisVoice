\# Runtime Test Scenarios and Regression Harness

\## End-to-End Validation, Policy Regression, Workflow Safety, and Financial Reconciliation



You are responsible for designing and implementing a complete runtime test and regression harness for the VoiceAgent platform.



This system must verify that:



\- plan entitlements resolve correctly

\- runtime policy enforcement behaves correctly

\- workflow mutations do not break existing behavior

\- pricing calculations remain consistent

\- usage tracking remains accurate

\- margin and overage calculations remain correct

\- admin approvals and overrides work as intended

\- sensitive actions remain gated

\- voice selection and fallback work correctly

\- duplicate suppression and loop prevention work correctly

\- live-session behavior remains stable after changes



This test harness must cover both deterministic backend logic and realistic multi-step runtime scenarios.



Do not implement testing as isolated unit tests only.

Build a layered validation framework that includes:

\- unit tests

\- integration tests

\- end-to-end scenario tests

\- policy regression tests

\- financial reconciliation tests

\- migration and compatibility tests

\- bounded repair checkpoints



\---



\## Primary Objective



Create a regression harness that can prove, after any significant change, that:



\- the app still works

\- existing workflows still work where allowed

\- new restrictions block correctly

\- new features execute correctly

\- pricing and usage math are stable

\- policy and entitlement enforcement remain aligned

\- no sensitive action bypasses runtime controls

\- no financial logic drifts from registry-backed rules



\---



\## Testing Layers



The regression harness must contain these layers.



\### 1. Unit Test Layer

Verify isolated correctness of:

\- entitlement resolution

\- pricing resolution

\- usage calculation

\- cost formulas

\- margin formulas

\- runtime policy decisions

\- duplicate suppression

\- fallback resolution

\- voice selection resolution

\- override precedence

\- approval requirement checks



\### 2. Integration Test Layer

Verify connected services across boundaries:

\- entitlement service + runtime policy service

\- pricing registry + usage service

\- usage service + revenue service

\- runtime policy + tool execution adapters

\- admin approvals + sensitive actions

\- voice config + session start

\- plan overrides + workflow behavior



\### 3. Runtime Scenario Layer

Verify full live-agent flows:

\- user starts session

\- agent responds

\- tool is requested

\- runtime policy evaluates

\- execution proceeds or is blocked

\- fallback is applied where needed

\- usage/cost is recorded

\- audit event is created



\### 4. Regression Layer

Verify previously working allowed scenarios continue to work after code changes.



\### 5. Financial Reconciliation Layer

Verify:

\- session totals reconcile to daily totals

\- daily totals reconcile to monthly totals

\- provider-cost inputs reconcile to usage records

\- overage logic reconciles to pricing registry

\- margin reports remain consistent with revenue and cost records



\### 6. Migration Compatibility Layer

Verify:

\- old tenants map safely into new plan/entitlement structures

\- old workflows remain executable where permitted

\- old agent configs resolve defaults safely

\- old pricing records remain historically valid

\- missing voice selections resolve correctly



\---



\## Core Test Principles



1\. Test behavior, not only code paths.

2\. Test allowed and denied outcomes.

3\. Test runtime enforcement at execution boundaries.

4\. Test financial math against registry-backed values.

5\. Test old and new workflow compatibility.

6\. Test duplication suppression and idempotency.

7\. Test failure handling and safe fallback behavior.

8\. Test that blocked actions do not silently execute.

9\. Test with realistic multi-step scenarios, not only isolated mocks.

10\. Preserve evidence of failures and repaired outcomes.



\---



\## Required Test Fixtures



Create fixtures or builders for:



\### Tenant Types

\- free\_tenant

\- ltd\_tenant

\- starter\_tenant

\- professional\_tenant

\- enterprise\_tenant

\- ai\_revenue\_infrastructure\_tenant



\### Admin States

\- no\_admin\_override

\- safe\_admin\_override

\- high\_risk\_feature\_approved

\- approval\_pending

\- tenant\_restricted\_state



\### Agent Config States

\- default\_voice\_agent

\- custom\_voice\_agent

\- invalid\_voice\_agent

\- outbound\_enabled\_agent

\- transfer\_enabled\_agent

\- constrained\_cost\_agent



\### Compliance States

\- sms\_opted\_in\_contact

\- sms\_not\_opted\_in\_contact

\- email\_opted\_in\_contact

\- do\_not\_call\_contact

\- recording\_consent\_given

\- recording\_consent\_missing

\- after\_hours\_state



\### Usage States

\- normal\_usage\_state

\- near\_limit\_usage\_state

\- hard\_cap\_exceeded\_state

\- high\_cost\_session\_state

\- concurrency\_exceeded\_state



\### Pricing States

\- standard\_pricing\_version

\- grandfathered\_pricing\_version

\- tenant\_specific\_contract\_pricing

\- promotion\_active\_pricing

\- overage\_triggered\_pricing



\---



\## Required Scenario Test Groups



\### Group A — Session Start Scenarios



\#### A1. Free session starts normally

Given:

\- free tenant active

\- within usage limits

\- valid voice

Expect:

\- session start allowed

\- usage session initialized

\- audit event created



\#### A2. Session denied because tenant exceeded hard cap

Given:

\- free tenant over monthly conversation cap

Expect:

\- session start denied

\- denial reason logged

\- no downstream provider execution occurs



\#### A3. Session denied because concurrency exceeded

Given:

\- enterprise tenant already at max concurrent sessions

Expect:

\- start denied or queued according to policy

\- concurrency event logged



\#### A4. Invalid selected voice falls back safely

Given:

\- selected voice no longer valid

Expect:

\- session continues with tenant default or platform fallback

\- fallback event logged

\- no crash



\---



\### Group B — Booking and Scheduling Scenarios



\#### B1. Allowed booking flow

Given:

\- starter tenant

\- booking enabled

\- valid calendar integration

\- confirmation required

Expect:

\- availability lookup allowed

\- booking request requires confirmation

\- confirmed booking executes once

\- usage, audit, and finance events recorded



\#### B2. Booking denied due to plan restriction

Given:

\- plan with booking disabled

Expect:

\- create\_calendar\_event denied

\- fallback path offered

\- no calendar write occurs



\#### B3. Duplicate booking suppression

Given:

\- repeated create\_calendar\_event call with same payload

Expect:

\- second execution suppressed

\- duplicate event logged



\#### B4. Booking denied after hours when policy blocks it

Given:

\- after-hours restriction for direct booking

Expect:

\- booking blocked

\- callback or internal follow-up fallback used



\---



\### Group C — Messaging Scenarios



\#### C1. Confirmation email allowed

Given:

\- email enabled

\- valid recipient

Expect:

\- confirmation email sent once

\- audit event created

\- cost tracked



\#### C2. SMS blocked without opt-in

Given:

\- professional tenant

\- send\_confirmation\_sms requested

\- contact has no SMS opt-in

Expect:

\- SMS denied

\- compliance reason returned

\- fallback to email or internal notification if allowed



\#### C3. Bulk SMS requires approval

Given:

\- enterprise tenant

\- bulk messaging plan-allowed but approval missing

Expect:

\- require\_admin\_approval result

\- no SMS provider execution



\#### C4. Duplicate SMS suppression

Given:

\- same confirmation SMS attempted twice in duplicate window

Expect:

\- second send suppressed

\- duplicate suppression logged



\---



\### Group D — Telephony Scenarios



\#### D1. Starter outbound call denied

Given:

\- starter tenant

\- outbound calling disabled

Expect:

\- make\_outbound\_call denied

\- no Twilio outbound call created



\#### D2. Professional outbound call allowed with admin enablement

Given:

\- professional tenant

\- admin has enabled outbound calling

\- contact is not on do-not-call list

Expect:

\- outbound call allowed

\- provider execution occurs

\- call cost tracked



\#### D3. Outbound call blocked by do-not-call

Given:

\- enterprise tenant

\- outbound enabled

\- contact marked do\_not\_call

Expect:

\- outbound denied

\- compliance event logged

\- manual internal note fallback if allowed



\#### D4. Live transfer allowed only on enterprise

Given:

\- enterprise tenant

\- live transfer enabled

Expect:

\- warm\_transfer\_call allowed

\- transfer event logged



\#### D5. Live transfer denied on professional

Given:

\- professional tenant

\- live transfer not included

Expect:

\- transfer denied

\- alternate fallback used



\#### D6. Recording blocked before consent

Given:

\- recording not yet consented

Expect:

\- start\_call\_recording denied

\- no provider recording started



\---



\### Group E — Runtime Cost Control Scenarios



\#### E1. High token burn triggers concise mode

Given:

\- session output-token burn exceeds warn threshold

Expect:

\- runtime mode changes to cost-constrained

\- responses shortened

\- event logged



\#### E2. Session cost exceeds hard threshold

Given:

\- current session cost exceeds max\_session\_cost\_by\_plan

Expect:

\- non-essential actions denied

\- session ends gracefully or degrades according to policy

\- event logged



\#### E3. Silence streaming exceeds threshold

Given:

\- long silence stream beyond configured limit

Expect:

\- silence handling policy triggered

\- streaming reduced or stopped

\- unnecessary cost avoided



\#### E4. Repeated tool retry loop is blocked

Given:

\- same failed tool call repeated beyond retry ceiling

Expect:

\- loop blocked

\- fallback path selected

\- no uncontrolled recursion



\---



\### Group F — Plan and Entitlement Scenarios



\#### F1. Free features resolve correctly

Verify:

\- inbound voice allowed if configured

\- outbound denied

\- basic booking allowed if configured

\- no advanced routing

\- no bulk messaging

\- voice selection limited correctly



\#### F2. Starter features resolve correctly

Verify:

\- booking allowed

\- SMS allowed where configured

\- outbound denied

\- live transfer denied



\#### F3. Professional features resolve correctly

Verify:

\- lead scoring and advanced routing allowed

\- outbound requires admin enablement

\- live transfer denied unless business rule changes it



\#### F4. Enterprise features resolve correctly

Verify:

\- outbound supported with admin gate

\- live transfer allowed

\- advanced reporting allowed

\- API access allowed if configured



\#### F5. AI Revenue Infrastructure resolves correctly

Verify:

\- advanced integrations available

\- multilingual allowed

\- high concurrency allowed

\- custom API and revenue analytics enabled



\#### F6. LTD special handling resolves correctly

Verify:

\- LTD maps to explicit entitlements

\- not treated as recurring-subscription default

\- cost-risk policies still apply



\---



\### Group G — Pricing and Overage Scenarios



\#### G1. Provider cost resolution by date

Given:

\- pricing version changes on a new date

Expect:

\- old session uses old cost version

\- new session uses new cost version



\#### G2. Included usage consumed without overage

Given:

\- tenant within included SMS or conversation pool

Expect:

\- no overage charge generated



\#### G3. Overage billed correctly

Given:

\- tenant exceeds included outbound minutes

Expect:

\- overage units computed correctly

\- overage charge computed from plan pricing version

\- finance event recorded



\#### G4. Hard cap blocks usage

Given:

\- metric set to hard\_cap mode

\- tenant exceeds cap

Expect:

\- runtime action denied

\- no extra provider usage occurs



\#### G5. Tenant override pricing applied

Given:

\- custom enterprise contract pricing

Expect:

\- effective pricing resolver returns tenant-specific rate

\- standard plan rate not used



\---



\### Group H — Revenue and Margin Scenarios



\#### H1. Session financial allocation is valid

Given:

\- one completed session

Expect:

\- session cost > 0 where applicable

\- session revenue allocation is deterministic

\- session margin computed correctly



\#### H2. Daily totals reconcile to session totals

Given:

\- multiple sessions in day

Expect:

\- daily summary matches sum of session records



\#### H3. Monthly totals reconcile

Given:

\- multiple daily summaries

Expect:

\- monthly summary matches daily aggregation



\#### H4. Negative margin account alert fires

Given:

\- tenant cost exceeds net revenue threshold

Expect:

\- margin alert created

\- account flagged for review



\#### H5. Plan profitability views remain consistent

Given:

\- multiple tenants on multiple plans

Expect:

\- margin by plan report reconciles to tenant-level totals



\---



\### Group I — Admin and Approval Scenarios



\#### I1. Unauthorized pricing change blocked

Given:

\- support admin attempts pricing edit

Expect:

\- permission denied

\- audit event logged



\#### I2. Finance admin can issue approved credit

Given:

\- finance admin within permitted threshold

Expect:

\- credit issued

\- finance event logged

\- audit event logged



\#### I3. Large refund requires approval

Given:

\- refund exceeds threshold

Expect:

\- approval request created

\- no refund issued until approved



\#### I4. High-risk feature enablement requires approval

Given:

\- outbound calling enabled for tenant

\- no approval present

Expect:

\- pending approval state

\- feature not executable until approved



\---



\### Group J — Workflow Mutation Regression Scenarios



\#### J1. Existing allowed booking workflow still works after gating insertion

Given:

\- previously working starter booking flow

Expect:

\- still works where plan allows

\- no unexpected denial



\#### J2. Existing unrestricted workflow now denied safely where plan disallows

Given:

\- old workflow assumed universal outbound messaging

\- free or starter tenant now restricted

Expect:

\- blocked safely

\- no crash

\- fallback path applied



\#### J3. Old agent config without voice selection remains valid

Given:

\- legacy agent config missing selected voice id

Expect:

\- tenant or platform fallback assigned

\- workflow still starts



\#### J4. Legacy pricing records remain readable

Given:

\- old pricing rows using previous structure

Expect:

\- adapter or migration preserves reporting



\---



\## Required Test Harness Architecture



Create a structured harness with these layers:



\### Test Builders / Factories

Build reusable factories for:

\- tenants

\- plans

\- agents

\- sessions

\- contacts

\- approval records

\- pricing versions

\- usage records

\- workflow states



\### Simulation Helpers

Build scenario helpers that can simulate:

\- live session progression

\- tool-call request and evaluation

\- provider adapter execution or suppression

\- repeated turns

\- duplicate-action attempts

\- policy mode transitions

\- cost-threshold crossing



\### Assertion Helpers

Provide helper assertions for:

\- action allowed/denied

\- provider call executed/not executed

\- audit event exists

\- usage event exists

\- finance event exists

\- duplicate suppression occurred

\- fallback path selected

\- reconciliation total matches



\### Snapshot or Contract Tests

Where useful, maintain stable payload or contract snapshots for:

\- runtime policy decisions

\- entitlement resolution payloads

\- pricing resolution payloads

\- finance summary payloads

\- admin approval payloads



Use snapshot testing carefully. Prefer stable structured contracts over brittle text snapshots.



\---



\## Required Regression Baselines



Preserve a regression baseline for these core flows:



\- basic inbound conversation

\- booking flow

\- confirmation email flow

\- SMS reminder flow where allowed

\- outbound callback flow where allowed

\- live transfer flow where allowed

\- cost-constrained runtime mode

\- denied action with fallback

\- duplicate suppression

\- approval-required action

\- pricing overage calculation

\- monthly margin summary generation



Before and after major refactors, compare behavior against these baselines.



\---



\## Migration Validation Requirements



Test migration safety for:



\- tenants missing plan assignment

\- agents missing voice selection

\- workflows missing feature gates

\- pricing records missing registry version links

\- sessions created before finance layers existed

\- older admin roles lacking new permissions



Ensure migrations:

\- do not orphan records

\- do not break session execution

\- do not corrupt historical reporting

\- do not silently grant excessive permissions



\---



\## Failure Injection Tests



Intentionally test failure conditions such as:



\- provider timeout during tool execution

\- pricing registry lookup failure

\- approval lookup unavailable

\- invalid override record

\- corrupted voice id

\- duplicate event race condition

\- calendar API failure after confirmation

\- SMS provider failure

\- Twilio call creation failure



Verify:

\- system fails safely

\- provider-side duplication does not occur

\- retries are bounded

\- audit and error events are captured

\- user-facing fallback remains controlled



\---



\## Bounded Self-Healing Checkpoints



This harness must support bounded self-healing workflows.



When a regression appears:

1\. identify the failing scenario

2\. classify failure type

3\. isolate affected module or contract

4\. patch smallest failing surface

5\. rerun impacted scenario set

6\. rerun broader regression set

7\. compare new results to prior baseline

8\. stop if repeated instability spreads



Do not allow regression repair to trigger broad unrelated rewrites.



\---



\## Required Reports



After test execution, produce reports for:



\### 1. Runtime Policy Report

\- allowed actions

\- denied actions

\- confirmation-gated actions

\- approval-gated actions

\- fallback success rate



\### 2. Workflow Regression Report

\- preserved scenarios

\- broken scenarios

\- repaired scenarios

\- remaining risks



\### 3. Financial Reconciliation Report

\- session-to-day reconciliation

\- day-to-month reconciliation

\- overage reconciliation

\- pricing version consistency



\### 4. Migration Compatibility Report

\- legacy paths tested

\- default mappings applied

\- failures found

\- repairs applied



\### 5. Failure Injection Report

\- induced failure type

\- observed outcome

\- safe handling result

\- residual weaknesses



\---



\## Success Criteria



This regression harness is complete when:



\- plan, policy, pricing, usage, and finance logic are all covered

\- both allowed and denied paths are tested

\- runtime actions are verified at execution boundaries

\- historical pricing and finance integrity are preserved

\- legacy workflows remain compatible where intended

\- duplicate suppression and loop prevention are proven

\- failure conditions are handled safely

\- regression reports can identify drift after future changes

\- the system can support bounded self-healing without masking real breakage

