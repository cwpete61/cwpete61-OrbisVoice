# Project Roadmap - Incremental Dependency Updates

## Goal
Safely modernize the project's dependency stack by performing incremental, isolated updates. This avoids "dependency hell" and ensures that regressions can be caught and fixed quickly.

## Status: 75% Complete

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

## Phase 6: Framework Update - Next.js (Web)
Perform the final major update for the frontend framework.

### Tasks
- [] Update `next`, `react`, and `react-dom`
- [ ] Verify component rendering and routing
- [ ] Perform visual regression check (screenshots)
