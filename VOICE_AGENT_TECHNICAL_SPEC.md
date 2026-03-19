# OrbisVoice Technical Specification: AI Voice Agent System

This document provides a highly detailed technical breakdown of the OrbisVoice AI Voice Agent system. Its purpose is to guide an AI Developer in building a professional-grade, low-latency, and modular voice agent service that integrates with both the OrbisVoice SaaS platform and external commercial toolsets.

---

## 1. System Vision & Objective
**OrbisVoice** is a multi-tenant SaaS that allows businesses to deploy AI-driven voice agents. These agents are not simple chatbots; they are real-time, bidirectional voice services powered by **Google Gemini 2.0 Flash**, capable of understanding complex human intent and executing commercial actions (like checking carts, booking appointments, or processing payments) via function calling.

The primary goal is **low-latency interaction (<500ms glass-to-glass)** that feels as natural as a human conversation.

---

## 2. Technical Architecture

OrbisVoice uses a monorepo structure with microservices to separate concerns:

### A. **Voice Gateway (`apps/voice-gateway`)**
*   **Role**: The "Real-Time Bridge" and "Tool Orchestrator."
*   **Tech Stack**: Node.js, `ws` (WebSockets), TypeScript.
*   **Responsibility**:
    *   Maintains bidirectional WebSocket connections with clients (Web/Mobile/Twilio).
    *   Authenticates client tokens via the main API.
    *   Proxies audio streams to the **Gemini Multimodal Live API**.
    *   **Tool Call Interception**: This is the most critical logic. When Gemini requests a tool (e.g., `check_inventory`), the gateway intercepts the request, calls the relevant Orbis service or third-party API, and feeds the result back to Gemini in real-time.
    *   **Privacy**: Hides API keys and system prompts from the client.

### B. **Web App (`apps/web`)**
*   **Role**: Management Dashboard, Agent Builder, and Voice Widget.
*   **Tech Stack**: Next.js 14, React, TailwindCSS, TypeScript.
*   **Responsibility**:
    *   **Agent Builder**: UI to configure persona (system prompt), voice model, and tools.
    *   **Playground**: A testing environment where users can talk to their agent before deployment.
    *   **Widget**: An embeddable script for business websites.
    *   **Audio Logic**: Located in `apps/web/src/lib/audio-utils.ts`. Uses `AudioWorklet` for low-latency capture and `AudioContext` for buffer-scheduled playback.

### C. **Commerce Agent (`apps/commerce-agent`)**
*   **Role**: A specialized microservice for business logic tools.
*   **Responsibility**:
    *   Provides high-level actions: `cart_management`, `checkout_logic`, `order_status`.
    *   Is called as a "Tool" by the Voice Gateway.

---

## 3. Real-Time Audio Pipeline

### Pipeline Flow (Current & Intended):
1.  **Capture (Client)**: Microphone -> `AudioWorklet` captures 16kHz mono PCM (16-bit).
2.  **Streaming (WebSocket)**: Captured chunks are sent as binary or base64 messages to `Voice Gateway`.
3.  **Forwarding**: `Voice Gateway` forwards chunks to the **Gemini Multimodal Live API** (Websockets/BIDI-gRPC).
4.  **Generation (AI)**: Gemini processes audio and streams back model turns (text + audio).
5.  **Downstream (Gateway to Client)**: `Voice Gateway` sends 24kHz mono PCM chunks to the client.
6.  **Playback (Client)**: `AudioPlayer` (in `audio-utils.ts`) schedules buffers for gapless playback using `AudioContext.currentTime`.

---

## 4. Current Implementation State (Crucial - Do Not Miss)

> [!IMPORTANT]
> **We have already implemented a working prototype of the voice logic.** Do not start from scratch. Focus on migrating and unifying the following components:

### 1. The Playground Prototype
In `apps/web/src/app/components/AgentBuilderForm.tsx`, specifically the `startTalking` function (Line 273+), we have a working implementation of **Gemini Live** using the `@google/genai` SDK from the browser.
*   **Problem**: It currently bypasses the `voice-gateway` and requires the API key to be in the browser (insecure).
*   **Task for Developer**: Extract the `live.connect` logic from `AgentBuilderForm.tsx` and move it into the `Voice Gateway` service.

### 2. Audio Capture & Playback
The file `apps/web/src/lib/audio-utils.ts` contains battle-tested `AudioRecorder` and `AudioPlayer` classes. 
*   **Recorder**: Uses `AudioWorkletProcessor` for efficient audio capture without blocking the main thread.
*   **Player**: Handles PCM-to-Float32 conversion and gapless playback.

### 3. Voice Gateway Stub
The file `apps/voice-gateway/src/index.ts` is currently a basic WebSocket proxy using `generateContent` (unary). 
*   **Task for Developer**: Replace unary `generateContent` with the **Multimodal Live API** (`ai.live.connect` for the SDK or raw gRPC/WS) to achieve true low-latency.

---

## 5. Key Instructions for the AI Developer

1.  **Study the Blueprint**:
    *   Review `ARCHITECTURE.md` for the system overview.
    *   Study `apps/web/src/app/components/AgentBuilderForm.tsx` (the `startTalking` logic) to understand how the Gemini session is currently initialized.
    *   Study `apps/web/src/lib/audio-utils.ts` to understand how the client handles audio.

2.  **Unify the Gateway**:
    *   The `Voice Gateway` must become the single point of contact for voice.
    *   Client -> WS -> Gateway -> Gemini Live.
    *   Ensure the gateway can fetch Agent configurations (system prompt, voice ID) from the Backend API using the `agentId` provided during WebSocket initialization.

3.  **Implement Function Calling Orchestration**:
    *   Gemini will return `ToolCall` messages in the live stream.
    *   The Gateway must handle these calls asynchronously, call the corresponding service (like the Commerce Agent), and send the `ToolResponse` back to Gemini immediately to keep the conversation flowing.

4.  **Tenant Safety & Rate Limiting**:
    *   Verify tokens to ensure the `userId` owns the `agentId`.
    *   Implement basic usage tracking in the gateway (calls to the main API) so we can monitor consumption.

5.  **Error Handling**:
    *   Implement "Barge-in" handling: if the user starts talking while the AI is speaking, the `Voice Gateway` must notify Gemini (if applicable) and the client must stop its local playback immediately.

---

## 6. Development Context
*   **Database**: PostgreSQL via Prisma 6 (Schema is already defined).
*   **Service Communication**: Internal REST calls between gateway/api/commerce-agent.
*   **Environment**: Currently runs in Docker. See `docker-compose.yml` and `Dockerfile.voice-gateway`.

This system is designed to be the "Revenue Infrastructure" of the business. Every millisecond of latency reduced and every tool call perfected directly impacts the end-user's conversion rate.
