# What's Next? - OrbisVoice Roadmap

Based on the current state of **Phase 5 (Production Readiness)**, the following tasks are prioritized to bring the platform to a production-ready state.

## 1. Centralized Admin Panel 🛡️
Currently, admin features like Payouts, Users, and Affiliate Agents are spread across multiple top-level routes. We need a unified "Command Center".

- [ ] **Infrastructure**: Create `apps/api/src/routes/admin.ts` to provide aggregated platform metrics (MRR, total tenants, system health).
- [ ] **Dashboard**: Create `apps/web/src/app/admin/page.tsx` for a high-level overview.
- [ ] **Navigation**: Consolidate admin-only links in the `DashboardShell` under an "Admin" category.

## 2. Advanced Billing & Usage Visualization 💳
Enhance the billing experience to provide better transparency for users.

- [ ] **Components**: Implement `apps/web/src/app/components/PricingTable.tsx` for cleaner plan selection.
- [ ] **Analytics**: Implement `apps/web/src/app/components/UsageChart.tsx` to visualize conversation trends against plan limits.
- [ ] **Self-Service**: Integrate the Stripe Customer Portal for payment method management and invoice history.

## 3. API Documentation 📖
As the platform scales, documentation becomes critical for both internal development and potential external integrations.

- [ ] **Setup**: Configure `@fastify/swagger` and `@fastify/swagger-ui` in the API.
- [ ] **Documentation**: Annotate existing routes (Agents, Transcripts, Stats, Referrals) with OpenAPI specifications.

## 4. Environment & Dev-Ops Cleanup 🛠️
Resolve port conflicts and ensure a smooth local development workflow.

- [ ] **Port Harmonization**: Ensure API (4001), Web (3000), and Gateway (4005) are consistently configured across all `.env` files.
- [ ] **Mocking**: Enhance the test scripts to verify Stripe and Google integrations without hitting live production endpoints.

---

*Last Updated: February 22, 2026*
