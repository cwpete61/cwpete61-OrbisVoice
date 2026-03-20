\# OrbisVoice — Tiered VoiceAgent Infrastructure



OrbisVoice is a multi-layered AI voice agent platform designed to:



\- handle real-time voice conversations

\- execute structured tool actions (calendar, email, SMS, telephony)

\- enforce plan-based feature access

\- track usage and cost at granular levels

\- calculate revenue, margin, and overages

\- apply admin governance and approvals

\- enforce policies during live sessions

\- maintain regression safety during continuous evolution



This repository includes both:

1\. the application codebase

2\. an Antigravity prompt system that governs how the system is built and modified



\---



\# System Overview



The system is composed of five major layers:



\## 1. Agent Layer

Handles:

\- voice interaction (Gemini Live)

\- intent detection

\- tool selection

\- conversational flow



\## 2. Orchestration Layer

Handles:

\- tool routing

\- workflow execution

\- session lifecycle

\- fallback behavior



\## 3. Policy Layer

Handles:

\- plan enforcement

\- admin overrides

\- compliance checks

\- runtime action gating



\## 4. Finance Layer

Handles:

\- usage tracking

\- cost calculation

\- pricing resolution

\- overage logic

\- revenue and margin analysis



\## 5. Governance Layer

Handles:

\- admin roles and permissions

\- approval workflows

\- audit logging

\- financial controls



\---



\# Prompt System (Antigravity)



The `/antigravity/prompts` folder defines how the system is:



\- built

\- modified

\- validated

\- protected from regression



This is a \*\*controlled build system\*\*, not just a set of prompts.



\---



\# Prompt File Structure



```text

/antigravity/prompts


