\# OrbisVoice System Control Layer

\## Critical Constraints, Existing System Anchors, and Non-Rewrite Directives



This document overrides assumptions in all other prompt files.



It defines what already exists, what must be preserved, and how Antigravity must behave when modifying the system.



\---



\## Core Directive



You are NOT building OrbisVoice from scratch.



You are:



\- migrating a working prototype

\- unifying architecture

\- improving structure

\- adding governance, finance, and policy layers

\- preserving real-time performance



\---



\## Critical System Truths



The following are already implemented and MUST be preserved:



\### 1. Working Gemini Live Prototype (DO NOT REBUILD)



Location:

\- `apps/web/src/app/components/AgentBuilderForm.tsx`

\- function: `startTalking`



This contains:

\- working Gemini Live session logic

\- real-time audio interaction

\- functional voice conversation loop



\### Rule:

You must \*\*extract and relocate\*\*, NOT rewrite.



Target:

\- move logic into `voice-gateway`

\- remove API key exposure from client

\- preserve behavior exactly



\---



\### 2. Audio System (DO NOT REPLACE)



Location:

\- `apps/web/src/lib/audio-utils.ts`



Contains:

\- `AudioRecorder` (AudioWorklet, 16kHz PCM)

\- `AudioPlayer` (24kHz playback, gapless scheduling)



\### Rule:

\- do not replace this system

\- do not redesign capture/playback

\- only integrate with gateway streaming



\---



\### 3. Voice Gateway (REQUIRES UPGRADE, NOT REPLACEMENT)



Location:

\- `apps/voice-gateway/src/index.ts`



Current state:

\- WebSocket proxy

\- uses unary `generateContent`



\### Required Change:

\- upgrade to Gemini \*\*Multimodal Live API\*\*

\- maintain gateway as:

&#x20; - real-time bridge

&#x20; - tool orchestrator

&#x20; - security boundary



\---



\## Architectural Non-Negotiables



\### 1. Gateway-Centric Design



ALL voice must flow through:



Client → WebSocket → Voice Gateway → Gemini Live



Never:

\- connect client directly to Gemini

\- expose API keys to browser

\- bypass gateway for tool calls



\---



\### 2. Tool Execution Ownership



The AI model:

\- suggests actions



The backend:

\- validates

\- executes

\- returns results



\### Forbidden:

\- direct tool execution from model

\- uncontrolled outbound calls

\- uncontrolled SMS/email



\---



\### 3. Latency Constraint



Target:

\- <500ms glass-to-glass



\### Implications:

\- avoid blocking operations in gateway

\- use streaming everywhere

\- async tool execution

\- minimal serialization overhead



\---



\### 4. Streaming Architecture



You must preserve:



\- bidirectional streaming

\- chunk-based audio flow

\- real-time tool call handling



\---



\## Migration Strategy (MANDATORY)



\### Phase A — Extraction



\- extract Gemini Live logic from frontend

\- move to gateway

\- maintain identical behavior



\### Phase B — Integration



\- connect frontend audio stream to gateway

\- connect gateway to Gemini Live

\- validate audio roundtrip



\### Phase C — Tool Interception



\- intercept Gemini tool calls in gateway

\- route to internal services (calendar, email, SMS, commerce)

\- return tool results in-stream



\### Phase D — Enhancement



Only AFTER A–C succeed:

\- apply entitlement system

\- apply runtime policy enforcement

\- apply finance tracking



\---



\## Anti-Rewrite Rules



Do NOT:



\- rebuild voice system from zero

\- replace working audio pipeline

\- redesign Gemini session model prematurely

\- introduce new abstractions before migration

\- break working prototype behavior



\---



\## Integration Points for Antigravity System



The following layers must attach to EXISTING flows:



\### Entitlements (01, 06)

Attach at:

\- tool execution boundary

\- workflow decision points



\---



\### Workflow Mutation (02)

Attach at:

\- gateway tool routing layer

\- not inside Gemini session loop



\---



\### Runtime Policy (11)

Attach at:

\- pre-tool execution

\- session decision points



\---



\### Usage Tracking (07)

Attach at:

\- token usage (Gemini)

\- audio minutes

\- tool calls

\- SMS/call/email events



\---



\### Pricing (09)

Used by:

\- usage layer

\- finance layer



\---



\### Finance (08)

Derived from:

\- usage + pricing



\---



\### Admin Controls (10)

Affect:

\- entitlements

\- overrides

\- feature enablement



\---



\## Telephony Integration (CRITICAL)



You are using:



\- Twilio Programmable Voice

\- Twilio Messaging



\### Must support:

\- outbound calling

\- call forwarding

\- call bridging

\- SMS sending

\- live call control



\### Rule:

All telephony must:

\- pass through gateway

\- use tool-calling pattern

\- be policy-controlled



\---



\## Barge-In Handling



System must support:



If user speaks while AI is speaking:

\- stop playback immediately (client)

\- notify gateway

\- interrupt Gemini stream if supported



\---



\## Security Rules



\- no API keys in frontend

\- all provider access via backend

\- tenant isolation enforced

\- agentId must be validated against user



\---



\## Observability Requirements



Must log:



\- session lifecycle

\- tool calls

\- tool results

\- errors

\- latency metrics

\- cost metrics



\---



\## Compatibility Requirement



Existing prototype must continue to function after migration.



If a change breaks:

\- voice interaction

\- audio playback

\- session stability



You must:

\- stop

\- diagnose

\- repair before proceeding



\---



\## Stop Conditions (Critical)



Stop immediately if:



\- real-time audio breaks

\- latency spikes significantly

\- Gemini session fails to stream properly

\- tool calls stall the stream

\- frontend audio desynchronizes

\- gateway becomes blocking



\---



\## Success Criteria



System is correct when:



\- Gemini Live runs through gateway

\- no API keys are exposed

\- audio remains low-latency

\- tool calls execute in real-time

\- existing prototype behavior is preserved

\- Antigravity layers integrate without breaking flow



\---



\## Final Directive



Respect the existing system.



Migrate → unify → enhance.



Do not rebuild what already works.

