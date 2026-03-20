\# Gateway Contracts and Message Schema

\## Canonical Real-Time Message Contracts for Client, Voice Gateway, Gemini Live, and Tool Orchestration



You are responsible for designing and implementing the canonical message contracts for the OrbisVoice real-time voice system.



This file defines the message schema and protocol rules for:



\- client ↔ voice gateway

\- gateway ↔ Gemini Live

\- gateway internal tool orchestration

\- runtime policy and tool execution responses

\- session control, interruption, fallback, and observability events



These contracts must be treated as stable protocol interfaces.

Do not allow ad hoc payload shapes to emerge across the codebase.



This document is the source of truth for wire-level and gateway-level message semantics.



\---



\## Primary Objective



Create a robust, low-latency, versioned message protocol that:



\- supports streaming audio in both directions

\- supports session initialization and authentication

\- supports Gemini Live event forwarding and adaptation

\- supports tool-call interception and response injection

\- supports barge-in / interruption

\- supports policy decisions and denial results

\- supports latency and observability signals

\- supports backward-compatible protocol evolution



The contracts must be explicit, typed, and implementation-ready.



\---



\## Protocol Design Principles



1\. All messages must have an explicit message type.

2\. All messages must support versioning.

3\. All session-bound messages must include session identity.

4\. All action messages must support traceability and correlation.

5\. Binary audio and structured control events must be cleanly separated.

6\. Tool execution messages must be idempotent and auditable.

7\. The gateway must normalize provider-specific events into internal canonical event shapes.

8\. Sensitive internal details must not be leaked to clients.

9\. The protocol must support low-latency streaming and interruption.

10\. The protocol must remain extensible without breaking old clients abruptly.



\---



\## System Boundaries



\### Boundary A — Client ↔ Voice Gateway

This is the primary application wire protocol.

It handles:

\- session start

\- auth context

\- audio input streaming

\- audio output streaming

\- transcript events

\- tool-related UX events

\- interruption events

\- error/fallback signals

\- observability summaries where appropriate



\### Boundary B — Gateway ↔ Gemini Live

This is the provider-facing streaming protocol.

It may use provider-native event shapes internally, but the gateway must adapt them into canonical internal events before exposing behavior to the rest of the platform.



\### Boundary C — Gateway Internal Tool Layer

This is the internal action orchestration contract.

It handles:

\- tool call requests

\- runtime policy evaluation

\- execution result handling

\- denial/fallback outcomes

\- correlation back into live conversation



\---



\## Protocol Versioning



Every structured message must include:



\- `protocolVersion`

\- `messageType`

\- `timestamp`

\- `sessionId`



Recommended first version:

\- `protocolVersion: "1.0"`



Do not use unversioned payloads for long-lived contracts.



Backward compatibility rules:

\- additive fields preferred

\- never silently repurpose existing fields

\- deprecate explicitly before removing

\- tolerate unknown optional fields where safe



\---



\## Canonical Envelope



All structured JSON messages must conform to a canonical envelope.



\### Envelope Fields



\- `protocolVersion`: string

\- `messageType`: string

\- `sessionId`: string

\- `timestamp`: ISO-8601 string or equivalent canonical timestamp

\- `messageId`: string

\- `correlationId`: string or null

\- `tenantId`: string or null where safe to include internally

\- `agentId`: string or null where applicable

\- `payload`: object



Client-safe messages may omit sensitive internal fields if not needed.

Internal gateway events may include more metadata.



\---



\## Session Identity Model



Each live session must have stable identifiers.



Required identifiers:

\- `sessionId` — live session identifier

\- `tenantId` — tenant/account owner

\- `agentId` — configured voice agent

\- `userId` or `contactId` where applicable and safe

\- `connectionId` — websocket connection identity

\- `providerSessionId` — Gemini provider session id if assigned

\- `traceId` — cross-service tracing correlation id



Do not expose internal-only identifiers to the client if not needed.



\---



\## Client ↔ Gateway Message Types



The client-facing gateway protocol must support the following canonical message types.



\### 1. `session.init`

Purpose:

\- initialize session

\- authenticate or attach token context

\- bind tenant/agent/user state

\- negotiate audio and runtime capabilities



Payload fields:

\- `authToken`: string

\- `agentId`: string

\- `clientType`: enum (`web`, `mobile`, `twilio\_bridge`, `internal\_test`)

\- `requestedVoiceId`: string or null

\- `locale`: string or null

\- `audioInputFormat`: object

\- `audioOutputFormat`: object

\- `clientCapabilities`: object

\- `metadata`: object or null



Example input format:

\- sampleRateHz: 16000

\- encoding: `pcm\_s16le`

\- channels: 1

\- transport: `binary\_ws` or `base64\_json`



Example output format:

\- sampleRateHz: 24000

\- encoding: `pcm\_s16le`

\- channels: 1



Client capabilities may include:

\- `supportsBargeIn`

\- `supportsPartialTranscript`

\- `supportsPlaybackStop`

\- `supportsBinaryAudio`

\- `supportsLatencyMetrics`



\---



\### 2. `session.accepted`

Purpose:

\- acknowledge successful session start

\- return resolved runtime configuration



Payload fields:

\- `sessionState`: enum (`accepted`)

\- `resolvedVoiceId`

\- `resolvedVoiceLabel`

\- `resolvedLocale`

\- `runtimeMode`

\- `bargeInEnabled`

\- `maxInputChunkMs`

\- `maxOutputChunkMs`

\- `policySummary`: sanitized object

\- `traceId`



Do not include secrets or system prompts.



\---



\### 3. `session.denied`

Purpose:

\- reject session startup safely



Payload fields:

\- `reasonCode`

\- `humanMessage`

\- `retryable`: boolean

\- `fallbackMode`: enum or null

\- `traceId`



\---



\### 4. `audio.input.chunk`

Purpose:

\- stream client microphone audio to gateway



Payload fields for JSON transport:

\- `sequenceNumber`

\- `audioBase64`

\- `sampleRateHz`

\- `encoding`

\- `channels`

\- `chunkDurationMs`

\- `isFinalChunk`: boolean optional



For binary transport:

\- use binary websocket frames

\- send metadata via preceding or side-channel control message if needed

\- maintain sequence numbers through adjacent control frame or stream state



Rule:

The protocol must support either:

\- binary frame audio transport

or

\- base64 JSON transport



Prefer binary for lower overhead where possible.



\---



\### 5. `audio.input.end`

Purpose:

\- indicate end of current user utterance stream or input segment



Payload fields:

\- `sequenceNumber`

\- `reason`: enum (`user\_stop`, `vad\_end`, `push\_to\_talk\_release`, `session\_end`)



\---



\### 6. `audio.output.chunk`

Purpose:

\- stream AI audio from gateway to client



Payload fields:

\- `sequenceNumber`

\- `audioBase64` or binary frame mapping

\- `sampleRateHz`

\- `encoding`

\- `channels`

\- `chunkDurationMs`

\- `playbackSegmentId`

\- `isFinalChunk`: boolean optional



Rule:

Audio output chunks must be order-safe and schedulable by the client player for gapless playback.



\---



\### 7. `transcript.partial`

Purpose:

\- provide partial transcript updates



Payload fields:

\- `speaker`: enum (`user`, `agent`)

\- `text`

\- `utteranceId`

\- `isFinal`: false

\- `stability`: float optional



\---



\### 8. `transcript.final`

Purpose:

\- provide finalized transcript segment



Payload fields:

\- `speaker`

\- `text`

\- `utteranceId`

\- `isFinal`: true

\- `startOffsetMs`: optional

\- `endOffsetMs`: optional



\---



\### 9. `response.started`

Purpose:

\- notify client that agent response generation has begun



Payload fields:

\- `responseId`

\- `playbackSegmentId`

\- `source`: enum (`gemini`, `template`, `fallback`)

\- `interruptible`: boolean



\---



\### 10. `response.completed`

Purpose:

\- notify client that current agent response is complete



Payload fields:

\- `responseId`

\- `playbackSegmentId`

\- `completionReason`: enum (`normal`, `interrupted`, `cancelled`, `fallback\_switch`)



\---



\### 11. `barge\_in.request`

Purpose:

\- client indicates user has started speaking while playback is active



Payload fields:

\- `reason`: enum (`vad\_detected`, `manual\_interrupt`, `push\_to\_talk\_override`)

\- `activePlaybackSegmentId`: string or null



Rule:

Client should send immediately when local playback should stop.



\---



\### 12. `barge\_in.ack`

Purpose:

\- gateway confirms interruption handling state



Payload fields:

\- `playbackStopRequired`: boolean

\- `providerInterruptSent`: boolean

\- `interruptedResponseId`: string or null



\---



\### 13. `tool.activity`

Purpose:

\- client-safe notification that a tool-related action is in progress



Payload fields:

\- `toolActivityType`: enum (`checking\_availability`, `sending\_confirmation`, `routing\_call`, `looking\_up\_order`, `processing\_request`)

\- `displayMessage`: string

\- `toolRequestId`



This is optional and sanitized for UX. Do not leak internal tool payloads.



\---



\### 14. `fallback.notice`

Purpose:

\- inform client that fallback path is being used



Payload fields:

\- `fallbackType`

\- `displayMessage`

\- `reasonCode`



\---



\### 15. `session.error`

Purpose:

\- report recoverable or terminal session error



Payload fields:

\- `errorCode`

\- `humanMessage`

\- `retryable`

\- `severity`: enum (`info`, `warning`, `error`, `critical`)

\- `recommendedAction`: enum or null



Do not leak provider secrets or internal stack traces.



\---



\### 16. `session.end`

Purpose:

\- orderly close of session



Payload fields:

\- `reason`: enum (`user\_end`, `agent\_end`, `timeout`, `policy\_stop`, `error`)

\- `summary`: object optional and sanitized



\---



\## Internal Gateway Canonical Event Types



The gateway must normalize provider-specific and internal orchestration events into canonical internal event shapes.



\### Required internal event types



\- `gateway.session.initialized`

\- `gateway.session.accepted`

\- `gateway.session.denied`

\- `gateway.audio.input.received`

\- `gateway.audio.forwarded\_to\_provider`

\- `gateway.provider.response.started`

\- `gateway.provider.audio.received`

\- `gateway.provider.transcript.partial`

\- `gateway.provider.transcript.final`

\- `gateway.provider.tool\_call.requested`

\- `gateway.tool.policy.evaluated`

\- `gateway.tool.execution.started`

\- `gateway.tool.execution.completed`

\- `gateway.tool.execution.denied`

\- `gateway.provider.tool\_response.sent`

\- `gateway.barge\_in.received`

\- `gateway.barge\_in.forwarded`

\- `gateway.output.forwarded\_to\_client`

\- `gateway.session.ended`

\- `gateway.error`



These events may be logged or traced internally and must support correlation ids.



\---



\## Gateway ↔ Gemini Live Adaptation Rules



The gateway may interact with Gemini Live using provider-native streaming events, but it must adapt them into canonical behavior.



The gateway must normalize:



\- provider partial text events

\- provider audio output events

\- provider tool call events

\- provider interruption or turn control events

\- provider completion or finish-reason events

\- provider error events



The rest of the application should depend on canonical internal shapes, not provider-specific raw events.



Do not let raw Gemini event shapes spread through unrelated code.



\---



\## Tool Call Orchestration Contract



Tool execution must be represented by canonical internal messages.



\### 1. `tool.call.requested`

Purpose:

\- represent model-requested tool invocation



Payload fields:

\- `toolRequestId`

\- `toolName`

\- `arguments`

\- `providerTurnId` or equivalent

\- `requestedBy`: enum (`model`)

\- `requestContext`: object



\### 2. `tool.call.policy\_evaluated`

Purpose:

\- runtime policy decision before execution



Payload fields:

\- `toolRequestId`

\- `decisionStatus`: enum (`allow`, `allow\_with\_confirmation`, `require\_admin\_approval`, `deny\_with\_fallback`, `deny\_hard\_stop`)

\- `reasonCode`

\- `fallbackAction`: object or null

\- `requiresConfirmation`: boolean

\- `requiresApproval`: boolean



\### 3. `tool.call.execution\_started`

Purpose:

\- execution has begun in backend/provider layer



Payload fields:

\- `toolRequestId`

\- `toolName`

\- `executionPath`: enum (`internal\_service`, `third\_party\_provider`, `workflow\_adapter`)

\- `idempotencyKey`



\### 4. `tool.call.execution\_completed`

Purpose:

\- execution completed successfully



Payload fields:

\- `toolRequestId`

\- `toolName`

\- `status`: enum (`success`)

\- `result`: object

\- `providerReferenceId`: string or null

\- `latencyMs`



\### 5. `tool.call.execution\_failed`

Purpose:

\- execution failed



Payload fields:

\- `toolRequestId`

\- `toolName`

\- `status`: enum (`failed`)

\- `errorCode`

\- `retryable`

\- `fallbackAction`: object or null

\- `latencyMs`



\### 6. `tool.call.execution\_denied`

Purpose:

\- execution blocked by policy or compliance



Payload fields:

\- `toolRequestId`

\- `toolName`

\- `status`: enum (`denied`)

\- `reasonCode`

\- `humanSafeMessage`

\- `fallbackAction`: object or null



\---



\## Tool Response Injection Contract



After execution or denial, the gateway must inject the tool result back into Gemini using a canonical internal representation before mapping it to the provider-specific response format.



Canonical payload fields:

\- `toolRequestId`

\- `toolName`

\- `toolResponseStatus`: enum (`success`, `failed`, `denied`)

\- `toolResponseData`: object

\- `toolResponseMessage`: string optional

\- `providerReferenceId`: string or null



Rules:

\- tool response must correlate to original provider tool call

\- duplicate tool responses must be prevented

\- denial/fallback outcomes must still be represented coherently to the model



\---



\## Idempotency and Duplicate Suppression



All tool executions and user-visible side effects must support idempotency.



Required fields:

\- `toolRequestId`

\- `idempotencyKey`

\- normalized payload hash where useful

\- recent execution window metadata



Actions requiring duplicate suppression:

\- create calendar event

\- send email

\- send SMS

\- make outbound call

\- transfer call

\- create lead

\- send follow-up



When duplicate suppressed:

\- canonical result should indicate suppression

\- no external side effect should execute twice



\---



\## Session Control Messages



\### `session.pause`

Optional internal or client-safe control.

Purpose:

\- temporarily pause session flow under policy or UX control



\### `session.resume`

Purpose:

\- resume paused flow



\### `session.mode\_changed`

Purpose:

\- runtime mode changes

Examples:

\- `normal`

\- `cost\_constrained`

\- `compliance\_constrained`

\- `degraded`

\- `hard\_stop`



Payload fields:

\- `newMode`

\- `reasonCode`

\- `displayMessage` optional



\---



\## Audio Contract Details



\### Input Audio Canonical Requirements

\- sample rate target: 16kHz

\- mono

\- PCM 16-bit little-endian

\- chunk-based streaming

\- sequence ordered



\### Output Audio Canonical Requirements

\- sample rate target: 24kHz

\- mono

\- PCM 16-bit little-endian

\- chunk-based streaming

\- playbackSegmentId required for interruption and tracking



\### Audio Chunk Rules

\- every chunk must be sequence-aware

\- missing or out-of-order chunks should be detectable

\- gateway may buffer minimally but must avoid latency inflation

\- client player must support immediate stop on barge-in



\### Audio Metadata Fields

For every audio stream segment:

\- `sequenceNumber`

\- `sampleRateHz`

\- `encoding`

\- `channels`

\- `chunkDurationMs`

\- `streamDirection`: enum (`input`, `output`)

\- `utteranceId` or `playbackSegmentId` where applicable



\---



\## Barge-In Contract



Barge-in must be explicit and low-latency.



\### Required behavior

1\. client detects or triggers interrupt condition

2\. client stops local playback immediately

3\. client sends `barge\_in.request`

4\. gateway marks current response interrupted

5\. gateway notifies Gemini/provider interruption if supported

6\. gateway stops forwarding stale output chunks

7\. gateway resumes user input priority path



\### Required correlation fields

\- `activePlaybackSegmentId`

\- `interruptedResponseId`

\- `interruptTimestamp`

\- `cause`



\### Rules

\- interruption must be idempotent

\- repeated barge\_in messages for same active segment should not destabilize state

\- stale output must not continue to queue after acknowledged interruption



\---



\## Policy and Fallback Messaging Contract



The client should not receive raw internal policy data, but it may receive sanitized behavioral signals.



\### `policy.notice`

Optional client-safe message.

Purpose:

\- indicate a constrained or blocked state in sanitized form



Payload fields:

\- `policyState`: enum (`confirmation\_required`, `approval\_pending`, `feature\_unavailable`, `after\_hours\_restriction`, `compliance\_block`, `cost\_constrained`)

\- `displayMessage`



\### `action.denied`

Optional client-safe message.

Purpose:

\- indicate that a requested user-facing action cannot proceed



Payload fields:

\- `actionKey`

\- `reasonCode`

\- `displayMessage`

\- `fallbackAvailable`: boolean



\---



\## Observability and Metrics Messages



The system may expose internal metrics only where appropriate and safe.



\### Internal-only event fields should support:

\- `latencyMs`

\- `providerLatencyMs`

\- `toolLatencyMs`

\- `queueLatencyMs`

\- `sessionCostSnapshot`

\- `tokenUsageSnapshot`

\- `currentRuntimeMode`

\- `traceId`

\- `spanId`



\### Optional sanitized client-safe session metrics

\- `estimatedLatencyClass`: enum (`low`, `moderate`, `high`)

\- `mode`: enum (`normal`, `degraded`)



Do not leak internal cost numbers or private reasoning to the end user unless explicitly designed.



\---



\## Error Contract



All structured errors must include:



\- `errorCode`

\- `errorClass`: enum (`auth`, `validation`, `provider`, `policy`, `network`, `runtime`, `internal`)

\- `retryable`

\- `severity`

\- `humanMessage`

\- `correlationId`

\- `details`: internal only where appropriate



Examples:

\- `AUTH\_INVALID\_TOKEN`

\- `AGENT\_NOT\_FOUND`

\- `VOICE\_NOT\_ALLOWED`

\- `PROVIDER\_STREAM\_FAILURE`

\- `TOOL\_EXECUTION\_TIMEOUT`

\- `POLICY\_DENIED\_OUTBOUND\_CALL`

\- `DUPLICATE\_ACTION\_SUPPRESSED`



\---



\## WebSocket Lifecycle Contract



\### Connection lifecycle states

\- `connecting`

\- `authenticating`

\- `initialized`

\- `accepted`

\- `streaming`

\- `paused`

\- `ending`

\- `closed`

\- `error`



Gateway and client should model these states consistently.



\### Close semantics

On close, include where possible:

\- close reason code

\- retryable indicator

\- final session state summary internal or sanitized



\---



\## Security Contract Rules



The client-facing protocol must never expose:

\- raw provider API keys

\- system prompts

\- hidden internal policy thresholds

\- privileged tenant override details

\- internal-only provider reference secrets



Auth token handling rules:

\- auth token only in `session.init` or approved secure handshake path

\- do not repeat auth token in every message after initialization

\- validate token before accepting stream

\- tie session to validated tenant/user/agent context



\---



\## Compatibility and Evolution Rules



When adding new message types:

\- add to protocol registry

\- document payload schema

\- define client handling behavior

\- define backward compatibility expectations



When deprecating message types:

\- support coexistence window

\- emit internal deprecation warnings

\- do not silently remove active client contracts



\---



\## Required Typed Schema Artifacts



Implement typed schema definitions for:

\- websocket message envelope

\- audio input metadata

\- audio output metadata

\- transcript events

\- session control events

\- tool call request/response events

\- runtime policy decision events

\- fallback events

\- error events



Use one canonical schema source where possible.

Do not duplicate message definitions across frontend, gateway, and tests manually.



Prefer:

\- shared TypeScript types

\- runtime validation schemas if applicable

\- JSON-schema or equivalent export if useful



\---



\## Required Test Scenarios for Contract Layer



Create validation for:



\### Session Initialization

\- valid init accepted

\- invalid token denied

\- invalid agent denied

\- unsupported audio format denied or downgraded safely



\### Audio Streaming

\- input chunk ordering preserved

\- output chunk ordering preserved

\- mixed binary/json modes handled correctly where supported



\### Transcript Events

\- partial then final transcript sequence valid

\- missing final transcript handled gracefully



\### Tool Calls

\- tool request correlates correctly

\- tool denial mapped correctly

\- tool success mapped correctly

\- duplicate tool response suppressed



\### Barge-In

\- playback stops immediately

\- interruption acknowledged once

\- stale audio not forwarded after interruption



\### Errors

\- provider failure mapped to canonical error

\- internal failure mapped safely

\- client receives sanitized error payload



\### Compatibility

\- unknown optional fields tolerated

\- older client message shape handled where supported



\---



\## Required Deliverables



Produce:



\- canonical message registry

\- shared type/schema definitions

\- gateway protocol adapter layer

\- provider-to-canonical event mapping layer

\- client-safe event mapping layer

\- idempotency correlation contract

\- contract validation tests

\- migration notes if legacy message shapes exist



\---



\## Success Criteria



This contract layer is complete when:



\- client/gateway communication is explicitly typed and versioned

\- Gemini/provider events are normalized into canonical gateway events

\- tool call and policy decisions have stable schemas

\- barge-in and interruption are explicitly represented

\- duplicate side effects can be suppressed deterministically

\- protocol evolution can occur without uncontrolled drift

\- real-time voice behavior remains low-latency and stable

