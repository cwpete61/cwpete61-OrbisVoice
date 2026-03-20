\# Tier Entitlements Specification

\## Machine-Readable Product and Capability Model



You are responsible for defining a formal entitlement matrix for VoiceAgent subscriptions and admin-controlled feature access.



Do not implement tier behavior as scattered conditionals only. Create or improve a central entitlement registry and effective-permission resolution layer.



\---



\## Required Tiers



\- Free

\- LTD

\- Starter

\- Professional

\- Enterprise

\- AI Revenue Infrastructure



\---



\## Entitlement Model Requirements



The system must support these resolution layers:



1\. plan default entitlements

2\. admin overrides at platform level

3\. tenant/account overrides

4\. per-agent overrides where permitted

5\. final effective entitlement resolution



The system must expose deterministic answers such as:

\- is feature allowed

\- is feature visible

\- is feature configurable

\- is feature executable

\- what limit applies

\- what override source granted or blocked it



\---



\## Required Capability Domains



\### A. Subscription and Usage

\- monthly\_conversation\_limit

\- max\_concurrent\_calls

\- max\_locations

\- max\_agents

\- max\_users

\- storage\_retention\_days

\- analytics\_retention\_days



\### B. Channels

\- website\_chat

\- website\_voice\_overlay

\- inbound\_voice

\- outbound\_voice

\- sms

\- email

\- voicemail

\- live\_transfer

\- multilingual\_support



\### C. Scheduling

\- calendar\_read

\- calendar\_write

\- booking

\- rescheduling

\- cancellation

\- meet\_link\_creation



\### D. Qualification and Workflow

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



\### E. CRM and Integrations

\- crm\_export

\- crm\_integrations

\- webhook\_support

\- api\_access

\- custom\_apis

\- slack\_or\_webhook\_notifications

\- zapier\_support



\### F. Intelligence and Analytics

\- basic\_analytics

\- realtime\_dashboard

\- advanced\_reporting

\- revenue\_attribution

\- roi\_dashboard

\- alerts

\- transcript\_summary

\- ai\_insights



\### G. Branding and Deployment

\- white\_label

\- reseller\_access

\- partner\_program

\- custom\_domain

\- custom\_branding



\### H. Compliance and Governance

\- audit\_trails

\- role\_based\_controls

\- approval\_gates

\- do\_not\_call\_checks

\- sms\_opt\_in\_checks

\- email\_opt\_in\_checks

\- after\_hours\_policy

\- hipaa\_mode

\- pii\_sensitive\_action\_logging



\### I. Support and Reliability

\- sla\_99\_9

\- priority\_support

\- dedicated\_account\_manager

\- custom\_model\_training

\- rollout\_planning



\### J. Voice Configuration

\- voice\_selection\_enabled

\- voice\_provider\_google

\- voice\_gender\_switching

\- voice\_preview

\- locale\_switching

\- custom\_voice\_defaults



\---



\## Plan Intent by Tier



\### Free

Use as limited evaluation/demo tier.

Typical intent:

\- strict conversation cap

\- minimal channels

\- limited analytics

\- no advanced telephony

\- no advanced automations

\- no CRM integrations

\- no white-label

\- no advanced compliance controls beyond minimum safety



\### LTD

Treat as special billing plan with broad entitlement mapping defined explicitly by product rules.

Do not hardcode LTD as “all access” unless specified.

Allow admin-defined hosting and support constraints.



\### Starter

Supports single-location conversion engine basics.

Should cover:

\- website chat/overlay where applicable

\- qualification flows

\- email/SMS capture

\- caller data capture

\- booking basics

\- internal notifications

\- basic analytics

\- mobile/app access if applicable

\- low concurrency and low location count



\### Professional

Supports AI qualification and revenue acceleration.

Should cover:

\- AI intake

\- lead scoring

\- follow-up sequences

\- missed-call text-back

\- reminders/reviews

\- CRM integrations

\- realtime dashboard/alerts

\- voicemail-to-text

\- more advanced routing

\- higher concurrency



\### Enterprise

Supports multi-location revenue infrastructure.

Should cover:

\- voice AI coverage

\- live transfer

\- location-based routing

\- advanced analytics/export

\- API access

\- compliance controls

\- higher concurrency

\- custom workflows

\- white-label

\- multilingual support

\- stronger support/SLA



\### AI Revenue Infrastructure

Supports high-control operations tier.

Should cover:

\- 24/7 AI voice and chat operations

\- revenue attribution

\- ROI dashboard

\- reactivation workflows

\- opportunity recovery

\- full role-based controls

\- advanced integrations/custom APIs

\- custom model training

\- dedicated support structure

\- high or custom concurrency



\---



\## Implementation Requirements



Create or improve:

\- central plan registry

\- feature enum/registry

\- typed entitlement schema

\- effective resolution service

\- limit resolution service

\- audit logging for entitlement decisions

\- blocked action responses

\- admin override schema

\- tenant plan assignment model

\- migration/backfill for existing tenants and agents



\---



\## Required Behavior



The entitlement system must:

\- fail closed for sensitive features

\- expose human-readable denial reasons

\- support structured audit metadata

\- support future plan additions without code sprawl

\- support UI rendering from entitlement metadata

\- support backend enforcement, not just frontend hiding



\---



\## Voice Configuration Rules



Each agent may select from allowed Google voices.

Support:

\- male/female presentation label

\- provider voice id

\- locale

\- fallback voice

\- plan-based availability if needed

\- admin restriction by tenant if needed



Do not hardcode voice choices in scattered UI logic. Use a central provider-backed voice catalog and an entitlement-aware selector.



\---



\## Test Requirements



Create tests for:

\- default plan entitlements

\- override precedence

\- blocked feature behavior

\- effective limit calculation

\- backward compatibility for existing tenants

\- admin toggle correctness

\- per-agent voice selection permissions

\- execution blocking for disallowed actions

