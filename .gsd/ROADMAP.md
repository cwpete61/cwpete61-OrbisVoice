# OrbisVoice Feature Roadmap

## Phase 1: Core Monorepo & Auth [COMPLETED]
Established foundational infrastructure, multi-tenant architecture, and authentication.

## Phase 2: Agent Management & Embedded Widget [COMPLETED]
Delivered agent creation UI and production-ready embedded widget.

## Phase 3: Gemini Voice Integration [COMPLETED]
Full voice streaming from client → gateway → Gemini → client response.

## Phase 4: Growth Loop (Referrals/Affiliates) [COMPLETED]
Monetization + acquisition engine (referrals/affiliates) fully operational.

## Phase 5: Monetization & Analytics [COMPLETED]
Centralized billing infrastructure, isolated Stripe Commerce Agent, and revenue analytics.

## Phase 6: Admin User Management [COMPLETED]
Broadened administrative access and aligned user management routes with frontend.

## Phase 7: Stripe Billing & Subscriptions [COMPLETED]
Full Stripe integration with Checkout, Portal, and Webhook-driven usage limits.

## Phase 8: Signup & Conversion Optimization [COMPLETED]
Free tier signup flow and dashboard upgrade prompts to drive conversion.

## Phase 9: Security & Admin Governance [COMPLETED]
Restrict sensitive settings access to administrators and harden backend route protection.

## Phase 11: Production Stability [COMPLETED]
Resolved critical 502 Bad Gateway error and hardened integration initializations.

## Phase 12: Code Quality & Maintenance [COMPLETED]
Resolve remaining linting warnings, optimize images, and refine TypeScript type safety across the monorepo.

---

## Phase 13: gitup [COMPLETED]
**Objective**: Set up direct VPS webhook-based deployment — replaces GitHub Actions with a ~90-second on-VPS build cycle.
**Depends on**: Phase 11

**Tasks**:
- [x] VPS Webhook Setup (01-PLAN.md)
- [x] GitHub Webhook Configuration
- [x] End-to-End Verification

**Verification**:
- [x] Health check returned ok
- [x] Webhook triggers build and deployment successfully
