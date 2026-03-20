\# Revenue and Margin Agent

\## Revenue Attribution, Margin Intelligence, Overage Logic, and Plan Economics



You are responsible for designing and implementing a complete revenue, margin, and plan-economics system for the VoiceAgent platform.



This system must build on top of the usage and cost tracking layer and must calculate:



\- revenue by tenant

\- revenue by plan

\- revenue by add-on

\- revenue by agent

\- revenue by location

\- cost by tenant

\- cost by session

\- cost by feature

\- gross profit

\- gross margin percentage

\- overage charges

\- effective cost to serve

\- cost-risk alerts

\- plan profitability



This system must support both recurring subscription revenue and usage-based overages.



Do not implement this as a dashboard-only reporting layer. Build it as a system of record with enforceable calculations, auditability, and clear derivation paths.



\---



\## Primary Objective



Create a financial intelligence layer that answers:



\- how much a tenant pays

\- how much a tenant costs to serve

\- whether the tenant is profitable

\- which features create the most cost

\- when a tenant exceeds included usage

\- whether overages should bill, warn, or block

\- which plans are operationally healthy

\- which agents or workflows are inefficient

\- which products or tiers need repricing



\---



\## Revenue Model Scope



Support these revenue classes:



\### A. Subscription Revenue

\- base\_plan\_price

\- recurring\_monthly\_fee

\- annualized\_contract\_value

\- one\_time\_setup\_fee

\- onboarding\_fee



\### B. Add-On Revenue

\- extra\_locations\_fee

\- extra\_agents\_fee

\- extra\_concurrency\_fee

\- premium\_voice\_package\_fee

\- multilingual\_fee

\- white\_label\_fee

\- api\_access\_fee

\- custom\_automation\_fee

\- advanced\_analytics\_fee

\- priority\_support\_fee

\- compliance\_package\_fee



\### C. Usage-Based Revenue

\- conversation\_overage\_fee

\- minute\_overage\_fee

\- sms\_overage\_fee

\- email\_overage\_fee

\- outbound\_call\_overage\_fee

\- storage\_overage\_fee

\- custom\_api\_overage\_fee



\### D. Services Revenue

\- implementation\_fee

\- migration\_fee

\- workflow\_build\_fee

\- integration\_fee

\- consulting\_fee

\- model\_tuning\_fee



\### E. Credits and Adjustments

\- promotional\_credits

\- service\_credits

\- refunds

\- manual\_adjustments

\- writeoffs



\---



\## Financial Calculation Layers



The system must calculate revenue and cost at these layers:



\### 1. Session Layer

For each session:

\- session\_revenue\_allocated

\- session\_cost\_total

\- session\_gross\_profit

\- session\_margin\_percent



\### 2. Daily Layer

For each tenant and agent:

\- daily\_revenue

\- daily\_cost

\- daily\_profit

\- daily\_margin\_percent



\### 3. Monthly Layer

For each tenant, location, agent, plan:

\- mrr\_component

\- usage\_revenue

\- services\_revenue

\- credits\_applied

\- total\_revenue

\- total\_cost

\- gross\_profit

\- gross\_margin\_percent



\### 4. Portfolio Layer

Across the platform:

\- total\_mrr

\- total\_arr

\- total\_usage\_revenue

\- total\_cost\_of\_service

\- gross\_profit

\- blended\_margin

\- margin\_by\_plan

\- margin\_by\_feature

\- margin\_by\_segment



\---



\## Required Data Model



Create or extend these finance-oriented tables.



\### subscription\_financials

\- id

\- tenant\_id

\- plan\_id

\- billing\_cycle

\- base\_plan\_price

\- setup\_fee

\- recurring\_price

\- contract\_start\_date

\- contract\_end\_date

\- currency

\- status

\- created\_at

\- updated\_at



\### add\_on\_financials

\- id

\- tenant\_id

\- add\_on\_type

\- quantity

\- unit\_price

\- recurring\_or\_one\_time

\- effective\_start\_date

\- effective\_end\_date

\- status

\- metadata\_json



\### usage\_pricing\_rules

\- id

\- plan\_id

\- usage\_type

\- included\_units

\- overage\_unit\_price

\- block\_at\_limit

\- warn\_at\_percent

\- hard\_cap\_units

\- effective\_start\_date

\- effective\_end\_date

\- metadata\_json



\### finance\_events

\- id

\- tenant\_id

\- agent\_id

\- session\_id

\- event\_type

\- revenue\_amount

\- cost\_amount

\- adjustment\_amount

\- currency

\- source

\- source\_reference\_id

\- timestamp

\- metadata\_json



\### monthly\_financial\_summary

\- id

\- tenant\_id

\- plan\_id

\- month

\- recurring\_revenue

\- add\_on\_revenue

\- usage\_revenue

\- services\_revenue

\- credits\_total

\- refunds\_total

\- net\_revenue

\- total\_cost

\- gross\_profit

\- gross\_margin\_percent

\- notes\_json



\### feature\_cost\_summary

\- id

\- tenant\_id

\- month

\- feature\_name

\- sessions\_count

\- revenue\_allocated

\- cost\_allocated

\- profit\_allocated

\- margin\_percent



\---



\## Cost Inputs



Use the usage-cost layer as the source of operational cost.



Include at minimum:



\### AI Model Costs

\- audio\_input\_cost

\- audio\_output\_cost

\- text\_input\_cost

\- text\_output\_cost



\### Telephony Costs

\- inbound\_minute\_cost

\- outbound\_minute\_cost

\- forwarded\_minute\_cost

\- transferred\_minute\_cost



\### Messaging Costs

\- sms\_sent\_cost

\- sms\_received\_cost

\- email\_send\_cost if non-negligible



\### Infrastructure Costs

\- per-session infra allocation

\- per-tenant infra allocation

\- storage allocation

\- transcription processing cost if applicable

\- recording storage cost if applicable



\### Human Support Costs (optional if modeled)

\- support time allocation

\- onboarding labor cost

\- managed-service cost allocation



\---



\## Revenue Allocation Rules



When base subscription revenue is not inherently session-scoped, allocate it using deterministic methods.



Support these allocation strategies:



\- equal allocation by session count

\- allocation by conversation minutes

\- allocation by cost share

\- allocation by feature usage mix

\- configurable allocation strategy by reporting context



The default reporting allocation may differ from the invoicing source of truth. Keep this distinction explicit.



Do not confuse:

\- invoice revenue

\- recognized recurring revenue

\- analytical revenue allocation



\---



\## Gross Margin Formulas



\### Session Gross Profit

session\_gross\_profit = session\_revenue\_allocated - session\_cost\_total



\### Session Gross Margin Percent

session\_margin\_percent = 

&#x20; if session\_revenue\_allocated > 0

&#x20; then (session\_gross\_profit / session\_revenue\_allocated) \* 100

&#x20; else null



\### Monthly Gross Profit

gross\_profit = net\_revenue - total\_cost



\### Monthly Gross Margin Percent

gross\_margin\_percent =

&#x20; if net\_revenue > 0

&#x20; then (gross\_profit / net\_revenue) \* 100

&#x20; else null



\---



\## Overage Engine



Implement overage calculation logic for plan-based usage.



Support at minimum:



\- conversation count overages

\- concurrent call overages where billable

\- outbound minute overages

\- SMS overages

\- extra agent overages

\- extra location overages

\- recording or storage overages where relevant



For each usage type, support:

\- included units

\- actual units

\- units over included amount

\- overage rate

\- overage charge

\- warn threshold

\- hard block threshold

\- admin override



\---



\## Overage Behavior Modes



Each usage category must support one of these modes:



\### 1. Warn Only

\- issue alerts

\- do not bill automatically

\- do not block



\### 2. Bill Overage

\- continue service

\- calculate billable overage

\- create finance event



\### 3. Hard Cap

\- warn before cap

\- block after cap

\- log denial event



\### 4. Admin Review

\- suspend billing decision until reviewed

\- continue or pause based on policy



\---



\## Required Plan-Economics Views



The system must answer these questions:



\### Tenant Profitability

\- is this tenant profitable

\- what is their margin this month

\- what features drive their cost

\- are they underpriced for their usage



\### Plan Profitability

\- is Free sustainable

\- is LTD sustainable

\- is Starter margin-positive

\- is Professional priced correctly

\- does Enterprise cover support cost

\- is AI Revenue Infrastructure delivering expected margin



\### Feature Profitability

\- how much do outbound calls cost versus revenue earned

\- is live transfer margin-positive

\- what is the cost of multilingual support

\- how expensive is call recording and transcription

\- do SMS reminders pay for themselves

\- what is the margin profile of review-request workflows



\---



\## Required Derived Metrics



Expose these metrics:



\### Core Business Metrics

\- mrr

\- arr

\- arpu

\- arpa

\- ltv\_approximation if modeled

\- average\_cost\_per\_tenant

\- average\_profit\_per\_tenant

\- blended\_margin\_percent



\### Operational Metrics

\- cost\_per\_session

\- revenue\_per\_session

\- profit\_per\_session

\- cost\_per\_minute

\- revenue\_per\_minute

\- profit\_per\_minute

\- cost\_per\_agent

\- cost\_per\_location



\### Plan Metrics

\- tenants\_per\_plan

\- revenue\_per\_plan

\- cost\_per\_plan

\- margin\_per\_plan

\- overage\_revenue\_per\_plan

\- average\_usage\_against\_plan\_limit



\### Risk Metrics

\- low\_margin\_tenants

\- negative\_margin\_tenants

\- feature\_cost\_spikes

\- abnormal\_usage\_spikes

\- overage-heavy accounts

\- tenants nearing unprofitable threshold



\---



\## Financial Alerts



Implement configurable alerts for:



\- tenant margin below target threshold

\- negative gross margin

\- cost spike day-over-day

\- outbound calling cost spike

\- SMS cost spike

\- usage approaching included cap

\- abnormal concurrency spike

\- free-tier abuse patterns

\- LTD usage disproportionate to economics

\- high-support-cost enterprise account



Support alert severity:

\- info

\- warning

\- critical



Support destinations:

\- dashboard

\- email

\- SMS

\- Slack/webhook

\- internal finance queue



\---



\## Pricing Registry



Create a central pricing registry for internal financial calculations.



It must support:

\- provider cost versioning

\- internal markup rules

\- tenant-specific custom pricing

\- promotional windows

\- grandfathered pricing

\- LTD special cases

\- currency support if needed

\- effective dates



Do not hardcode provider rates throughout the codebase.



\---



\## Margin Policy Layer



Allow admins or finance operators to define target margin policies such as:



\- minimum gross margin by plan

\- minimum gross margin by feature

\- acceptable promotional thresholds

\- acceptable Free-tier loss thresholds

\- acceptable LTD cost envelope

\- enterprise manual-review rules

\- auto-suggest upgrade when usage exceeds economics



This layer must inform alerts and recommendations.



\---



\## Upgrade and Repricing Recommendations



The system must generate recommendations such as:



\- suggest Starter -> Professional

\- suggest Professional -> Enterprise

\- suggest paid outbound-calling add-on

\- suggest multilingual add-on

\- suggest extra concurrency pack

\- suggest custom enterprise pricing review

\- suggest workflow optimization to reduce AI output-token burn



Recommendations must be data-backed and explain:

\- current usage

\- current cost

\- current margin

\- relevant threshold crossed

\- projected improvement



\---



\## Required APIs



Expose endpoints or service methods for:



GET /finance/tenant/{tenant\_id}

GET /finance/tenant/{tenant\_id}/monthly

GET /finance/tenant/{tenant\_id}/features

GET /finance/plan/{plan\_id}

GET /finance/portfolio/summary

GET /finance/session/{session\_id}

GET /finance/overages/{tenant\_id}



Return:

\- revenue breakdown

\- cost breakdown

\- profit breakdown

\- margin percentages

\- overage events

\- recommendation signals

\- pricing version used

\- alert state



\---



\## Dashboard Requirements



Support finance dashboards for:



\### Tenant View

\- plan

\- recurring fee

\- usage overages

\- cost to serve

\- current margin

\- remaining included usage

\- top cost drivers



\### Admin/Finance View

\- portfolio MRR

\- margin by plan

\- margin by tenant

\- usage revenue vs subscription revenue

\- feature profitability

\- loss-making accounts

\- accounts needing repricing

\- accounts approaching overage thresholds



\---



\## LTD and Free Tier Special Handling



\### Free

Track cost rigorously.

Support:

\- abuse detection

\- conversion opportunity signals

\- free-tier cost ceiling alerts

\- optional hard caps



\### LTD

Treat LTD as a special financial class.

Support:

\- one-time booking of sale amount if needed

\- amortized view for analytics if desired

\- ongoing hosting/support cost tracking

\- margin deterioration alerts

\- admin review triggers if cost envelope exceeded



Do not assume LTD behaves like a normal recurring subscription.



\---



\## AI Revenue Infrastructure Handling



For AI Revenue Infrastructure, support:

\- custom contract pricing

\- custom overage logic

\- service-component revenue

\- onboarding and model-training revenue

\- support burden tracking

\- custom margin review



This tier must support both product revenue and managed-service revenue components.



\---



\## Validation Requirements



After implementation, verify:



\- revenue math is consistent across session, daily, monthly layers

\- overage calculations match pricing rules

\- credits and refunds adjust net revenue correctly

\- margin calculations are mathematically correct

\- allocation logic is deterministic and documented

\- pricing version changes do not corrupt historical reports

\- plan-level and tenant-level views reconcile

\- no current billing or usage flow is broken



\---



\## Non-Breaking Rule



Do not replace current subscription logic blindly.

Inspect current billing, usage, and entitlement structures first.



Then:

\- extend safely

\- preserve compatibility

\- add migrations where needed

\- create adapters if older billing records use different shapes

\- maintain auditability



\---



\## Required Outputs



Produce:



\- financial data model changes

\- pricing registry implementation

\- overage engine

\- revenue allocation logic

\- margin calculation services

\- alerting logic

\- finance APIs

\- dashboard data contracts

\- validation results

\- reconciliation notes

\- migration and rollback notes



\---



\## Success Criteria



This system is complete when:



\- every tenant has revenue, cost, and margin visibility

\- every plan can be evaluated economically

\- overages can be warned, billed, blocked, or reviewed

\- low-margin accounts are detectable

\- financial recommendations are data-backed

\- historical reporting remains consistent

\- current app behavior is preserved unless intentionally migrated

