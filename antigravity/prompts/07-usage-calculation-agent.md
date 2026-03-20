\# Usage Calculation Agent

\## Real-Time Cost, Usage, and Limit Enforcement System for Voice Agents



You are responsible for designing and implementing a complete usage tracking, cost calculation, and limit enforcement system for the VoiceAgent platform.



This system must integrate with:

\- Gemini model usage (audio + text tokens)

\- telephony providers (Twilio or equivalent)

\- messaging systems (SMS, email)

\- plan entitlements

\- admin overrides

\- agent-level activity

\- workflow execution logs



This system must operate in real-time and support aggregated reporting.



\---



\## Primary Objective



Track, calculate, and enforce:



\- usage volume

\- cost per interaction

\- cost per agent

\- cost per tenant

\- cost per plan tier

\- cost per feature (voice, SMS, email, calls)

\- limit enforcement (conversation caps, concurrency caps, etc.)



\---



\## Core Usage Categories



\### A. Voice AI Usage (Gemini)



Track:



\- audio\_input\_tokens

\- audio\_output\_tokens

\- text\_input\_tokens

\- text\_output\_tokens

\- total\_tokens



\### Cost Calculation



Use configurable pricing inputs:



audio\_input\_cost\_per\_million

audio\_output\_cost\_per\_million

text\_input\_cost\_per\_million

text\_output\_cost\_per\_million



Formula:



audio\_input\_cost = (audio\_input\_tokens / 1\_000\_000) \* audio\_input\_cost\_per\_million  

audio\_output\_cost = (audio\_output\_tokens / 1\_000\_000) \* audio\_output\_cost\_per\_million  

text\_input\_cost = (text\_input\_tokens / 1\_000\_000) \* text\_input\_cost\_per\_million  

text\_output\_cost = (text\_output\_tokens / 1\_000\_000) \* text\_output\_cost\_per\_million  



total\_model\_cost = sum(all above)



\---



\### B. Telephony Usage



Track:



\- inbound\_call\_minutes

\- outbound\_call\_minutes

\- forwarded\_call\_minutes

\- transferred\_call\_minutes



Pricing inputs:



cost\_per\_minute\_inbound  

cost\_per\_minute\_outbound  



Formula:



telephony\_cost = (minutes \* rate)



\---



\### C. SMS Usage



Track:



\- sms\_sent\_count

\- sms\_received\_count



Pricing inputs:



cost\_per\_sms\_sent  

cost\_per\_sms\_received  



\---



\### D. Email Usage



Track:



\- emails\_sent\_count



Cost:

\- typically negligible, but still tracked



\---



\### E. Workflow Execution



Track:



\- tool\_calls\_per\_session

\- booking\_events

\- transfer\_events

\- escalation\_events



\---



\## Required Data Model



Create or extend a usage table:



usage\_events:

\- id

\- tenant\_id

\- agent\_id

\- session\_id

\- timestamp

\- usage\_type (voice, sms, call, email, tool)

\- tokens\_input

\- tokens\_output

\- call\_duration\_seconds

\- sms\_count

\- email\_count

\- tool\_name

\- cost

\- metadata\_json



\---



\## Aggregation Tables



Create:



usage\_summary\_daily:

\- tenant\_id

\- agent\_id

\- date

\- total\_cost

\- total\_tokens

\- total\_minutes

\- total\_sms

\- total\_emails

\- total\_sessions



usage\_summary\_monthly:

\- same structure aggregated



\---



\## Plan Enforcement Layer



Before allowing execution of any action:



Check:



\- monthly\_conversation\_limit

\- max\_concurrent\_calls

\- sms usage limits

\- outbound calling permissions

\- feature availability



If exceeded:



\- block execution

\- return structured denial

\- log violation event

\- optionally notify admin



\---



\## Real-Time Cost Tracking



Each session must maintain:



session\_usage\_state:

\- running\_token\_total

\- running\_cost\_total

\- running\_minutes

\- tool\_calls\_count



Update this state after every:



\- model response

\- tool call

\- telephony event



\---



\## Per-Session Cost Calculation



At session end:



session\_total\_cost =

&#x20; model\_cost +

&#x20; telephony\_cost +

&#x20; sms\_cost +

&#x20; email\_cost



Store:



\- session\_cost

\- breakdown by category



\---



\## Required APIs



Expose endpoints:



GET /usage/tenant/{tenant\_id}

GET /usage/agent/{agent\_id}

GET /usage/session/{session\_id}



Return:



\- cost breakdown

\- usage breakdown

\- limits remaining

\- plan tier



\---



\## Alerts and Thresholds



Implement:



\- 80% usage warning

\- 100% limit reached block

\- anomaly detection (spike in cost or usage)

\- admin notifications



\---



\## Admin Controls



Allow admins to:



\- override usage limits

\- set custom pricing multipliers

\- set hard caps

\- enable/disable features based on cost risk

\- define alert thresholds



\---



\## Cost Optimization Signals



The system must detect:



\- excessive agent talking (high output tokens)

\- long silence streaming

\- repeated tool calls

\- inefficient workflows



And produce:



\- optimization suggestions

\- flagged sessions



\---



\## Voice-Specific Cost Control



Implement:



\- max response length per plan

\- interruptible speech tracking

\- silence detection flags

\- response compression options



\---



\## Integration Points



Must integrate with:



\- VoiceAgent runtime (Gemini Live)

\- Twilio events (calls, SMS)

\- workflow engine

\- entitlement system

\- admin dashboard



\---



\## Validation Requirements



After implementation:



\- verify token tracking accuracy

\- verify cost calculations

\- verify aggregation correctness

\- verify plan enforcement

\- verify denial behavior

\- verify alert triggers



\---



\## Non-Breaking Rule



Do not disrupt:



\- existing session handling

\- existing workflow execution

\- existing telephony flows



Wrap existing logic with tracking instead of replacing it.



\---



\## Output Requirements



Produce:



\- usage service implementation

\- database schema updates

\- aggregation jobs

\- API endpoints

\- validation results

\- cost simulation examples

\- risk analysis



\---



\## Success Criteria



System is complete when:



\- every session has a cost

\- every tenant has usage visibility

\- limits are enforced correctly

\- admins can control cost exposure

\- system detects inefficiencies

\- no existing workflows are broken

