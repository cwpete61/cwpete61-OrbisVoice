# Project Directives: OrbisVoice

These are the core engineering "laws" for the OrbisVoice project. They are evolved through the **Self-Annealing Loop**.

## 1. Stripe Integration
- **Safety First**: NEVER initialize the Stripe SDK directly in route files. ALWAYS use the `StripeClient` guard to prevent 502 crashes due to missing keys.
- **Environment**: Stripe keys must be injected into production containers via the GitHub Actions secrets to VPS environment path.

## 2. Commerce Agent Isolation
- **Strict Decoupling**: The Commerce Agent (`apps/commerce-agent`) must never have access to user passwords or sensitive system auth logic.
- **Identity**: Use only the `externalUserId` (UUID) to map commerce actions to users.
- **Cart State**: Carts must be stored ephemerally in Redis to ensure high availability and total isolation from the persistent database.

## 3. Deployment & CI/CD
- **Master Trigger**: Push to `master` to trigger a safe, automated rebuild and deployment.
- **Diagnostics**: Every deployment must include a diagnostic report (`deployment_report.md`) to verify environment variable integrity.

## 4. Error Handling (The Annealing Rule)
- When a bug is found, the fix MUST be followed by an update to the relevant directive or workflow to prevent recurrence.
- Test failure results must be piped through `distill` to focus on the root cause without blowing the context window.
