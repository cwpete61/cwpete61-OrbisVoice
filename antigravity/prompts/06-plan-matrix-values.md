\# OrbisVoice Plan Matrix Values

\## Canonical Entitlement and Limits File



This file defines the exact commercial-to-technical mapping for VoiceAgent subscription tiers.



This file is the source of truth for:

\- plan defaults

\- feature flags

\- hard limits

\- soft limits

\- admin-gated features

\- execution permissions

\- voice configuration permissions

\- workflow complexity permissions



Do not scatter plan logic across the codebase. Centralize all plan definitions here and expose them through the entitlement resolution layer.



\---



\## Global Resolution Rules



\### Resolution Order

Effective entitlements must resolve in this order:



1\. platform hard safety rules

2\. plan defaults

3\. admin overrides

4\. tenant/account overrides

5\. agent-level overrides where permitted

6\. runtime safety checks



A lower layer may not bypass a higher safety rule.



\---



\## Global Feature Categories



\### Usage and Capacity

\- monthly\_conversation\_limit

\- max\_concurrent\_calls

\- max\_locations

\- max\_agents

\- max\_admin\_users

\- max\_standard\_users



\### Channels

\- website\_chat

\- website\_voice\_overlay

\- inbound\_voice

\- outbound\_voice

\- sms

\- email

\- voicemail\_capture

\- live\_transfer

\- multilingual\_support



\### Booking and Scheduling

\- calendar\_read

\- calendar\_write

\- booking

\- rescheduling

\- cancellation

\- meet\_link\_creation



\### Qualification and Workflow

\- ai\_intake

\- lead\_scoring

\- routing\_rules\_basic

\- routing\_rules\_advanced

\- workflow\_builder

\- custom\_automations

\- missed\_call\_text\_back

\- voicemail\_to\_text

\- reminders

\- review\_requests



\### CRM and Integrations

\- crm\_export

\- crm\_integrations

\- webhook\_support

\- api\_access

\- custom\_apis

\- zapier\_support

\- slack\_or\_webhook\_notifications



\### Intelligence and Reporting

\- basic\_analytics

\- realtime\_dashboard

\- advanced\_reporting

\- advanced\_data\_exports

\- revenue\_attribution

\- roi\_dashboard

\- ai\_insights

\- alerts



\### Branding and Multi-Tenant Commercialization

\- white\_label

\- reseller\_access

\- partner\_program

\- custom\_branding

\- custom\_domain



\### Compliance and Governance

\- audit\_trails

\- role\_based\_controls

\- approval\_gates

\- do\_not\_call\_checks

\- sms\_opt\_in\_checks

\- email\_opt\_in\_checks

\- after\_hours\_policy

\- hipaa\_mode

\- pii\_sensitive\_action\_logging



\### Support and Reliability

\- sla\_99\_9

\- priority\_support

\- dedicated\_account\_manager

\- custom\_model\_training

\- rollout\_planning



\### Voice Configuration

\- voice\_selection\_enabled

\- voice\_provider\_google

\- voice\_gender\_switching

\- voice\_preview

\- locale\_switching

\- fallback\_voice\_selection

\- custom\_voice\_defaults



\### Telephony Controls

\- make\_outbound\_call

\- forward\_call\_to\_number

\- warm\_transfer\_call

\- cold\_transfer\_call

\- bridge\_call

\- dial\_staff

\- call\_recording

\- call\_status\_lookup



\### Messaging Controls

\- send\_confirmation\_sms

\- send\_reminder\_sms

\- send\_followup\_sms

\- send\_internal\_alert\_sms

\- send\_confirmation\_email

\- send\_internal\_notification\_email

\- send\_followup\_email

\- schedule\_sms

\- bulk\_sms

\- bulk\_email



\---



\## Global Safety Rules



These actions are always admin-gated, even if the plan allows them:



\- outbound\_voice

\- make\_outbound\_call

\- forward\_call\_to\_number

\- warm\_transfer\_call

\- cold\_transfer\_call

\- bridge\_call

\- bulk\_sms

\- bulk\_email

\- api\_access

\- custom\_apis

\- white\_label

\- custom\_automations

\- custom\_model\_training

\- calendar\_write for shared business calendars

\- advanced\_data\_exports for regulated tenants



These actions must always remain backend-controlled and never directly model-executable:

\- SMS sending

\- email sending

\- calendar writes

\- outbound calling

\- call forwarding

\- call transfer

\- payment or invoice actions

\- admin-level changes



\---



\## Voice Catalog Rules



All tiers with voice enabled must use a provider-backed Google voice catalog.



Each voice record must contain:

\- provider\_name

\- provider\_voice\_id

\- display\_name

\- gender\_label

\- locale

\- sample\_supported

\- active

\- fallback\_voice\_id



Voice availability may be:

\- globally allowed

\- tenant-restricted

\- plan-restricted if configured by admin



If a stored voice becomes invalid:

\- resolve to tenant default voice

\- if tenant default is invalid, resolve to platform fallback voice

\- log voice resolution fallback event



\---



\## Plan Definitions



\# 1. Free



plan\_id: free

plan\_name: Free

plan\_type: recurring

billing\_mode: subscription

status: active



\### Commercial Intent

Use this tier as a demo/evaluation tier.

It must be useful enough to test the system, but constrained enough to protect cost, abuse risk, and support load.



\### Capacity

\- monthly\_conversation\_limit: 100

\- max\_concurrent\_calls: 1

\- max\_locations: 1

\- max\_agents: 1

\- max\_admin\_users: 1

\- max\_standard\_users: 1



\### Channels

\- website\_chat: true

\- website\_voice\_overlay: false

\- inbound\_voice: true

\- outbound\_voice: false

\- sms: false

\- email: true

\- voicemail\_capture: false

\- live\_transfer: false

\- multilingual\_support: false



\### Booking and Scheduling

\- calendar\_read: true

\- calendar\_write: true

\- booking: true

\- rescheduling: false

\- cancellation: false

\- meet\_link\_creation: false



\### Qualification and Workflow

\- ai\_intake: true

\- lead\_scoring: false

\- routing\_rules\_basic: true

\- routing\_rules\_advanced: false

\- workflow\_builder: false

\- custom\_automations: false

\- missed\_call\_text\_back: false

\- voicemail\_to\_text: false

\- reminders: false

\- review\_requests: false



\### CRM and Integrations

\- crm\_export: false

\- crm\_integrations: false

\- webhook\_support: false

\- api\_access: false

\- custom\_apis: false

\- zapier\_support: false

\- slack\_or\_webhook\_notifications: false



\### Intelligence and Reporting

\- basic\_analytics: true

\- realtime\_dashboard: false

\- advanced\_reporting: false

\- advanced\_data\_exports: false

\- revenue\_attribution: false

\- roi\_dashboard: false

\- ai\_insights: false

\- alerts: false



\### Branding and Commercialization

\- white\_label: false

\- reseller\_access: false

\- partner\_program: false

\- custom\_branding: false

\- custom\_domain: false



\### Compliance and Governance

\- audit\_trails: basic

\- role\_based\_controls: false

\- approval\_gates: basic

\- do\_not\_call\_checks: true

\- sms\_opt\_in\_checks: true

\- email\_opt\_in\_checks: true

\- after\_hours\_policy: true

\- hipaa\_mode: false

\- pii\_sensitive\_action\_logging: true



\### Support and Reliability

\- sla\_99\_9: false

\- priority\_support: false

\- dedicated\_account\_manager: false

\- custom\_model\_training: false

\- rollout\_planning: false



\### Voice Configuration

\- voice\_selection\_enabled: true

\- voice\_provider\_google: true

\- voice\_gender\_switching: true

\- voice\_preview: true

\- locale\_switching: false

\- fallback\_voice\_selection: true

\- custom\_voice\_defaults: false



\### Telephony Controls

\- make\_outbound\_call: false

\- forward\_call\_to\_number: false

\- warm\_transfer\_call: false

\- cold\_transfer\_call: false

\- bridge\_call: false

\- dial\_staff: false

\- call\_recording: false

\- call\_status\_lookup: true



\### Messaging Controls

\- send\_confirmation\_sms: false

\- send\_reminder\_sms: false

\- send\_followup\_sms: false

\- send\_internal\_alert\_sms: false

\- send\_confirmation\_email: true

\- send\_internal\_notification\_email: true

\- send\_followup\_email: false

\- schedule\_sms: false

\- bulk\_sms: false

\- bulk\_email: false



\### Notes

\- Free must not allow unlimited cost-generating actions.

\- Free can demonstrate booking and basic inbound handling.

\- Free voice may use a restricted voice subset if desired by platform.



\---



\# 2. LTD



plan\_id: ltd

plan\_name: LTD

plan\_type: one\_time

billing\_mode: lifetime\_plus\_hosting\_terms

status: active



\### Commercial Intent

Lifetime access to core engine with broad feature access, but not necessarily identical to the highest managed-enterprise tier.

LTD should map close to Enterprise-minus or Professional-plus depending on admin policy.

This file defines LTD explicitly to avoid ambiguity.



\### Capacity

\- monthly\_conversation\_limit: 1000

\- max\_concurrent\_calls: 10

\- max\_locations: 999

\- max\_agents: 50

\- max\_admin\_users: 10

\- max\_standard\_users: 50



\### Channels

\- website\_chat: true

\- website\_voice\_overlay: true

\- inbound\_voice: true

\- outbound\_voice: true

\- sms: true

\- email: true

\- voicemail\_capture: true

\- live\_transfer: true

\- multilingual\_support: true



\### Booking and Scheduling

\- calendar\_read: true

\- calendar\_write: true

\- booking: true

\- rescheduling: true

\- cancellation: true

\- meet\_link\_creation: true



\### Qualification and Workflow

\- ai\_intake: true

\- lead\_scoring: true

\- routing\_rules\_basic: true

\- routing\_rules\_advanced: true

\- workflow\_builder: true

\- custom\_automations: true

\- missed\_call\_text\_back: true

\- voicemail\_to\_text: true

\- reminders: true

\- review\_requests: true



\### CRM and Integrations

\- crm\_export: true

\- crm\_integrations: true

\- webhook\_support: true

\- api\_access: true

\- custom\_apis: false

\- zapier\_support: true

\- slack\_or\_webhook\_notifications: true



\### Intelligence and Reporting

\- basic\_analytics: true

\- realtime\_dashboard: true

\- advanced\_reporting: true

\- advanced\_data\_exports: true

\- revenue\_attribution: false

\- roi\_dashboard: false

\- ai\_insights: true

\- alerts: true



\### Branding and Commercialization

\- white\_label: true

\- reseller\_access: true

\- partner\_program: true

\- custom\_branding: true

\- custom\_domain: true



\### Compliance and Governance

\- audit\_trails: advanced

\- role\_based\_controls: true

\- approval\_gates: advanced

\- do\_not\_call\_checks: true

\- sms\_opt\_in\_checks: true

\- email\_opt\_in\_checks: true

\- after\_hours\_policy: true

\- hipaa\_mode: optional\_admin\_enable

\- pii\_sensitive\_action\_logging: true



\### Support and Reliability

\- sla\_99\_9: false

\- priority\_support: true

\- dedicated\_account\_manager: true

\- custom\_model\_training: true

\- rollout\_planning: true



\### Voice Configuration

\- voice\_selection\_enabled: true

\- voice\_provider\_google: true

\- voice\_gender\_switching: true

\- voice\_preview: true

\- locale\_switching: true

\- fallback\_voice\_selection: true

\- custom\_voice\_defaults: true



\### Telephony Controls

\- make\_outbound\_call: admin\_gated\_true

\- forward\_call\_to\_number: admin\_gated\_true

\- warm\_transfer\_call: admin\_gated\_true

\- cold\_transfer\_call: admin\_gated\_true

\- bridge\_call: admin\_gated\_true

\- dial\_staff: true

\- call\_recording: true

\- call\_status\_lookup: true



\### Messaging Controls

\- send\_confirmation\_sms: true

\- send\_reminder\_sms: true

\- send\_followup\_sms: true

\- send\_internal\_alert\_sms: true

\- send\_confirmation\_email: true

\- send\_internal\_notification\_email: true

\- send\_followup\_email: true

\- schedule\_sms: true

\- bulk\_sms: admin\_gated\_true

\- bulk\_email: admin\_gated\_true



\### Notes

\- This tier mirrors the image’s lifetime/core-engine intent.

\- Secondary hosting/location fees should live in billing logic, not entitlement logic, unless operationally required.



\---



\# 3. Starter



plan\_id: starter

plan\_name: Starter

plan\_type: recurring

billing\_mode: subscription

status: active



\### Commercial Intent

Core conversion engine for single-location teams.



\### Capacity

\- monthly\_conversation\_limit: 1000

\- max\_concurrent\_calls: 3

\- max\_locations: 1

\- max\_agents: 3

\- max\_admin\_users: 2

\- max\_standard\_users: 5



\### Channels

\- website\_chat: true

\- website\_voice\_overlay: true

\- inbound\_voice: true

\- outbound\_voice: false

\- sms: true

\- email: true

\- voicemail\_capture: true

\- live\_transfer: false

\- multilingual\_support: false



\### Booking and Scheduling

\- calendar\_read: true

\- calendar\_write: true

\- booking: true

\- rescheduling: true

\- cancellation: true

\- meet\_link\_creation: false



\### Qualification and Workflow

\- ai\_intake: true

\- lead\_scoring: false

\- routing\_rules\_basic: true

\- routing\_rules\_advanced: false

\- workflow\_builder: false

\- custom\_automations: false

\- missed\_call\_text\_back: false

\- voicemail\_to\_text: false

\- reminders: false

\- review\_requests: false



\### CRM and Integrations

\- crm\_export: true

\- crm\_integrations: false

\- webhook\_support: true

\- api\_access: false

\- custom\_apis: false

\- zapier\_support: true

\- slack\_or\_webhook\_notifications: false



\### Intelligence and Reporting

\- basic\_analytics: true

\- realtime\_dashboard: false

\- advanced\_reporting: false

\- advanced\_data\_exports: false

\- revenue\_attribution: false

\- roi\_dashboard: false

\- ai\_insights: true

\- alerts: false



\### Branding and Commercialization

\- white\_label: false

\- reseller\_access: false

\- partner\_program: false

\- custom\_branding: false

\- custom\_domain: false



\### Compliance and Governance

\- audit\_trails: standard

\- role\_based\_controls: false

\- approval\_gates: standard

\- do\_not\_call\_checks: true

\- sms\_opt\_in\_checks: true

\- email\_opt\_in\_checks: true

\- after\_hours\_policy: true

\- hipaa\_mode: false

\- pii\_sensitive\_action\_logging: true



\### Support and Reliability

\- sla\_99\_9: false

\- priority\_support: false

\- dedicated\_account\_manager: false

\- custom\_model\_training: false

\- rollout\_planning: false



\### Voice Configuration

\- voice\_selection\_enabled: true

\- voice\_provider\_google: true

\- voice\_gender\_switching: true

\- voice\_preview: true

\- locale\_switching: false

\- fallback\_voice\_selection: true

\- custom\_voice\_defaults: false



\### Telephony Controls

\- make\_outbound\_call: false

\- forward\_call\_to\_number: false

\- warm\_transfer\_call: false

\- cold\_transfer\_call: false

\- bridge\_call: false

\- dial\_staff: false

\- call\_recording: true

\- call\_status\_lookup: true



\### Messaging Controls

\- send\_confirmation\_sms: true

\- send\_reminder\_sms: false

\- send\_followup\_sms: false

\- send\_internal\_alert\_sms: true

\- send\_confirmation\_email: true

\- send\_internal\_notification\_email: true

\- send\_followup\_email: false

\- schedule\_sms: false

\- bulk\_sms: false

\- bulk\_email: false



\### Notes

Aligned to image:

\- website overlay chat + qualification

\- email/SMS capture with verification

\- caller ID capture with AI qualification

\- booking + owner notifications

\- CRM export

\- call recording + transcription

\- basic analytics for 1 location

\- mobile app access may be handled in app policy, not core entitlement engine



\---



\# 4. Professional



plan\_id: professional

plan\_name: Professional

plan\_type: recurring

billing\_mode: subscription

status: active



\### Commercial Intent

AI qualification and revenue acceleration for growing teams.



\### Capacity

\- monthly\_conversation\_limit: 10000

\- max\_concurrent\_calls: 50

\- max\_locations: 3

\- max\_agents: 15

\- max\_admin\_users: 5

\- max\_standard\_users: 20



\### Channels

\- website\_chat: true

\- website\_voice\_overlay: true

\- inbound\_voice: true

\- outbound\_voice: true\_admin\_gated

\- sms: true

\- email: true

\- voicemail\_capture: true

\- live\_transfer: false

\- multilingual\_support: false



\### Booking and Scheduling

\- calendar\_read: true

\- calendar\_write: true

\- booking: true

\- rescheduling: true

\- cancellation: true

\- meet\_link\_creation: true



\### Qualification and Workflow

\- ai\_intake: true

\- lead\_scoring: true

\- routing\_rules\_basic: true

\- routing\_rules\_advanced: true

\- workflow\_builder: false

\- custom\_automations: true

\- missed\_call\_text\_back: true

\- voicemail\_to\_text: true

\- reminders: true

\- review\_requests: true



\### CRM and Integrations

\- crm\_export: true

\- crm\_integrations: true

\- webhook\_support: true

\- api\_access: false

\- custom\_apis: false

\- zapier\_support: true

\- slack\_or\_webhook\_notifications: true



\### Intelligence and Reporting

\- basic\_analytics: true

\- realtime\_dashboard: true

\- advanced\_reporting: false

\- advanced\_data\_exports: false

\- revenue\_attribution: false

\- roi\_dashboard: false

\- ai\_insights: true

\- alerts: true



\### Branding and Commercialization

\- white\_label: false

\- reseller\_access: false

\- partner\_program: false

\- custom\_branding: partial

\- custom\_domain: false



\### Compliance and Governance

\- audit\_trails: advanced

\- role\_based\_controls: true

\- approval\_gates: advanced

\- do\_not\_call\_checks: true

\- sms\_opt\_in\_checks: true

\- email\_opt\_in\_checks: true

\- after\_hours\_policy: true

\- hipaa\_mode: optional\_admin\_enable

\- pii\_sensitive\_action\_logging: true



\### Support and Reliability

\- sla\_99\_9: false

\- priority\_support: false

\- dedicated\_account\_manager: false

\- custom\_model\_training: false

\- rollout\_planning: false



\### Voice Configuration

\- voice\_selection\_enabled: true

\- voice\_provider\_google: true

\- voice\_gender\_switching: true

\- voice\_preview: true

\- locale\_switching: false

\- fallback\_voice\_selection: true

\- custom\_voice\_defaults: true



\### Telephony Controls

\- make\_outbound\_call: admin\_gated\_true

\- forward\_call\_to\_number: false

\- warm\_transfer\_call: false

\- cold\_transfer\_call: false

\- bridge\_call: false

\- dial\_staff: true

\- call\_recording: true

\- call\_status\_lookup: true



\### Messaging Controls

\- send\_confirmation\_sms: true

\- send\_reminder\_sms: true

\- send\_followup\_sms: true

\- send\_internal\_alert\_sms: true

\- send\_confirmation\_email: true

\- send\_internal\_notification\_email: true

\- send\_followup\_email: true

\- schedule\_sms: true

\- bulk\_sms: false

\- bulk\_email: false



\### Notes

Aligned to image:

\- AI intake, lead scoring, routing

\- automated follow-up sequences

\- missed-call text-back

\- reminders and reviews

\- CRM integrations up to 3 locations

\- realtime dashboard and alerts

\- voicemail-to-text

\- unlimited custom routing rules

\- up to 50 concurrent calls



\---



\# 5. Enterprise



plan\_id: enterprise

plan\_name: Enterprise

plan\_type: recurring

billing\_mode: subscription

status: active



\### Commercial Intent

Multi-location revenue infrastructure.



\### Capacity

\- monthly\_conversation\_limit: 100000

\- max\_concurrent\_calls: 250

\- max\_locations: 999

\- max\_agents: 100

\- max\_admin\_users: 20

\- max\_standard\_users: 200



\### Channels

\- website\_chat: true

\- website\_voice\_overlay: true

\- inbound\_voice: true

\- outbound\_voice: true

\- sms: true

\- email: true

\- voicemail\_capture: true

\- live\_transfer: true

\- multilingual\_support: true



\### Booking and Scheduling

\- calendar\_read: true

\- calendar\_write: true

\- booking: true

\- rescheduling: true

\- cancellation: true

\- meet\_link\_creation: true



\### Qualification and Workflow

\- ai\_intake: true

\- lead\_scoring: true

\- routing\_rules\_basic: true

\- routing\_rules\_advanced: true

\- workflow\_builder: true

\- custom\_automations: true

\- missed\_call\_text\_back: true

\- voicemail\_to\_text: true

\- reminders: true

\- review\_requests: true



\### CRM and Integrations

\- crm\_export: true

\- crm\_integrations: true

\- webhook\_support: true

\- api\_access: true

\- custom\_apis: false

\- zapier\_support: true

\- slack\_or\_webhook\_notifications: true



\### Intelligence and Reporting

\- basic\_analytics: true

\- realtime\_dashboard: true

\- advanced\_reporting: true

\- advanced\_data\_exports: true

\- revenue\_attribution: false

\- roi\_dashboard: false

\- ai\_insights: true

\- alerts: true



\### Branding and Commercialization

\- white\_label: true

\- reseller\_access: false

\- partner\_program: false

\- custom\_branding: true

\- custom\_domain: true



\### Compliance and Governance

\- audit\_trails: enterprise

\- role\_based\_controls: true

\- approval\_gates: enterprise

\- do\_not\_call\_checks: true

\- sms\_opt\_in\_checks: true

\- email\_opt\_in\_checks: true

\- after\_hours\_policy: true

\- hipaa\_mode: optional\_admin\_enable

\- pii\_sensitive\_action\_logging: true



\### Support and Reliability

\- sla\_99\_9: true

\- priority\_support: true

\- dedicated\_account\_manager: true

\- custom\_model\_training: false

\- rollout\_planning: true



\### Voice Configuration

\- voice\_selection\_enabled: true

\- voice\_provider\_google: true

\- voice\_gender\_switching: true

\- voice\_preview: true

\- locale\_switching: true

\- fallback\_voice\_selection: true

\- custom\_voice\_defaults: true



\### Telephony Controls

\- make\_outbound\_call: admin\_gated\_true

\- forward\_call\_to\_number: admin\_gated\_true

\- warm\_transfer\_call: admin\_gated\_true

\- cold\_transfer\_call: admin\_gated\_true

\- bridge\_call: admin\_gated\_true

\- dial\_staff: true

\- call\_recording: true

\- call\_status\_lookup: true



\### Messaging Controls

\- send\_confirmation\_sms: true

\- send\_reminder\_sms: true

\- send\_followup\_sms: true

\- send\_internal\_alert\_sms: true

\- send\_confirmation\_email: true

\- send\_internal\_notification\_email: true

\- send\_followup\_email: true

\- schedule\_sms: true

\- bulk\_sms: admin\_gated\_true

\- bulk\_email: admin\_gated\_true



\### Notes

Aligned to image:

\- voice AI coverage + live transfer

\- location-based routing and analytics

\- API access + compliance controls

\- dedicated support + 99.9% uptime SLA

\- unlimited locations + concurrent calls in commercial copy; operationally set high or configurable

\- custom workflows and automation builder

\- advanced reporting + exports

\- white-label

\- multilingual support



\---



\# 6. AI Revenue Infrastructure



plan\_id: ai\_revenue\_infrastructure

plan\_name: AI Revenue Infrastructure

plan\_type: recurring

billing\_mode: subscription

status: active



\### Commercial Intent

AI operations command layer for revenue control.

This is the highest managed-operating tier.



\### Capacity

\- monthly\_conversation\_limit: 250000

\- max\_concurrent\_calls: 1000

\- max\_locations: 9999

\- max\_agents: 500

\- max\_admin\_users: 100

\- max\_standard\_users: 1000



\### Channels

\- website\_chat: true

\- website\_voice\_overlay: true

\- inbound\_voice: true

\- outbound\_voice: true

\- sms: true

\- email: true

\- voicemail\_capture: true

\- live\_transfer: true

\- multilingual\_support: true



\### Booking and Scheduling

\- calendar\_read: true

\- calendar\_write: true

\- booking: true

\- rescheduling: true

\- cancellation: true

\- meet\_link\_creation: true



\### Qualification and Workflow

\- ai\_intake: true

\- lead\_scoring: true

\- routing\_rules\_basic: true

\- routing\_rules\_advanced: true

\- workflow\_builder: true

\- custom\_automations: true

\- missed\_call\_text\_back: true

\- voicemail\_to\_text: true

\- reminders: true

\- review\_requests: true



\### CRM and Integrations

\- crm\_export: true

\- crm\_integrations: true

\- webhook\_support: true

\- api\_access: true

\- custom\_apis: true

\- zapier\_support: true

\- slack\_or\_webhook\_notifications: true



\### Intelligence and Reporting

\- basic\_analytics: true

\- realtime\_dashboard: true

\- advanced\_reporting: true

\- advanced\_data\_exports: true

\- revenue\_attribution: true

\- roi\_dashboard: true

\- ai\_insights: true

\- alerts: true



\### Branding and Commercialization

\- white\_label: true

\- reseller\_access: true

\- partner\_program: true

\- custom\_branding: true

\- custom\_domain: true



\### Compliance and Governance

\- audit\_trails: enterprise\_plus

\- role\_based\_controls: true

\- approval\_gates: enterprise\_plus

\- do\_not\_call\_checks: true

\- sms\_opt\_in\_checks: true

\- email\_opt\_in\_checks: true

\- after\_hours\_policy: true

\- hipaa\_mode: optional\_admin\_enable

\- pii\_sensitive\_action\_logging: true



\### Support and Reliability

\- sla\_99\_9: true

\- priority\_support: true

\- dedicated\_account\_manager: true

\- custom\_model\_training: true

\- rollout\_planning: true



\### Voice Configuration

\- voice\_selection\_enabled: true

\- voice\_provider\_google: true

\- voice\_gender\_switching: true

\- voice\_preview: true

\- locale\_switching: true

\- fallback\_voice\_selection: true

\- custom\_voice\_defaults: true



\### Telephony Controls

\- make\_outbound\_call: admin\_gated\_true

\- forward\_call\_to\_number: admin\_gated\_true

\- warm\_transfer\_call: admin\_gated\_true

\- cold\_transfer\_call: admin\_gated\_true

\- bridge\_call: admin\_gated\_true

\- dial\_staff: true

\- call\_recording: true

\- call\_status\_lookup: true



\### Messaging Controls

\- send\_confirmation\_sms: true

\- send\_reminder\_sms: true

\- send\_followup\_sms: true

\- send\_internal\_alert\_sms: true

\- send\_confirmation\_email: true

\- send\_internal\_notification\_email: true

\- send\_followup\_email: true

\- schedule\_sms: true

\- bulk\_sms: admin\_gated\_true

\- bulk\_email: admin\_gated\_true



\### Notes

Aligned to image:

\- 24/7 AI voice + chat operations

\- revenue attribution + ROI dashboard

\- pipeline reactivation + opportunity recovery

\- compliance and role-based controls

\- dedicated account team

\- custom AI model training

\- priority support + fast response

\- reseller/partner programs

\- advanced integrations + custom APIs



\---



\## Admin Override Rules



Admins must be able to override these classes of settings:



\### Safe-to-Relax With Audit

\- conversation limits

\- user limits

\- agent limits

\- location limits

\- analytics depth

\- retention windows

\- voice defaults

\- locale availability

\- dashboard visibility



\### Allowed Only With Explicit Admin Enablement

\- outbound\_voice

\- make\_outbound\_call

\- forward\_call\_to\_number

\- warm\_transfer\_call

\- cold\_transfer\_call

\- bridge\_call

\- bulk\_sms

\- bulk\_email

\- api\_access

\- custom\_apis

\- white\_label

\- custom\_automations

\- call\_recording

\- hipaa\_mode



\### Never Override Above Platform Safety Rules

\- do\_not\_call\_checks

\- sms\_opt\_in\_checks

\- email\_opt\_in\_checks

\- pii\_sensitive\_action\_logging

\- backend approval boundary for sensitive actions



\---



\## Agent-Level Override Rules



Agent-level overrides are allowed only for:

\- selected\_voice\_id

\- selected\_voice\_label

\- locale

\- enabled\_channels subset

\- enabled\_tools subset

\- workflow\_mode

\- greeting\_mode

\- transfer\_target presets

\- recording\_enabled if plan and admin allow

\- reminders enabled if plan and admin allow



Agent-level overrides may never:

\- exceed plan conversation limits

\- unlock disallowed telephony

\- unlock API access

\- unlock white-label

\- unlock bulk messaging

\- bypass compliance controls



\---



\## Required Derived States



The entitlement service must expose:

\- feature\_allowed

\- feature\_visible

\- feature\_configurable

\- feature\_executable

\- limit\_value

\- denial\_reason

\- override\_source

\- requires\_admin\_approval

\- requires\_runtime\_confirmation



\---



\## Required Runtime Confirmation Flags



Even if executable, these actions should support runtime confirmation:

\- create calendar event

\- reschedule event

\- cancel event

\- send confirmation SMS

\- send confirmation email

\- make outbound call

\- forward or transfer live call

\- start call recording if consent flow applies



\---



\## Test Matrix Requirements



Tests must verify:

\- each plan default

\- override precedence

\- plan downgrade behavior

\- plan upgrade behavior

\- blocked execution for disallowed features

\- UI visibility vs backend enforcement consistency

\- agent-level override restrictions

\- voice resolution fallback behavior

\- existing tenant migration defaults

\- sensitive action admin gating



\---



\## Migration Defaults



For existing tenants with no plan assignment:

\- default to starter only if billing/product logic confirms starter equivalent

\- otherwise default to free-safe behavior and require admin review



For existing agents with no voice selection:

\- assign tenant default voice

\- if tenant default missing, assign platform fallback voice



For existing workflows with unrestricted steps:

\- preserve behavior only where plan allows it

\- otherwise insert denial + fallback path instead of silent failure



\---



\## Implementation Notes



Do not encode this file as display-only marketing text.

Translate it into:

\- typed configuration objects

\- schema-backed plan definitions

\- audited override tables

\- enforceable backend policy

\- UI-driven feature rendering metadata



This file is the commercial contract translated into system behavior.

