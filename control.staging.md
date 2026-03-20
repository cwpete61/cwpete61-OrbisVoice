\# OrbisVoice Staging Control File

\## Pre-Production Validation and Controlled Enforcement Layer



This file defines the staging environment behavior.



It is designed to:

\- simulate production safely

\- surface integration and policy errors

\- validate finance and usage tracking

\- test latency and scaling behavior

\- prevent destructive or high-risk actions



Antigravity must treat this environment as production-like but not production-critical.



\---



\## Core Mode



environment: staging

execution\_mode: controlled

system\_state: pre\_production

build\_priority: validation\_and\_stability



\---



\## Allowed Execution Scope



max\_change\_scope: medium

allow\_schema\_changes: false

allow\_migrations: limited

allow\_provider\_adapter\_changes: limited

allow\_workflow\_mutation: limited

allow\_runtime\_policy\_changes: true

allow\_finance\_layer\_changes: true



\---



\## Safety Rules



prevent\_destructive\_rewrites: true

require\_discovery\_before\_changes: true

require\_phase\_validation: true

require\_regression\_checks: true

require\_audit\_logging: true

stop\_on\_repeated\_instability: true



\---



\## Architectural Guarantees



voice\_gateway\_is\_source\_of\_truth: true

frontend\_must\_not\_call\_gemini\_directly: true

frontend\_must\_not\_expose\_api\_keys: true

tool\_execution\_must\_be\_backend\_controlled: true



\---



\## Current Build Focus



active\_program: system\_validation\_and\_preproduction\_hardening



primary\_goals:

&#x20; - validate\_gateway\_audio\_pipeline

&#x20; - validate\_tool\_execution\_paths

&#x20; - validate\_policy\_enforcement\_behavior

&#x20; - validate\_usage\_tracking\_accuracy

&#x20; - validate\_pricing\_and\_margin\_calculation

&#x20; - validate\_latency\_targets\_under\_load



secondary\_goals:

&#x20; - validate\_admin\_controls

&#x20; - validate approval workflows

&#x20; - validate duplicate suppression

&#x20; - validate compliance enforcement



\---



\## Feature Toggles



features:

&#x20; website\_chat: true

&#x20; website\_voice\_overlay: true

&#x20; inbound\_voice: true

&#x20; outbound\_voice: enabled\_limited

&#x20; sms: true

&#x20; email: true

&#x20; voicemail\_capture: true

&#x20; live\_transfer: enabled\_limited

&#x20; multilingual\_support: optional

&#x20; booking: true

&#x20; reminders: true

&#x20; review\_requests: optional

&#x20; crm\_export: true

&#x20; api\_access: optional

&#x20; custom\_automations: restricted

&#x20; white\_label: disabled



\---



\## High-Risk Feature Controls



high\_risk\_features:

&#x20; outbound\_calling: test\_mode\_only

&#x20; bulk\_sms: disabled

&#x20; bulk\_email: disabled

&#x20; call\_forwarding: test\_mode\_only

&#x20; warm\_transfer: test\_mode\_only

&#x20; cold\_transfer: disabled

&#x20; bridge\_call: disabled

&#x20; call\_recording: consent\_required

&#x20; custom\_api\_execution: admin\_only



\---



\## Runtime Policy (PARTIAL ENFORCEMENT)



runtime\_policy\_enabled: true

runtime\_policy\_mode: enforce\_safe\_actions



runtime\_policy\_rules:

&#x20; enforce\_plan\_limits: true

&#x20; enforce\_admin\_overrides: true

&#x20; enforce\_cost\_thresholds: true

&#x20; enforce\_compliance\_checks: true

&#x20; require\_confirmation\_for\_sensitive\_actions: true

&#x20; require\_admin\_approval\_for\_high\_risk\_actions: true



\---



\## Usage and Finance (SHADOW + ACTIVE HYBRID)



usage\_tracking\_enabled: true

pricing\_registry\_enabled: true

revenue\_margin\_enabled: true

overage\_billing\_enabled: false

finance\_alerts\_enabled: true



usage\_mode: active

pricing\_mode: shadow

finance\_mode: shadow



\---



\## Financial Validation Rules



max\_cost\_per\_session\_usd: 5.00

max\_cost\_per\_minute\_usd: 1.00

min\_margin\_percentage: 40



cost\_protection\_actions:

&#x20; - log\_only

&#x20; - alert\_only

&#x20; - recommend\_adjustment



\---



\## Observability (FULL)



structured\_logging: true

trace\_ids\_required: true

session\_metrics\_enabled: true

latency\_metrics\_enabled: true

tool\_latency\_metrics\_enabled: true

cost\_metrics\_enabled: true

audit\_logging\_enabled: true



\---



\## Latency and Performance Targets



latency\_target\_ms: 500

p95\_latency\_target\_ms: 700

barge\_in\_target\_ms: 150



performance\_rules:

&#x20; monitor\_latency\_strictly: true

&#x20; allow\_debug\_logging: true

&#x20; allow\_performance\_profiling: true

&#x20; preserve\_audio\_stream\_integrity: true



\---



\## Tool Execution Controls



tool\_execution\_mode: backend\_wrapped\_only

tool\_policy\_mode: strict\_validation



required\_pre\_execution\_checks:

&#x20; - plan\_entitlement

&#x20; - compliance\_check

&#x20; - cost\_check

&#x20; - duplication\_check



allowed\_tools:

&#x20; - check\_calendar\_availability

&#x20; - create\_calendar\_event

&#x20; - update\_calendar\_event

&#x20; - cancel\_calendar\_event

&#x20; - send\_confirmation\_email

&#x20; - send\_internal\_notification\_email

&#x20; - send\_confirmation\_sms

&#x20; - send\_internal\_alert\_sms

&#x20; - lookup\_contact

&#x20; - create\_lead

&#x20; - update\_lead

&#x20; - attach\_call\_notes

&#x20; - make\_outbound\_call

&#x20; - forward\_call\_to\_number

&#x20; - warm\_transfer\_call

&#x20; - handoff\_to\_human



\---



\## Duplicate Protection



idempotency\_required\_for\_side\_effects: true

duplicate\_suppression\_enabled: true

duplicate\_window\_seconds: 120



duplicate\_protected\_actions:

&#x20; - create\_calendar\_event

&#x20; - send\_confirmation\_sms

&#x20; - send\_confirmation\_email

&#x20; - make\_outbound\_call



\---



\## Compliance Controls



do\_not\_call\_checks: true

sms\_opt\_in\_checks: true

email\_opt\_in\_checks: true

after\_hours\_policy: true

recording\_consent\_required: true

pii\_sensitive\_action\_logging: true

hipaa\_mode: optional



\---



\## Admin and Approval Controls



admin\_override\_enabled: true

approval\_system\_enabled: true

approval\_mode: simulated



approval\_required\_for:

&#x20; - outbound\_calling

&#x20; - bulk\_sms

&#x20; - bulk\_email

&#x20; - call\_forwarding

&#x20; - pricing\_override

&#x20; - custom\_api\_execution



\---



\## Testing and Validation



run\_unit\_tests: true

run\_integration\_tests: true

run\_runtime\_scenario\_tests: true

run\_financial\_tests: true

run\_migration\_tests: limited

run\_load\_tests: true



validation\_gate:

&#x20; require\_app\_boot: true

&#x20; require\_voice\_session\_test: true

&#x20; require\_tool\_execution\_test: true

&#x20; require\_financial\_consistency: true

&#x20; require\_no\_critical\_regressions: true



\---



\## Deployment Controls



deployment\_target: staging\_cluster

allow\_staging\_deploy: true

allow\_production\_deploy: false

allow\_schema\_apply\_in\_staging: limited



deployment\_rules:

&#x20; require\_pre\_deploy\_validation: true

&#x20; require\_post\_deploy\_monitoring: true



\---



\## Incident Mode



incident\_mode\_enabled: true



incident\_modes:

&#x20; - degraded\_mode

&#x20; - latency\_protection\_mode

&#x20; - cost\_protection\_mode



\---



\## Reporting Requirements



require\_phase\_report: true

require\_change\_log: true

require\_risk\_summary: true

require\_test\_summary: true

require\_financial\_validation\_summary: true



\---



\## Operator Intent



current\_operator\_intent:

&#x20; - validate\_system\_under\_real\_conditions

&#x20; - surface\_policy\_and\_finance\_errors

&#x20; - test\_high\_risk\_features\_safely

&#x20; - prepare\_for\_production\_enforcement



\---



\## Human Approval Required



\- enabling full outbound calling

\- enabling overage billing

\- switching pricing\_mode to active

\- switching finance\_mode to active

\- enabling bulk operations

\- production deployment



\---



\## Final Directive



Staging must behave like production with guardrails.



Priorities:



1\. detect errors before production

2\. validate policy and finance logic

3\. ensure stable voice performance

4\. safely test high-risk features



Do not treat staging as development.

Do not treat staging as production.

Treat it as a validation environment.

