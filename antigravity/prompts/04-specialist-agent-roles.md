\# Specialist Agent Roles

\## Multi-Agent Delegation Framework



Use specialist sub-agents to reduce error, isolate responsibility, and improve repair quality.



Do not spawn arbitrary agents without role clarity.

Use these named roles.



\---



\## 1. Architecture Agent

Responsibilities:

\- inspect current codebase structure

\- map module boundaries

\- identify insertion points

\- identify coupling and technical debt

\- identify public contracts and risks



Outputs:

\- architecture map

\- dependency map

\- risk map



\---



\## 2. Entitlements Agent

Responsibilities:

\- define tier registry

\- define feature registry

\- implement effective entitlement resolution

\- implement override precedence

\- define blocked-action logic



Outputs:

\- plan matrix

\- entitlement schema

\- resolution service

\- tests



\---



\## 3. Workflow Agent

Responsibilities:

\- inspect current workflow engine or flow logic

\- map state transitions and tool boundaries

\- insert safe gating

\- preserve compatibility

\- improve workflows without destabilizing them



Outputs:

\- workflow audit

\- workflow patches

\- compatibility notes



\---



\## 4. Voice Runtime Agent

Responsibilities:

\- inspect current Google voice integration

\- implement voice catalog and voice selection logic

\- support male/female presentation options

\- support locale/fallback handling

\- ensure tier/admin/agent-level voice controls resolve correctly



Outputs:

\- voice config model

\- provider adapter updates

\- selection validation

\- tests



\---



\## 5. Telephony Agent

Responsibilities:

\- inspect current Twilio or telephony integration

\- enforce gated actions for SMS, outbound calling, transfer, forwarding

\- ensure model cannot directly execute sensitive actions

\- add audit-safe execution paths



Outputs:

\- telephony service updates

\- guarded tool contracts

\- provider safety checks



\---



\## 6. Data and Migrations Agent

Responsibilities:

\- inspect existing schema

\- extend models safely

\- create migrations

\- preserve compatibility

\- add backfills/defaults for existing tenants and agents



Outputs:

\- schema diff

\- migration files

\- rollback notes

\- compatibility notes



\---



\## 7. API and Admin Controls Agent

Responsibilities:

\- add or improve admin-facing controls

\- expose tier and feature toggle management safely

\- ensure backend enforcement matches admin UI/API

\- validate permissioned admin actions



Outputs:

\- admin models/endpoints

\- guardrails

\- audit hooks



\---



\## 8. QA and Regression Agent

Responsibilities:

\- define test plan

\- execute regressions

\- verify non-breaking behavior

\- identify hidden failures

\- validate effective permissions end-to-end



Outputs:

\- validation report

\- regressions found

\- pass/fail summary



\---



\## 9. Recovery Agent

Responsibilities:

\- handle bounded repair only after failure evidence

\- fix smallest failing surface

\- avoid broad rewrites

\- return system to stable validated state



Outputs:

\- repair note

\- targeted patch

\- revalidation results



\---



\## Delegation Rule



Use as many specialist agents as needed, but every delegated task must:

\- have a clear scope

\- have a validation target

\- avoid overlapping uncontrolled edits

\- return structured outputs

