\# Live Operations Playbook

\## Day-2 Operations, Incident Response, Scaling, and Cost Control for OrbisVoice



You are responsible for operating the OrbisVoice platform in production.



This playbook defines:



\- how to monitor the system

\- how to respond to incidents

\- how to scale safely

\- how to control cost in real time

\- how to maintain reliability and performance

\- how to support customers and internal teams



This is not a build document.

This is a live system operations manual.



\---



\## Primary Objective



Maintain:



\- low-latency voice performance

\- high system availability

\- accurate financial tracking

\- safe tool execution

\- controlled cost exposure

\- rapid incident response



\---



\## Operational Priorities (Ordered)



1\. Voice system stability (real-time experience)

2\. Tool execution correctness (no wrong actions)

3\. Financial integrity (no cost leakage)

4\. System availability

5\. Performance optimization

6\. Cost efficiency



\---



\## System Health Overview



You must continuously monitor:



\### Core Signals



\- active voice sessions

\- session success rate

\- latency (p50 / p95 / p99)

\- error rate

\- tool execution success rate

\- queue depth

\- CPU / memory per service

\- DB connection health



\---



\## Key Dashboards



Maintain dashboards for:



\### 1. Voice Performance

\- latency distribution

\- interruption latency

\- audio chunk timing

\- session duration



\---



\### 2. Gateway Health

\- active connections

\- CPU usage

\- memory usage

\- event loop delay

\- error rate



\---



\### 3. Tool Execution

\- tool success vs failure

\- average tool latency

\- top failing tools



\---



\### 4. Financial Metrics

\- cost per session

\- revenue per session

\- margin per tenant

\- overage events



\---



\### 5. Infrastructure

\- container health

\- restart frequency

\- network errors

\- Redis / DB latency



\---



\## Incident Severity Levels



\### SEV-1 (Critical)

\- voice system down

\- widespread call failure

\- financial corruption

\- data loss



Action:

\- immediate response

\- rollback or hotfix



\---



\### SEV-2 (High)

\- latency > 1s consistently

\- tool execution failing

\- gateway instability



Action:

\- rapid mitigation

\- partial degradation allowed



\---



\### SEV-3 (Moderate)

\- intermittent issues

\- minor feature failures



Action:

\- scheduled fix



\---



\### SEV-4 (Low)

\- cosmetic or non-critical issues



\---



\## Incident Response Workflow



\### Step 1 — Detect

From:

\- alerts

\- dashboards

\- user reports



\---



\### Step 2 — Classify

Assign severity level.



\---



\### Step 3 — Contain

Actions may include:

\- scale up gateway

\- disable high-risk features

\- switch to degraded mode

\- rate limit traffic



\---



\### Step 4 — Diagnose

Identify:

\- affected service

\- root cause

\- scope of impact



\---



\### Step 5 — Mitigate

Options:

\- rollback deployment

\- restart service

\- patch configuration

\- reroute traffic



\---



\### Step 6 — Verify

Confirm:

\- metrics return to normal

\- errors drop

\- latency improves



\---



\### Step 7 — Document

Record:

\- cause

\- fix

\- prevention steps



\---



\## Common Incident Playbooks



\### 1. High Latency (Voice)



Symptoms:

\- delayed responses

\- slow playback



Actions:

\- check gateway CPU

\- check queue buildup

\- check Gemini latency

\- scale gateway instances

\- reduce response verbosity (latency mode)



\---



\### 2. Audio Desync / Playback Issues



Symptoms:

\- gaps in audio

\- overlapping audio



Actions:

\- inspect chunk ordering

\- verify playback buffer logic

\- restart affected gateway nodes if needed



\---



\### 3. Tool Execution Failure



Symptoms:

\- bookings not completing

\- SMS not sending



Actions:

\- check tool service (commerce-agent)

\- check provider API (Twilio, etc.)

\- retry failed tasks

\- fallback response to user



\---



\### 4. Duplicate Actions



Symptoms:

\- duplicate SMS/calls/bookings



Actions:

\- inspect idempotency keys

\- verify suppression logic

\- temporarily block tool if necessary



\---



\### 5. Cost Spike



Symptoms:

\- sudden increase in token/SMS/call usage



Actions:

\- identify tenant or feature causing spike

\- enforce cost-constrained mode

\- apply rate limits

\- notify admin



\---



\### 6. Gateway Crash / Restart Loop



Symptoms:

\- dropped sessions

\- reconnect loops



Actions:

\- inspect logs

\- check memory usage

\- scale horizontally

\- rollback if recent deploy



\---



\## Scaling Operations



\### When to Scale Up



\- high CPU usage (>70%)

\- increasing latency

\- rising active sessions



\---



\### Scaling Targets



Voice Gateway:

\- scale based on active sessions



API:

\- scale based on request throughput



Workers:

\- scale based on queue depth



\---



\### Scaling Strategy



\- horizontal scaling preferred

\- avoid vertical scaling as primary strategy



\---



\## Cost Control Operations



\### Monitor



\- cost per session

\- cost per tenant

\- margin per plan



\---



\### Actions



If margin drops:



\- reduce model usage (if configurable)

\- shorten responses

\- restrict high-cost tools

\- adjust overage thresholds

\- notify admin



\---



\### High-Risk Features



Monitor closely:



\- outbound calling

\- bulk SMS

\- long sessions

\- high token usage



\---



\## Runtime Mode Management



System may switch modes:



\### Modes



\- normal

\- latency\_constrained

\- cost\_constrained

\- degraded



\---



\### Operator Actions



Latency issue:

\- switch to latency\_constrained



Cost spike:

\- switch to cost\_constrained



System instability:

\- switch to degraded



\---



\## Maintenance Operations



\### Daily



\- review dashboards

\- check alerts

\- review error logs



\---



\### Weekly



\- review cost vs revenue

\- review top failing tools

\- review latency trends



\---



\### Monthly



\- review plan profitability

\- review usage distribution

\- adjust pricing or limits if needed



\---



\## Deployment Operations



\### Before Deploy



\- verify staging

\- run regression tests

\- confirm rollback plan



\---



\### During Deploy



\- use rolling updates

\- monitor live metrics



\---



\### After Deploy



\- watch latency

\- watch error rate

\- confirm stability



\---



\## Rollback Procedure



If deployment fails:



1\. revert to last stable version

2\. restart affected services

3\. verify metrics

4\. notify stakeholders



\---



\## Customer Support Operations



\### When Issue Reported



\- identify tenant

\- locate sessionId

\- review logs

\- replay flow if possible



\---



\### Response Goals



\- acknowledge quickly

\- resolve root cause

\- prevent recurrence



\---



\## Data Integrity Checks



Verify periodically:



\- usage vs billing consistency

\- tool execution logs vs outcomes

\- session logs completeness



\---



\## Security Monitoring



Watch for:



\- unusual traffic spikes

\- repeated failed auth

\- abnormal usage patterns



\---



\## Communication Protocol



\### Internal



\- alert ops team immediately for SEV-1/2

\- maintain incident channel



\---



\### External



\- notify affected customers if needed

\- provide updates during major incidents



\---



\## Operational Anti-Patterns



Do NOT:



\- ignore latency warnings

\- delay incident response

\- deploy without monitoring

\- allow cost spikes to continue unchecked

\- bypass policy enforcement during incidents

\- fix symptoms without root cause



\---



\## Operational Metrics Targets



\- uptime: >99.9%

\- latency: <500ms avg

\- error rate: <1%

\- tool success rate: >98%



\---



\## Success Criteria



Operations are successful when:



\- system remains stable under load

\- incidents are resolved quickly

\- cost is controlled

\- customers experience reliable voice interactions

\- system scales without degradation

\- financial data remains accurate



\---



\## Final Directive



Operate the system actively.



Monitor continuously.

Respond quickly.

Control cost.

Protect performance.



This is a real-time system—treat it like one.

