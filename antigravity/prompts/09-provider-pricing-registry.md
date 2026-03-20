\# Provider Pricing Registry

\## Canonical Cost and Price Configuration for AI, Telephony, Messaging, Storage, and Overage Billing



You are responsible for designing and implementing a central pricing registry for the VoiceAgent platform.



This registry must act as the authoritative source for:



\- provider cost inputs

\- internal markup rules

\- plan-specific included usage

\- plan-specific overage pricing

\- tenant-specific custom pricing

\- grandfathered pricing

\- promotional pricing

\- effective-date versioning

\- historical pricing preservation



Do not hardcode provider rates in business logic, workflow logic, usage services, finance services, or UI code.



All pricing and cost-sensitive calculations must resolve through this registry.



\---



\## Primary Objective



Build a pricing system that allows the platform to answer:



\- what did a provider interaction cost at the time it occurred

\- what price should the tenant be billed for included or overage usage

\- what pricing version applied to a given session, event, or invoice period

\- what markup or discount rules applied

\- how historical financial reports remain stable after pricing changes

\- how tenant-specific contracts override default plan rules safely



\---



\## Pricing Domains



The registry must support these pricing domains:



\### A. AI Model Provider Costs

Track internal provider costs for:

\- audio\_input\_tokens

\- audio\_output\_tokens

\- text\_input\_tokens

\- text\_output\_tokens

\- cached\_input\_tokens if applicable

\- reasoning\_tokens if provider differentiates them

\- streaming session minimums if applicable



\### B. Telephony Provider Costs

Track internal provider costs for:

\- inbound\_call\_minutes

\- outbound\_call\_minutes

\- forwarded\_call\_minutes

\- transferred\_call\_minutes

\- call\_recording\_minutes

\- call\_recording\_storage

\- phone\_number\_rental

\- SIP or media stream costs if applicable



\### C. Messaging Provider Costs

Track internal provider costs for:

\- sms\_sent

\- sms\_received

\- mms\_sent

\- mms\_received

\- message\_status\_lookup if billable

\- scheduled\_message\_execution if billable



\### D. Email Provider Costs

Track internal provider costs for:

\- email\_sent

\- premium\_template\_rendering if applicable

\- validation lookups if billable



\### E. Storage and Media Costs

Track internal provider costs for:

\- recording\_storage\_gb

\- transcript\_storage\_gb

\- general\_blob\_storage\_gb

\- archival\_storage\_gb

\- retrieval\_operations if billable



\### F. Processing and Infrastructure Costs

Track internal platform costs for:

\- transcription\_processing

\- session\_compute

\- background\_job\_compute

\- vector\_storage

\- vector\_query

\- observability allocation

\- support allocation if modeled



\### G. Plan Commercial Pricing

Track customer-facing prices for:

\- base\_plan\_price

\- add\_on\_price

\- overage\_price

\- setup\_fee

\- onboarding\_fee

\- premium feature price

\- custom enterprise contract price



\---



\## Pricing Registry Principles



1\. Provider cost and customer price are not the same thing.

2\. Historical events must preserve the pricing version used at the time.

3\. Tenant-specific contracts may override plan defaults.

4\. Promotions and grandfathered pricing must be versioned.

5\. Plan overage pricing must not be embedded in generic provider-cost logic.

6\. Registry resolution must be deterministic and auditable.

7\. Pricing changes must be effective-date based, not destructive overwrites.



\---



\## Required Entities



Create or extend these core entities.



\### pricing\_provider

Fields:

\- id

\- provider\_name

\- provider\_type

\- active

\- metadata\_json

\- created\_at

\- updated\_at



Examples:

\- google\_gemini

\- twilio\_voice

\- twilio\_messaging

\- sendgrid

\- smtp\_internal

\- cloud\_storage\_primary

\- internal\_compute



\---



\### pricing\_metric

Fields:

\- id

\- metric\_key

\- metric\_name

\- unit\_type

\- category

\- description

\- active

\- metadata\_json



Examples of metric\_key:

\- ai.audio\_input\_token

\- ai.audio\_output\_token

\- ai.text\_input\_token

\- ai.text\_output\_token

\- voice.inbound\_minute

\- voice.outbound\_minute

\- voice.forwarded\_minute

\- voice.recording\_minute

\- messaging.sms\_sent

\- messaging.sms\_received

\- email.sent

\- storage.recording\_gb\_month

\- infra.session\_compute



Unit types may include:

\- token

\- minute

\- message

\- email

\- gb\_month

\- session

\- user

\- location



\---



\### provider\_cost\_version

Fields:

\- id

\- provider\_id

\- version\_name

\- effective\_start\_at

\- effective\_end\_at

\- currency

\- status

\- notes\_json

\- created\_at

\- updated\_at



This entity represents a dated pricing version from a provider or internal cost model.



\---



\### provider\_cost\_rate

Fields:

\- id

\- cost\_version\_id

\- metric\_id

\- unit\_cost

\- unit\_quantity

\- pricing\_formula\_type

\- minimum\_charge

\- rounding\_rule

\- metadata\_json



Examples:

\- audio input token cost per 1,000,000 tokens

\- outbound minute cost per minute

\- SMS sent cost per message



Use:

\- unit\_cost

\- unit\_quantity



Example:

\- unit\_cost: 0.30

\- unit\_quantity: 1000000

\- metric: ai.audio\_input\_token



\---



\### plan\_price\_version

Fields:

\- id

\- plan\_id

\- version\_name

\- effective\_start\_at

\- effective\_end\_at

\- currency

\- billing\_cycle

\- active

\- metadata\_json



\---



\### plan\_base\_price

Fields:

\- id

\- plan\_price\_version\_id

\- recurring\_price

\- annual\_price

\- setup\_fee

\- onboarding\_fee

\- included\_notes\_json



\---



\### plan\_included\_usage

Fields:

\- id

\- plan\_price\_version\_id

\- metric\_id

\- included\_units

\- hard\_cap\_units

\- warn\_at\_percent

\- overage\_mode

\- metadata\_json



Supported overage\_mode values:

\- warn\_only

\- bill\_overage

\- hard\_cap

\- admin\_review



\---



\### plan\_overage\_rate

Fields:

\- id

\- plan\_price\_version\_id

\- metric\_id

\- overage\_unit\_price

\- overage\_unit\_quantity

\- rounding\_rule

\- metadata\_json



Example:

\- metric: voice.outbound\_minute

\- overage\_unit\_price: 0.12

\- overage\_unit\_quantity: 1



\---



\### add\_on\_price\_version

Fields:

\- id

\- add\_on\_key

\- version\_name

\- effective\_start\_at

\- effective\_end\_at

\- currency

\- active

\- metadata\_json



\---



\### add\_on\_price\_rate

Fields:

\- id

\- add\_on\_price\_version\_id

\- metric\_id\_or\_null

\- recurring\_price

\- one\_time\_price

\- unit\_price

\- unit\_quantity

\- metadata\_json



Examples:

\- extra location

\- extra agent

\- multilingual pack

\- priority support

\- white-label

\- extra concurrency pack



\---



\### tenant\_pricing\_override

Fields:

\- id

\- tenant\_id

\- override\_scope

\- related\_plan\_id\_or\_null

\- related\_metric\_id\_or\_null

\- related\_add\_on\_key\_or\_null

\- override\_type

\- override\_value\_json

\- effective\_start\_at

\- effective\_end\_at

\- approved\_by

\- notes\_json



Use this for:

\- custom enterprise contracts

\- grandfathered pricing

\- negotiated overage rates

\- waived setup fees

\- custom included usage



\---



\### promotion\_rule

Fields:

\- id

\- promotion\_code\_or\_key

\- applies\_to\_scope

\- related\_plan\_id\_or\_null

\- related\_metric\_id\_or\_null

\- discount\_type

\- discount\_value

\- effective\_start\_at

\- effective\_end\_at

\- usage\_limit\_or\_null

\- active

\- metadata\_json



\---



\### pricing\_resolution\_audit

Fields:

\- id

\- tenant\_id

\- plan\_id

\- session\_id\_or\_null

\- usage\_event\_id\_or\_null

\- invoice\_period\_or\_null

\- metric\_id

\- provider\_cost\_version\_id\_or\_null

\- plan\_price\_version\_id\_or\_null

\- tenant\_override\_id\_or\_null

\- promotion\_rule\_id\_or\_null

\- resolved\_cost\_per\_unit

\- resolved\_price\_per\_unit

\- resolution\_source\_json

\- timestamp



This allows full financial traceability.



\---



\## Required Resolution Services



Build these deterministic services.



\### 1. Provider Cost Resolver

Input:

\- provider\_name

\- metric\_key

\- event\_timestamp

\- tenant\_context\_optional



Output:

\- applicable provider cost version

\- resolved unit cost

\- rounding rules

\- minimum charge if any



Rules:

\- choose pricing version active at event timestamp

\- preserve historical version integrity

\- allow tenant-specific provider pass-through rules only if explicitly supported



\---



\### 2. Plan Price Resolver

Input:

\- tenant\_id

\- plan\_id

\- metric\_key

\- event\_timestamp

\- billing\_context



Output:

\- base plan pricing version

\- included usage amount

\- overage mode

\- overage price if applicable

\- applicable overrides

\- applicable promotions



Rules:

\- resolve tenant override first where applicable

\- otherwise use active plan price version

\- attach source metadata for audit



\---



\### 3. Add-On Resolver

Input:

\- tenant\_id

\- add\_on\_key

\- event\_timestamp



Output:

\- effective add-on price version

\- quantity pricing

\- recurring vs one-time behavior



\---



\### 4. Effective Pricing Resolver

Input:

\- tenant\_id

\- plan\_id

\- metric\_key

\- event\_timestamp

\- usage\_context



Output:

\- provider unit cost

\- customer unit price

\- included usage details

\- remaining included units if available

\- overage rate if triggered

\- effective source chain

\- currency

\- final resolution audit payload



This is the canonical resolver for usage and finance layers.



\---



\## Required Metric Catalog



The system must support at least these metrics.



\### AI Metrics

\- ai.audio\_input\_token

\- ai.audio\_output\_token

\- ai.text\_input\_token

\- ai.text\_output\_token



\### Voice Metrics

\- voice.inbound\_minute

\- voice.outbound\_minute

\- voice.forwarded\_minute

\- voice.transferred\_minute

\- voice.recording\_minute

\- voice.active\_call

\- voice.concurrent\_call



\### Messaging Metrics

\- messaging.sms\_sent

\- messaging.sms\_received

\- messaging.mms\_sent

\- messaging.mms\_received



\### Email Metrics

\- email.sent



\### Storage Metrics

\- storage.recording\_gb\_month

\- storage.transcript\_gb\_month

\- storage.blob\_gb\_month



\### Workflow and Platform Metrics

\- workflow.session

\- workflow.tool\_call

\- workflow.booking\_event

\- infra.session\_compute

\- infra.background\_job

\- infra.vector\_storage

\- infra.vector\_query



\### Commercial Metrics

\- addon.extra\_location

\- addon.extra\_agent

\- addon.extra\_concurrency\_pack

\- addon.multilingual\_pack

\- addon.white\_label

\- addon.priority\_support

\- addon.advanced\_analytics

\- addon.api\_access

\- addon.custom\_automation



\---



\## Formula Support



The registry must support pricing formulas beyond simple unit multiplication.



Support at least:



\- flat\_per\_unit

\- per\_block

\- tiered\_blocks

\- included\_then\_overage

\- minimum\_charge\_plus\_unit

\- percentage\_markup\_over\_cost

\- custom\_formula\_hook



Examples:

\- AI cost per million tokens

\- SMS cost per message

\- concurrency add-on sold in packs of 10

\- storage billed by GB-month

\- outbound minute billed after included pool exhausted

\- enterprise price as custom contract hook



Do not assume all metrics use identical formulas.



\---



\## Rounding Rules



Support configurable rounding such as:

\- exact\_fractional

\- ceil\_to\_whole\_unit

\- ceil\_to\_block

\- floor\_to\_whole\_unit

\- banker\_round\_currency

\- standard\_currency\_round



Examples:

\- telephony minutes may be ceil to minute depending on provider or billing policy

\- SMS is integer count

\- token costs may remain fractional until currency rollup



\---



\## Currency and Regional Support



Support:

\- currency code

\- future multi-currency compatibility

\- regional pricing if needed

\- regional provider cost differences if applicable



At minimum:

\- preserve currency on every pricing version

\- prevent mixing currencies in a single unresolved calculation without conversion rules



If multi-currency is not yet active, build the model to allow it later without major refactor.



\---



\## Historical Integrity Requirements



Never overwrite historical pricing records destructively.



If prices change:

\- create a new version

\- close the prior version with effective\_end\_at

\- resolve future events against the new version

\- preserve old events against old versions



Historical reporting must remain stable after price changes.



\---



\## Default Pricing Seed Requirements



Seed the registry with initial values for:



\### Provider Costs

\- Gemini token costs

\- Twilio voice minute costs

\- Twilio SMS costs

\- email provider cost estimate

\- storage cost assumptions

\- session compute allocation assumptions



\### Plan Commercial Prices

\- Free

\- LTD

\- Starter

\- Professional

\- Enterprise

\- AI Revenue Infrastructure



\### Included Usage Rules

\- monthly conversation inclusion

\- outbound minute inclusion if any

\- SMS inclusion if any

\- storage inclusion if any

\- concurrency inclusion



\### Overage Rates

\- conversations

\- outbound minutes

\- SMS

\- extra locations

\- extra agents

\- extra concurrency

\- custom API usage if applicable



If exact commercial values are not yet finalized, seed with placeholders clearly marked as requiring admin or finance confirmation.



\---



\## Contract and Override Handling



Support custom enterprise and negotiated pricing.



Override types must include:

\- base plan replacement

\- included usage replacement

\- overage rate replacement

\- add-on discount

\- setup fee waiver

\- grandfathered version lock

\- promotional discount

\- billing grace rule



Overrides must:

\- be time-bounded where appropriate

\- record approver identity

\- log rationale

\- preserve auditability

\- never bypass platform safety rules



\---



\## Free and LTD Special Rules



\### Free

Support:

\- zero recurring price or promotional price

\- strict included usage

\- hard cap or warn-only mode by metric

\- abuse ceiling rules

\- internal cost visibility for margin analysis



\### LTD

Support:

\- one-time sale value tracking if used

\- zero recurring base price if applicable

\- ongoing support and hosting cost tracking

\- optional analytical amortization views

\- grandfathered feature pricing

\- custom usage envelope rules



Do not force LTD into recurring-subscription-only assumptions.



\---



\## AI Revenue Infrastructure Rules



Support:

\- custom contract pricing

\- managed-service fees

\- onboarding and training fees

\- custom usage envelopes

\- custom overage contracts

\- custom feature bundles

\- support burden pricing

\- SLA-related premium pricing



This tier must support negotiated pricing structures.



\---



\## Integration Requirements



This registry must integrate with:

\- entitlement system

\- usage calculation system

\- revenue and margin system

\- admin controls

\- billing/export services

\- finance dashboards

\- workflow alerts for limit or cost risk



\---



\## Required APIs or Service Methods



Expose service methods or endpoints for:



GET /pricing/provider-costs

GET /pricing/plans

GET /pricing/plans/{plan\_id}

GET /pricing/metrics

GET /pricing/tenant/{tenant\_id}/effective

GET /pricing/tenant/{tenant\_id}/overrides

GET /pricing/resolve

POST /pricing/overrides

POST /pricing/versions

POST /pricing/promotions



Resolution responses must include:

\- metric

\- provider cost version

\- plan price version

\- override applied or null

\- promotion applied or null

\- resolved unit cost

\- resolved unit price

\- included usage info if relevant

\- overage info if relevant

\- audit source chain



\---



\## Validation Requirements



After implementation, verify:



\- provider cost resolution returns correct version by date

\- plan price resolution returns correct included and overage rules

\- tenant overrides take precedence correctly

\- promotions apply only when valid

\- historical events do not change when new pricing versions are added

\- finance and usage systems reconcile to the same pricing source

\- no scattered hardcoded pricing remains in operational logic

\- currency rounding is deterministic

\- audit records are generated for pricing-sensitive calculations



\---



\## Non-Breaking Rule



Do not replace current billing or pricing logic blindly.



Inspect:

\- existing billing structures

\- existing constants

\- existing finance models

\- current plan representations

\- current usage calculations



Then:

\- migrate safely into registry-backed resolution

\- preserve compatibility with existing records

\- create adapters where old logic cannot be removed in one pass

\- phase out hardcoded rates gradually if needed



\---



\## Required Outputs



Produce:



\- pricing data model changes

\- seed data for provider costs and plan prices

\- pricing resolution services

\- override services

\- promotion services

\- audit logging

\- migration and compatibility notes

\- validation results

\- unresolved-value placeholders clearly marked



\---



\## Success Criteria



This system is complete when:



\- provider cost calculations resolve from one central registry

\- customer-facing pricing resolves from one central registry

\- overages and included usage derive from versioned plan rules

\- tenant overrides and promotions are auditable

\- historical reporting remains stable across pricing changes

\- usage, finance, and billing layers all resolve pricing through this registry

\- no critical pricing logic remains scattered or hardcoded

