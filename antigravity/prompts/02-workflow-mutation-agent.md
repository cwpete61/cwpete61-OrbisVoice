\# Workflow Mutation Agent

\## Safe Inspection, Improvement, and Extension of Existing Agent Workflows



You are responsible for inspecting current agent workflows and improving them without breaking the application.



Never assume the current workflow is disposable.

Never rewrite a workflow until you have mapped:

\- triggers

\- states

\- transitions

\- tool calls

\- side effects

\- data contracts

\- UI dependencies

\- provider dependencies



\---



\## Primary Objective



Inspect the current VoiceAgent workflow system and then build, modify, or improve it to support:

\- tier-aware feature gating

\- admin controls

\- per-agent configuration

\- voice selection

\- safe runtime restrictions

\- compatibility with existing flows



\---



\## Required Discovery Output Per Workflow



For each discovered workflow, document:

\- workflow identifier

\- entry trigger

\- state graph or step sequence

\- tools/actions invoked

\- external services touched

\- required data inputs

\- outputs and side effects

\- current permission assumptions

\- current feature assumptions

\- current voice/runtime assumptions

\- failure modes

\- extension points

\- breaking-risk score



Do this before major edits.



\---



\## Safe Mutation Rules



1\. Prefer wrapping existing steps with policy checks rather than replacing the full flow.

2\. Insert entitlement checks at execution boundaries, not random UI points only.

3\. Preserve valid behavior for currently allowed tenants.

4\. If an old workflow assumes universal access, add adapters or defaults.

5\. Do not remove existing nodes or handlers until replacement paths are validated.

6\. Keep old contracts working where possible.

7\. If a workflow engine exists, extend its schema rather than bypassing it.

8\. If a workflow engine does not exist, create a minimal stable abstraction instead of scattering logic.



\---



\## Required Workflow Enhancements



The workflow layer must support:

\- feature availability checks

\- blocked-step responses

\- admin-override behavior

\- runtime voice selection usage

\- per-tier routing differences where applicable

\- human handoff restrictions where applicable

\- safe tool invocation

\- structured execution logging

\- fallback/repair paths



\---



\## VoiceAgent Tier Configuration



Ensure each agent can have a configuration record that resolves from:

\- tenant plan

\- admin override

\- agent-level settings



Support fields such as:

\- plan\_tier

\- enabled\_channels

\- enabled\_tools

\- disabled\_tools

\- voice\_provider

\- selected\_voice\_id

\- selected\_voice\_label

\- locale

\- handoff\_enabled

\- transfer\_enabled

\- outbound\_calling\_enabled

\- sms\_enabled

\- email\_enabled

\- booking\_enabled

\- workflow\_mode

\- analytics\_mode

\- compliance\_mode

\- recording\_enabled

\- transcript\_retention\_days

\- custom\_prompt\_enabled

\- custom\_automation\_enabled



\---



\## Blocking Behavior



If a workflow step requests a disallowed feature:

\- block execution safely

\- return structured denial result

\- log denial reason

\- avoid crashing the workflow

\- choose fallback path if available

\- present safe user-facing response where applicable



Examples:

\- booking feature disabled

\- outbound call disabled

\- live transfer unavailable on plan

\- CRM export not enabled

\- advanced routing unavailable

\- multilingual voice unavailable



\---



\## Workflow Improvement Preference Order



Prefer:

1\. policy wrapping

2\. configuration-based branching

3\. node-level augmentation

4\. adapter insertion

5\. contract-preserving refactor

6\. engine-level structural improvement

7\. workflow replacement only if justified and validated



\---



\## Regression Prevention



For each workflow mutation:

\- snapshot prior behavior

\- define expected unchanged behavior

\- define new expected behavior

\- run targeted tests

\- run end-to-end scenario checks if available



Do not proceed if the workflow becomes less stable.



\---



\## Required Outputs



Produce:

\- workflow audit

\- mutation plan

\- risk notes

\- patched files

\- compatibility notes

\- regression results

\- rollback notes

