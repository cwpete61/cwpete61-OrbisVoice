\# Gateway Migration Plan from Browser Live Prototype

\## Controlled Extraction and Unification of Gemini Live Voice System



You are responsible for migrating a working browser-based Gemini Live voice implementation into the Voice Gateway without breaking functionality.



This is a surgical migration, not a rewrite.



The goal is to:

\- remove API key exposure from the browser

\- centralize all Gemini Live interaction in the gateway

\- preserve real-time audio behavior

\- preserve latency characteristics

\- maintain identical conversational behavior



\---



\## Primary Directive



Do not rebuild the voice system.



You must:

\- extract

\- relocate

\- adapt

\- validate



The existing prototype is the source of truth.



\---



\## Source of Truth (MUST USE)



\### Gemini Live Prototype



Location:

\- `apps/web/src/app/components/AgentBuilderForm.tsx`



Function:

\- `startTalking`



This contains:

\- working Gemini Live connection

\- streaming logic

\- audio interaction loop

\- message handling behavior



\---



\### Audio System



Location:

\- `apps/web/src/lib/audio-utils.ts`



Contains:

\- `AudioRecorder`

\- `AudioPlayer`



These are production-grade and must not be replaced.



\---



\### Gateway Stub



Location:

\- `apps/voice-gateway/src/index.ts`



Current:

\- WebSocket server

\- unary Gemini calls



Target:

\- full Gemini Live streaming bridge



\---



\## Migration Strategy Overview



The migration must occur in controlled stages:



1\. isolate Gemini logic

2\. move session handling to gateway

3\. connect client audio to gateway

4\. connect gateway to Gemini Live

5\. verify audio roundtrip

6\. restore tool calling

7\. validate parity with prototype



\---



\## Phase 1 — Code Extraction (No Behavior Change)



\### Objective

Isolate Gemini Live logic from frontend.



\### Tasks



\- locate all Gemini-related code in `startTalking`

\- identify:

&#x20; - connection setup

&#x20; - event listeners

&#x20; - audio handling hooks

&#x20; - tool call handling

\- extract into a conceptual module:

&#x20; - `GeminiLiveSession`



\### Output (logical, not yet moved):

\- connection config

\- event handlers

\- message handling logic



\### Rules

\- do not modify behavior

\- do not refactor logic deeply

\- only isolate and understand



\---



\## Phase 2 — Gateway Session Implementation



\### Objective

Move Gemini Live session into gateway.



\### Tasks



Create module:

\- `apps/voice-gateway/src/services/gemini-live-session.ts`



Responsibilities:

\- establish Gemini Live connection

\- stream audio input

\- receive audio output

\- receive transcripts

\- receive tool calls

\- emit normalized events



\### Requirements



\- use `@google/genai` or equivalent Live API interface

\- support bidirectional streaming

\- assign `providerSessionId`

\- support event callbacks or streaming loop



\### Critical Rule



The gateway must fully own:

\- Gemini connection

\- API key usage

\- system prompt injection



\---



\## Phase 3 — WebSocket Protocol Integration



\### Objective

Connect client ↔ gateway ↔ Gemini.



\### Tasks



1\. Update gateway WebSocket handler:



\- on `session.init`

&#x20; - authenticate

&#x20; - fetch agent config

&#x20; - create Gemini session



2\. Map incoming messages:



\- `audio.input.chunk` → Gemini input stream

\- `audio.input.end` → end segment signal



3\. Map outgoing events:



From Gemini:

\- audio → `audio.output.chunk`

\- transcript → `transcript.partial` / `transcript.final`



\---



\## Phase 4 — Audio Roundtrip Validation



\### Objective

Ensure audio pipeline works identically.



\### Tasks



Validate:



\- mic → recorder → WS → gateway → Gemini → gateway → WS → player



\### Required checks



\- no gaps in playback

\- correct sample rates:

&#x20; - input: 16kHz

&#x20; - output: 24kHz

\- no distortion

\- correct chunk ordering

\- low latency preserved



\### Stop if:



\- playback is choppy

\- latency spikes

\- audio desync occurs



\---



\## Phase 5 — Remove Browser Gemini Dependency



\### Objective

Eliminate direct Gemini calls in frontend.



\### Tasks



\- remove `live.connect` usage from `AgentBuilderForm.tsx`

\- replace with WebSocket-based interface

\- keep:

&#x20; - `AudioRecorder`

&#x20; - `AudioPlayer`



\### Result



Frontend becomes:

\- audio capture

\- audio playback

\- message transport



No AI logic in browser.



\---



\## Phase 6 — Tool Call Interception



\### Objective

Restore and centralize tool orchestration.



\### Tasks



In gateway:



1\. detect tool calls from Gemini

2\. map to canonical tool contract

3\. route to:

&#x20;  - commerce-agent

&#x20;  - calendar service

&#x20;  - email service

&#x20;  - SMS service

4\. return tool result to Gemini



\### Requirements



\- must be async

\- must not block audio stream

\- must support correlation via `toolRequestId`



\---



\## Phase 7 — Barge-In Handling



\### Objective

Maintain interruption behavior.



\### Tasks



Client:

\- send `barge\_in.request`



Gateway:

\- stop forwarding audio output

\- notify Gemini if supported

\- prioritize new input



Client:

\- stop playback immediately



\### Validation



\- interruption must feel instant

\- no stale audio continues



\---



\## Phase 8 — Session State Management



\### Objective

Ensure stable session lifecycle.



\### Gateway must manage:



\- session start

\- session active

\- session interrupted

\- session paused (optional)

\- session ended

\- error states



\### Must track:



\- sessionId

\- connectionId

\- providerSessionId

\- playbackSegmentId

\- current response state



\---



\## Phase 9 — Parity Validation (CRITICAL)



\### Objective

Ensure migrated system behaves exactly like prototype.



\### Test scenarios



1\. Basic conversation

2\. Multi-turn dialogue

3\. Fast interruptions

4\. Silence handling

5\. Rapid speech

6\. Tool call flow (if available)

7\. Long session stability



\### Must match:



\- responsiveness

\- voice quality

\- transcript accuracy

\- interruption behavior



\---



\## Phase 10 — Integration Readiness for Antigravity Layers



\### Objective

Prepare system for higher-level systems.



\### After migration, system must support:



\- entitlement checks (before tool execution)

\- runtime policy enforcement

\- usage tracking hooks

\- pricing integration

\- finance tracking

\- admin overrides



Do NOT implement these yet if migration is incomplete.



\---



\## Anti-Patterns (Do Not Do)



Do NOT:



\- rewrite audio pipeline

\- introduce new audio encoding formats prematurely

\- replace AudioWorklet logic

\- block event loop in gateway

\- couple Gemini logic directly to frontend

\- bypass gateway for testing shortcuts

\- delay tool response excessively

\- mix migration with pricing/finance logic



\---



\## Observability During Migration



Log:



\- session start/end

\- audio chunk counts

\- Gemini latency

\- tool call latency

\- error events

\- interruption events



\---



\## Stop Conditions



Stop immediately if:



\- audio playback breaks

\- latency exceeds acceptable threshold

\- Gemini stream becomes unstable

\- tool calls freeze conversation

\- browser crashes or leaks memory

\- desync between transcript and audio



\---



\## Rollback Strategy



If instability occurs:



\- revert to last working gateway version

\- re-enable browser-based prototype temporarily

\- isolate failure surface

\- fix narrowly before retry



\---



\## Success Criteria



Migration is complete when:



\- Gemini Live runs entirely in gateway

\- browser no longer uses API key

\- audio pipeline is stable and low latency

\- transcripts and audio align correctly

\- tool calls function through gateway

\- interruption works reliably

\- behavior matches original prototype



\---



\## Final Directive



Respect the working system.



Extract → move → validate → enhance.



Do not sacrifice stability for speed.

