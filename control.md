\# OrbisVoice Control File

\## Runtime Control Surface for Antigravity



This file defines the active operating mode, safety boundaries, execution scope, feature toggles, and environment assumptions for Antigravity.



Antigravity must read this file before executing any major task.



This file does not replace the numbered prompt files.

It modifies how they are applied in the current run.



\---



\## Core Mode



environment: development

execution\_mode: safe

system\_state: migration

build\_priority: stability\_first



\---



\## Allowed Execution Scope



max\_change\_scope: medium

allow\_schema\_changes: true

allow\_migrations: true

allow\_provider\_adapter\_changes: true

allow\_workflow\_mutation: true

allow\_runtime\_policy\_changes: true

allow\_finance\_layer\_changes: true



\### Scope Definitions

\# small  = localized patch only

\# medium = bounded subsystem work with validation

\# large  = multi-subsystem phased work only



\---



\## Safety Rules



prevent\_destructive\_rewrites: true

require\_discovery\_before\_major\_changes: true

require\_phase\_validation: true

require\_checkpoint\_before\_each\_phase: true

require\_regression\_checks\_after\_each\_phase: true

require\_bounded\_self\_healing: true

stop\_on\_repeated\_instability: true

preserve\_existing\_voice\_behavior: true

preserve\_audio\_pipeline: true

preserve\_gateway\_centrality: true



\---



\## Current Architectural Truths



voice\_gateway\_is\_source\_of\_truth: true

frontend\_must\_not\_call\_gemini\_directly: true

frontend\_must\_not\_expose\_api\_keys: true

audio\_utils\_must\_be\_preserved: true

agent\_builder\_prototype\_must\_be\_migrated\_not\_rewritten: true

tool\_execution\_must\_be\_backend\_controlled: true



\---



\## Current Build Focus



active\_program: gateway\_migration\_and\_system\_hardening



primary\_goals:

&#x20; - migrate\_gemini\_live\_to\_gateway

&#x20; - preserve\_audio\_pipeline

&#x20; - define\_gateway\_message\_contracts

&#x20; - enable\_tool\_call\_interception

&#x20; - maintain\_low\_latency

&#x20; - prepare\_for\_entitlements\_runtime\_policy\_and\_finance



secondary\_goals:

&#x20; - usage\_tracking\_foundations

&#x20; - pricing\_registry\_foundations

&#x20; - admin\_override\_foundations



deferred\_goals:

&#x20; - investor\_assets

&#x20; - nonessential\_ui\_polish

&#x20; - aggressive\_refactors

&#x20; - broad\_legacy\_cleanup



\---



\## Execution Phase Control



current\_phase: discovery



allowed\_phases:

&#x20; - discovery

&#x20; - entitlements\_foundation

&#x20; - voice\_config

&#x20; - admin\_overrides

&#x20; - workflow\_gating

&#x20; - provider\_execution\_wrappers

&#x20; - usage\_tracking

&#x20; - pricing\_registry

&#x20; - revenue\_margin

&#x20; - admin\_finance\_controls

&#x20; - runtime\_policy

&#x20; - regression\_harness

&#x20; - hardening

&#x20; - rollout\_preparation



blocked\_phases:

&#x20; - production\_cutover

&#x20; - destructive\_cleanup

&#x20; - broad\_rewrite



\---



\## Gateway Migration Controls



enable\_gateway\_migration: true

enable\_browser\_live\_extraction: true

enable\_gemini\_live\_in\_gateway: true

enable\_client\_to\_gateway\_audio\_streaming: true

enable\_gateway\_tool\_interception: true

enable\_barge\_in\_handling: true



gateway\_rules:

&#x20; preserve\_startTalking\_behavior: true

&#x20; preserve\_audio\_recorder: true

&#x20; preserve\_audio\_player: true

&#x20; replace\_unary\_generateContent\_with\_live\_api: true

&#x20; do\_not\_redesign\_audio\_encoding\_without\_evidence: true

&#x20; do\_not\_replace\_audio\_worklet\_pipeline: true



\---



\## Feature Toggles



features:

&#x20; website\_chat: true

&#x20; website\_voice\_overlay: true

&#x20; inbound\_voice: true

&#x20; outbound\_voice: false

&#x20; sms: true

&#x20; email: true

&#x20; voicemail\_capture: true

&#x20; live\_transfer: false

&#x20; multilingual\_support: false

&#x20; booking: true

&#x20; reminders: false

&#x20; review\_requests: false

&#x20; crm\_export: false

&#x20; api\_access: false

&#x20; custom\_automations: false

&#x20; white\_label: false



\---



\## High-Risk Feature Gates



high\_risk\_features:

&#x20; outbound\_calling: disabled

&#x20; bulk\_sms: disabled

&#x20; bulk\_email: disabled

&#x20; call\_forwarding: disabled

&#x20; warm\_transfer: disabled

&#x20; cold\_transfer: disabled

&#x20; bridge\_call: disabled

&#x20; call\_recording: admin\_enable\_only

&#x20; custom\_api\_execution: disabled



\---



\## Voice Configuration Controls



voice\_provider: google

voice\_selection\_enabled: true

voice\_gender\_switching\_enabled: true

voice\_preview\_enabled: true

voice\_locale\_switching\_enabled: true

fallback\_voice\_required: true



voice\_defaults:

&#x20; provider\_voice\_id: default\_google\_voice

&#x20; display\_name: Default Voice

&#x20; gender\_label: neutral

&#x20; locale: en-US



voice\_constraints:

&#x20; allow\_unregistered\_voice\_ids: false

&#x20; require\_fallback\_resolution: true

&#x20; preserve\_existing\_agent\_voice\_behavior: true



\---



\## Runtime Policy Controls



runtime\_policy\_enabled: false

runtime\_policy\_mode: log\_only



runtime\_policy\_rules:

&#x20; enforce\_plan\_limits: false

&#x20; enforce\_admin\_overrides: false

&#x20; enforce\_cost\_thresholds: false

&#x20; enforce\_compliance\_checks: true

&#x20; require\_confirmation\_for\_sensitive\_actions: true

&#x20; require\_admin\_approval\_for\_high\_risk\_actions: true



\### Modes

\# off

\# log\_only

\# enforce\_safe\_actions

\# full\_enforcement



\---



\## Usage and Finance Controls



usage\_tracking\_enabled: false

pricing\_registry\_enabled: false

revenue\_margin\_enabled: false

overage\_billing\_enabled: false

finance\_alerts\_enabled: false



usage\_mode: disabled

pricing\_mode: disabled

finance\_mode: disabled



\### Modes

\# disabled

\# shadow

\# active



\---



\## Observability Controls



structured\_logging: true

trace\_ids\_required: true

session\_metrics\_enabled: true

latency\_metrics\_enabled: true

tool\_latency\_metrics\_enabled: true

cost\_metrics\_enabled: false

audit\_logging\_enabled: true



\---



\## Latency and Performance Controls



latency\_target\_ms: 500

p95\_latency\_target\_ms: 700

barge\_in\_target\_ms: 150



performance\_rules:

&#x20; prefer\_binary\_audio\_transport: true

&#x20; avoid\_large\_audio\_buffers: true

&#x20; avoid\_blocking\_gateway\_calls: true

&#x20; prioritize\_first\_audio\_chunk\_latency: true

&#x20; preserve\_gapless\_playback: true

&#x20; stop\_stale\_audio\_on\_barge\_in: true



\---



\## Tool Execution Controls



tool\_execution\_mode: backend\_wrapped\_only

tool\_policy\_mode: pre\_execution\_validation



allowed\_tools:

&#x20; - check\_calendar\_availability

&#x20; - create\_calendar\_event

&#x20; - send\_confirmation\_email

&#x20; - send\_internal\_notification\_email

&#x20; - send\_confirmation\_sms

&#x20; - send\_internal\_alert\_sms

&#x20; - lookup\_contact

&#x20; - handoff\_to\_human



blocked\_tools:

&#x20; - make\_outbound\_call

&#x20; - forward\_call\_to\_number

&#x20; - warm\_transfer\_call

&#x20; - cold\_transfer\_call

&#x20; - bridge\_call

&#x20; - bulk\_sms

&#x20; - bulk\_email

&#x20; - custom\_api\_execution



\---



\## Duplicate Prevention Controls



idempotency\_required\_for\_side\_effects: true

duplicate\_suppression\_enabled: true

duplicate\_window\_seconds: 120



duplicate\_protected\_actions:

&#x20; - create\_calendar\_event

&#x20; - send\_confirmation\_sms

&#x20; - send\_confirmation\_email

&#x20; - make\_outbound\_call

&#x20; - forward\_call\_to\_number



\---



\## Compliance Controls



do\_not\_call\_checks: true

sms\_opt\_in\_checks: true

email\_opt\_in\_checks: true

after\_hours\_policy: true

recording\_consent\_required: true

pii\_sensitive\_action\_logging: true

hipaa\_mode: false



\---



\## Admin and Approval Controls



admin\_override\_enabled: true

approval\_system\_enabled: false

approval\_mode: placeholder\_only



approval\_required\_for:

&#x20; - outbound\_calling

&#x20; - bulk\_sms

&#x20; - bulk\_email

&#x20; - call\_forwarding

&#x20; - live\_transfer

&#x20; - custom\_api\_execution

&#x20; - pricing\_override

&#x20; - overage\_mode\_change



\---



\## Testing and Validation Controls



run\_unit\_tests: true

run\_integration\_tests: true

run\_runtime\_scenario\_tests: true

run\_financial\_tests: false

run\_migration\_tests: true

run\_load\_tests: false



validation\_gate:

&#x20; require\_app\_boot: true

&#x20; require\_core\_voice\_smoke\_test: true

&#x20; require\_no\_critical\_regressions: true



\---



\## Deployment Controls



deployment\_target: local\_docker

allow\_staging\_deploy: false

allow\_production\_deploy: false

allow\_schema\_apply\_in\_prod: false



\---



\## Reporting Controls



require\_phase\_report: true

require\_changed\_files\_summary: true

require\_risk\_summary: true

require\_test\_summary: true

require\_repair\_summary: true

require\_next\_step\_recommendation: true



\---



\## Operator Notes



current\_operator\_intent:

&#x20; - use\_controlled\_phased\_execution

&#x20; - protect\_working\_voice\_prototype

&#x20; - migrate\_to\_gateway\_before\_expanding\_runtime\_policies

&#x20; - keep\_high\_risk\_features\_disabled\_until\_validated



human\_review\_required\_before:

&#x20; - enabling\_outbound\_calling

&#x20; - enabling\_runtime\_policy\_full\_enforcement

&#x20; - enabling\_pricing\_registry\_active\_mode

&#x20; - enabling\_revenue\_margin\_active\_mode

&#x20; - allowing\_production\_cutover



\---



\## Final Directive



Antigravity must treat this file as an active control layer.



When this file conflicts with a broader prompt:

\- prefer safety

\- prefer current system preservation

\- prefer phased execution

\- prefer migration over rewrite



Read this file before major work begins.

Re-read it before each phase transition.

