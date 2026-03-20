\# Realtime Performance and Latency Optimization

\## Low-Latency Voice System Design, Measurement, and Enforcement (<500ms Target)



You are responsible for designing, enforcing, and continuously optimizing the real-time performance of the OrbisVoice voice system.



This system must achieve:

\- conversational responsiveness

\- low perceived latency

\- stable streaming

\- predictable performance under load



The target is:



<500ms glass-to-glass latency



This includes:

\- audio capture

\- transport to gateway

\- processing by Gemini Live

\- return audio generation

\- playback start on client



\---



\## Primary Objective



Ensure that the system:

\- responds quickly enough to feel natural

\- avoids jitter and buffering artifacts

\- maintains consistent streaming behavior

\- scales without degrading latency significantly



Latency must be measured, not assumed.



\---



\## Latency Budget Breakdown



Define a target budget across components:



\### Client Capture

\- 10–40 ms



\### Client → Gateway Transport

\- 20–60 ms



\### Gateway Processing

\- 5–20 ms (non-blocking)



\### Gateway → Gemini

\- 20–60 ms



\### Gemini First Token / Audio

\- 100–250 ms (target)



\### Gateway → Client Return

\- 20–60 ms



\### Client Playback Start

\- 10–40 ms



\---



\### Total Target

\- 200–450 ms typical

\- 500 ms maximum acceptable



\---



\## Performance Principles



1\. Streaming over batching

2\. Binary audio over base64 when possible

3\. Avoid blocking operations

4\. Parallelize where safe

5\. Keep payloads minimal

6\. Minimize serialization/deserialization

7\. Maintain tight control of buffers

8\. Optimize for first response, not total response

9\. Prioritize interruption responsiveness (barge-in)

10\. Measure continuously



\---



\## Client-Side Optimization



\### Audio Capture



Use:

\- AudioWorklet (already implemented)



Requirements:

\- avoid main-thread processing

\- maintain 16kHz mono PCM

\- keep chunk size small (20–60 ms recommended)



Avoid:

\- ScriptProcessorNode

\- large buffer batching



\---



\### Audio Playback



Use:

\- AudioContext + scheduled buffers



Requirements:

\- gapless playback

\- precise scheduling using `currentTime`

\- fast stop on interruption



\---



\### Playback Optimization



\- pre-buffer minimal frames

\- avoid large playback queues

\- flush queue on barge-in

\- track playbackSegmentId



\---



\## WebSocket Optimization



\### Transport Mode



Preferred:

\- binary frames for audio



Fallback:

\- base64 JSON only if necessary



\---



\### Connection Strategy



\- keep persistent WebSocket open

\- avoid reconnect churn

\- use heartbeat/ping



\---



\### Message Handling



\- do not block on message processing

\- separate audio vs control paths

\- use async handlers



\---



\## Gateway Optimization



\### Event Loop Safety



Must:

\- avoid synchronous blocking calls

\- avoid heavy CPU tasks inline

\- use async I/O everywhere



\---



\### Streaming Design



\- forward audio immediately

\- do not accumulate large buffers

\- maintain backpressure awareness



\---



\### Parallel Execution



Where possible:

\- continue streaming while tool executes

\- do not stall audio output unnecessarily



\---



\### Internal Queues



Keep queues:

\- small

\- bounded

\- monitored



Avoid:

\- unbounded growth

\- long processing pipelines



\---



\## Gemini Live Optimization



\### Session Setup



\- reuse connections where possible

\- avoid repeated initialization overhead

\- preconfigure system prompt and voice



\---



\### Input Strategy



\- stream partial audio early

\- do not wait for full utterance

\- use incremental turns if supported



\---



\### Output Strategy



\- stream audio immediately upon availability

\- prioritize first audio chunk latency



\---



\### Tool Calls



\- execute asynchronously

\- return quickly

\- avoid long blocking tasks



If tool is slow:

\- use partial response + follow-up



\---



\## Barge-In Optimization



\### Requirements



\- interruption <100ms perceived delay



\### Strategy



Client:

\- detect speech early

\- stop playback immediately



Gateway:

\- stop forwarding output

\- cancel or interrupt Gemini stream if possible



System:

\- drop stale audio immediately



\---



\## Tool Execution Optimization



\### Fast Path



\- pre-validated tools

\- low-latency internal services



\### Slow Path



If tool >300ms:

\- inform user via response

\- continue conversation



\---



\### Caching



Use caching for:

\- calendar availability (short TTL)

\- FAQ retrieval

\- pricing rules



Avoid stale critical data.



\---



\## Telephony Optimization (Twilio)



\### Voice Calls



\- use low-latency regions

\- minimize call bridging delay

\- pre-warm Twilio connections where possible



\---



\### Media Streams



If used:

\- ensure minimal buffering

\- optimize audio encoding

\- avoid re-encoding loops



\---



\### SMS



\- async send

\- do not block voice flow



\---



\## Encoding and Payload Optimization



\### Audio Encoding



Use:

\- PCM 16-bit



Avoid:

\- unnecessary transcoding

\- lossy formats unless required



\---



\### Payload Size



\- keep control messages small

\- avoid redundant metadata

\- compress only if beneficial (measure first)



\---



\## Backpressure Handling



\### Detection



Monitor:

\- queue length

\- message delay

\- processing lag



\---



\### Response



If overload detected:

\- drop non-critical messages

\- degrade gracefully

\- reduce output chunk size

\- switch to constrained mode



\---



\## Adaptive Runtime Modes



System must support:



\### Modes



\- `normal`

\- `latency\_constrained`

\- `cost\_constrained`

\- `degraded`

\- `recovery`



\---



\### Mode Triggers



\- high latency

\- high error rate

\- provider slowdown

\- network instability



\---



\### Mode Actions



Examples:



Latency constrained:

\- reduce response verbosity

\- prioritize audio over text



Degraded:

\- fallback to text-only or limited audio

\- reduce tool usage



\---



\## Measurement and Observability



\### Required Metrics



Per session:



\- total latency

\- first audio latency

\- roundtrip latency

\- Gemini latency

\- tool latency

\- queue latency

\- audio chunk timing variance

\- interruption latency



\---



\### Logging



Log:



\- timestamps at each stage

\- sequence numbers

\- provider timings

\- errors



\---



\### Tracing



Use:



\- traceId

\- spanId



Track across:

\- client

\- gateway

\- provider

\- tool execution



\---



\## Latency Measurement Points



Capture timestamps at:



1\. audio capture start

2\. chunk send

3\. gateway receive

4\. gateway forward to Gemini

5\. Gemini response start

6\. gateway receive response

7\. gateway send to client

8\. playback start



Compute:

\- each segment latency

\- total latency



\---



\## Testing and Benchmarking



\### Test Scenarios



\- short utterance

\- long utterance

\- rapid interruptions

\- high concurrency

\- slow tool responses

\- network delay simulation



\---



\### Performance Targets



\- 95th percentile latency <500ms

\- 99th percentile <700ms

\- interruption latency <150ms



\---



\## Scaling Considerations



\### Horizontal Scaling



\- stateless gateway nodes

\- session affinity where required

\- distributed load balancing



\---



\### Resource Allocation



\- CPU for audio processing

\- memory for buffers

\- network bandwidth



\---



\### Auto-Scaling Triggers



\- active sessions

\- CPU usage

\- queue length

\- latency increase



\---



\## Failure and Degradation Strategy



If system degrades:



\- reduce audio quality slightly (if needed)

\- shorten responses

\- delay non-critical tool calls

\- fallback to text if required



Always preserve:

\- core conversation loop



\---



\## Anti-Patterns



Do NOT:



\- batch audio excessively

\- block gateway event loop

\- delay first response for completeness

\- over-buffer playback

\- perform heavy computation inline

\- serialize large JSON payloads unnecessarily

\- ignore latency metrics



\---



\## Validation Requirements



Verify:



\- latency targets met

\- no audio gaps

\- stable playback

\- interruption works reliably

\- system recovers from load spikes

\- tool calls do not stall conversation



\---



\## Deliverables



Produce:



\- latency instrumentation layer

\- metrics aggregation

\- performance dashboards

\- optimization patches

\- load test results

\- tuning configuration



\---



\## Success Criteria



System is complete when:



\- latency consistently under target

\- audio streaming is stable

\- interruptions are immediate

\- performance is measurable and visible

\- system adapts under load

\- user experience feels natural and responsive

