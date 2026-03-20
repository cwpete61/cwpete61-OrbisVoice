\# OrbisVoice Production Control File

\## Hardened Runtime Control for Staging and Production



This file defines strict execution rules for production environments.



It prioritizes:

\- stability

\- safety

\- financial accuracy

\- compliance

\- controlled feature execution



Antigravity must enforce these rules with highest priority.



\---



\## Core Mode



environment: production

execution\_mode: strict

system\_state: live

build\_priority: safety\_and\_stability



\---



\## Allowed Execution Scope



max\_change\_scope: small

allow\_schema\_changes: false

allow\_migrations: false

allow\_provider\_adapter\_changes: false

allow\_workflow\_mutation: false

allow\_runtime\_policy\_changes: limited

allow\_finance\_layer\_changes: limited



\---



\## Safety Rules



prevent\_destructive\_rewrites: true

require\_discovery\_before\_changes: true

require\_explicit\_operator\_confirmation: true

require\_pre\_deploy\_validation: true

require\_post\_deploy\_validation: true

require\_regression\_checks: true

require\_audit\_logging: true

stop\_on\_any\_instability: true



\---



\## Production Architectural Guarantees



voice\_gateway\_is\_source\_of\_truth: true

frontend\_must\_not\_call\_gemini\_directly: true

frontend\_must\_not\_expose\_api\_keys: true

tool\_execution\_must\_be\_backend\_controlled: true

all\_sensitive\_actions\_must\_be\_logged: true

all\_financial\_operations\_must\_be\_tracked: true



\---



\## Feature Toggles (Production Safe Set)



features:

&#x20; website\_chat: true

&#x20; website\_voice\_overlay: true

&#x20; inbound\_voice: true

&#x20; outbound\_voice: true

&#x20; sms: true

&#x20; email: true

&#x20; voicemail\_capture: true

&#x20; live\_transfer: true

&#x20; multilingual\_support: optional

&#x20; booking: true

&#x20; reminders: true

&#x20; review\_requests: optional

&#x20; crm\_export: true

&#x20; api\_access: optional

&#x20; custom\_automations: restricted

&#x20; white\_label: enterprise\_only



\---



\## High-Risk Feature Enforcement



high\_risk\_features:

&#x20; outbound\_calling: enabled\_with\_policy

&#x20; bulk\_sms: restricted

&#x20; bulk\_email: restricted

&#x20; call\_forwarding: enabled\_with\_policy

&#x20; warm\_transfer: enabled\_with\_policy

&#x20; cold\_transfer: enabled\_with\_policy

&#x20; bridge\_call: enabled\_with\_policy

&#x20; call\_recording: consent\_required

&#x20; custom\_api\_execution: admin\_only



\---



\## Runtime Policy (ENFORCED)



runtime\_policy\_enabled: true

runtime\_policy\_mode: full\_enforcement



runtime\_policy\_rules:

&#x20; enforce\_plan\_limits: true

&#x20; enforce\_admin\_overrides: true

&#x20; enforce\_cost\_thresholds: true

&#x20; enforce\_compliance\_checks: true

&#x20; require\_confirmation\_for\_sensitive\_actions: true

&#x20; require\_admin\_approval\_for\_high\_risk\_actions: true



\---



\## Usage and Finance (ACTIVE)



usage\_tracking\_enabled: true

pricing\_registry\_enabled: true

revenue\_margin\_enabled: true

overage\_billing\_enabled: true

finance\_alerts\_enabled: true



usage\_mode: active

pricing\_mode: active

finance\_mode: active



\---



\## Financial Protection Rules



max\_cost\_per\_session\_usd: 5.00

max\_cost\_per\_minute\_usd: 1.00

min\_margin\_percentage: 40



cost\_protection\_actions:

&#x20; - downgrade\_model

&#x20; - reduce\_response\_length

&#x20; - disable\_high\_cost\_tools

&#x20; - trigger\_admin\_alert



overage\_rules:

&#x20; allow\_overage: true

&#x20; notify\_on\_threshold: true

&#x20; require\_confirmation\_above\_threshold: true



\---



\## Observability (REQUIRED)



structured\_logging: true

trace\_ids\_required: true

session\_metrics\_enabled: true

latency\_metrics\_enabled: true

tool\_latency\_metrics\_enabled: true

cost\_metrics\_enabled: true

audit\_logging\_enabled: true



\---



\## Latency and Performance Constraints



latency\_target\_ms: 500

p95\_latency\_target\_ms: 700

barge\_in\_target\_ms: 150



performance\_rules:

&#x20; reject\_high\_latency\_operations: true

&#x20; prioritize\_real\_time\_audio: true

&#x20; enforce\_non\_blocking\_tool\_calls: true

&#x20; enforce\_audio\_stream\_continuity: true



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

&#x20; - bridge\_call

&#x20; - handoff\_to\_human



\---



\## Duplicate Protection (STRICT)



idempotency\_required\_for\_side\_effects: true

duplicate\_suppression\_enabled: true

duplicate\_window\_seconds: 180



duplicate\_protected\_actions:

&#x20; - create\_calendar\_event

&#x20; - send\_confirmation\_sms

&#x20; - send\_confirmation\_email

&#x20; - make\_outbound\_call

&#x20; - forward\_call\_to\_number



\---



\## Compliance Enforcement



do\_not\_call\_checks: true

sms\_opt\_in\_checks: true

email\_opt\_in\_checks: true

after\_hours\_policy: true

recording\_consent\_required: true

pii\_sensitive\_action\_logging: true

hipaa\_mode: optional



\---



\## Admin and Approval System



admin\_override\_enabled: true

approval\_system\_enabled: true

approval\_mode: enforced



approval\_required\_for:

&#x20; - outbound\_calling\_high\_volume

&#x20; - bulk\_sms

&#x20; - bulk\_email

&#x20; - call\_forwarding\_external

&#x20; - pricing\_override

&#x20; - overage\_override

&#x20; - custom\_api\_execution



\---



\## Testing and Validation (MANDATORY)



run\_unit\_tests: true

run\_integration\_tests: true

run\_runtime\_scenario\_tests: true

run\_financial\_tests: true

run\_migration\_tests: false

run\_load\_tests: true



validation\_gate:

&#x20; require\_app\_boot: true

&#x20; require\_voice\_session\_test: true

&#x20; require\_tool\_execution\_test: true

&#x20; require\_financial\_consistency: true

&#x20; require\_no\_critical\_regressions: true



\---



\## Deployment Controls



deployment\_target: production\_cluster

allow\_staging\_deploy: true

allow\_production\_deploy: gated

allow\_schema\_apply\_in\_prod: false



deployment\_rules:

&#x20; require\_canary\_deploy: true

&#x20; require\_rollback\_plan: true

&#x20; require\_live\_monitoring: true



\---



\## Incident Mode Overrides



incident\_mode\_enabled: true



incident\_modes:

&#x20; - degraded\_mode

&#x20; - latency\_protection\_mode

&#x20; - cost\_protection\_mode



incident\_actions:

&#x20; degraded\_mode:

&#x20;   disable\_noncritical\_tools: true

&#x20;   reduce\_ai\_response\_complexity: true



&#x20; latency\_protection\_mode:

&#x20;   shorten\_responses: true

&#x20;   disable\_secondary\_processing: true



&#x20; cost\_protection\_mode:

&#x20;   switch\_to\_lower\_cost\_models: true

&#x20;   disable\_high\_cost\_tools: true



\---



\## Reporting Requirements



require\_phase\_report: true

require\_change\_log: true

require\_risk\_summary: true

require\_financial\_impact\_summary: true

require\_incident\_log\_if\_triggered: true



\---



\## Operator Intent (Production)



current\_operator\_intent:

&#x20; - maintain\_stability

&#x20; - enforce\_policy\_and\_finance

&#x20; - protect\_margin

&#x20; - prevent\_uncontrolled\_actions

&#x20; - ensure\_compliance



\---



\## Human Approval Required For



\- enabling\_new\_high\_risk\_features

\- increasing\_cost\_limits

\- modifying\_pricing\_logic

\- changing\_runtime\_policy\_mode

\- enabling\_bulk\_operations

\- production\_schema\_changes



\---



\## Final Directive



Antigravity must operate conservatively in this environment.



Priority order:



1\. system stability

2\. financial protection

3\. compliance enforcement

4\. latency performance

5\. feature execution



If any conflict arises:

\- block execution

\- log the event

\- require human approval

