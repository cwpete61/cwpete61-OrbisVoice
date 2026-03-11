# Project Roadmap - Incremental Dependency Updates

## Goal
Safely modernize the project's dependency stack by performing incremental, isolated updates. This avoids "dependency hell" and ensures that regressions can be caught and fixed quickly.

## Status: 100% Complete

---

## Phase 1: Initial Audit & Low-Risk Web Updates [COMPLETED]
Perform a full audit of `apps/web` dependencies and update non-breaking minor/patch versions.

### Tasks
- [x] Run `npm outdated` in `apps/web`
- [x] Update utility libraries (axios, lodash, etc.) to latest minor/patch
- [x] Verify build and typecheck
- [x] Commit stable state

---

## Phase 2: Initial Audit & Low-Risk API Updates [COMPLETED]
Perform a full audit of `apps/api` dependencies and update non-breaking minor/patch versions.

### Tasks
- [x] Run `npm outdated` in `apps/api`
- [x] Update utility libraries (bcryptjs, nodemailer, etc.) to latest minor/patch
- [x] Verify build and typecheck
- [x] Commit stable state

---

## Phase 3: Monorepo Tooling & devDependencies [COMPLETED]
Update development tools across the entire project to ensure modern linting and typechecking.

### Tasks
- [x] Update `typescript`, `eslint`, and `prettier` across monorepo
- [x] Synchronize `devDependencies` in all apps
- [x] Verify global lint and typecheck
- [x] Commit stable state
- [ ] Ensure `npm run lint` and `npm run typecheck` pass globally

---

## Phase 4: Upgrade Prisma [COMPLETED]
Update `prisma` and `@prisma/client` to the 6.x baseline. Requires careful schema/migration validation.

### Tasks
- [x] Audit current schema and migrations
- [x] Update Prisma dependencies in `apps/api`
- [x] Run `npx prisma generate`
- [x] Verify API connectivity and query resolution
- [x] Commit stable state

---

## Phase 5: Framework Update - Fastify (API) [COMPLETED]
Perform a major update of the API framework.

### Tasks
- [x] Update `fastify` and all `@fastify/*` plugins
- [x] Verify logger configuration and plugin initialization
- [x] Test all core API endpoints

---

## Phase 6: Framework Update - Next.js (Web) [COMPLETED]
Perform the final major update for the frontend framework.

### Tasks
- [x] Update `next`, `react`, and `react-dom`
- [x] Verify component rendering and routing
- [x] Perform visual regression check (screenshots)

---

## Phase 7: Update General Utilities [COMPLETED]
Update utility libraries across the entire monorepo.
### Tasks
- [x] Upgrade `dotenv`, `uuid`, `bcryptjs`, and `@types/node` globally.
- [x] Upgrade `google-auth-library` and `nodemailer` in `apps/api`.
- [x] Upgrade `pino` and `pino-pretty` to v10.

---

## Phase 8: Upgrade Vitest (v1 -> v4) [COMPLETED]
Updates the test runner.
### Tasks
- [x] Update `vitest` and `@vitest/ui` globally.
- [x] Verify test suite runs (if any exist).

---

## Phase 9: ESLint Flat Config Migration (v8 -> v9+) [COMPLETED]
Migrates monorepo linting to the modern ESLint v9 Flat Config paradigm.
### Tasks
- [x] Rewrite `apps/web/.eslintrc.json` to `eslint.config.mjs`.
- [x] Rewrite backend ESLint configs.
- [x] Update `eslint`, `@typescript-eslint/*`, and `eslint-config-next` globally.
- [x] Run `npm run lint` and verify.

---

## Phase 10: TailwindCSS Migration (v3 -> v4) [ABORTED]
Drafts upgrade for Tailwind CSS, aborted for Turbopack stability.
### Tasks
- [x] Update `tailwindcss` and `postcss` in `apps/web`. (Reverted for stability)
- [x] Migrate `tailwind.config.ts/js` into `globals.css` using the v4 paradigm. (Reverted)
- [x] Verify frontend build and layout visuals.


