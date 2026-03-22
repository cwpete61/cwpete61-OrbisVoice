# Batch ID

PH3-B004

# Scope

- `apps/web/src/app/admin/payouts/page.tsx`

# Intent

Remove unused state variable (`affiliates`) from the payouts admin page as Phase 3 Pass 1 dead code cleanup.

# Reason

Phase 3 Pass 1 prioritizes low-risk cleanup. `const [affiliates, setAffiliates] = useState<any[]>([])` was declared but neither the value `affiliates` nor the setter `setAffiliates` was ever referenced anywhere in the file — the variable was entirely inert. Removing it reduces noise and clarifies intent.

# Risk

Low — removed a state variable that had no side effects or references. The `useState` hook call was completely inert.

# Changes

- `admin/payouts/page.tsx:9`: Removed `const [affiliates, setAffiliates] = useState<any[]>([]);` — dead state declaration with no usages of either the value or the setter.

# Validation

- `pnpm --filter orbisvoice-web typecheck`
  - Checked TypeScript correctness after cleanup. Exit code 0.
- `pnpm --filter orbisvoice-web exec vitest run`
  - Checked unit tests still pass. 3 test files, 7 tests, all passed.

# Result

Pass.

# Rollback Note

Revert `apps/web/src/app/admin/payouts/page.tsx` to restore the `affiliates` state declaration.

# Next Safe Step

Continue Phase 3 Pass 1 cleanup in `apps/web` — scan remaining auth pages and admin pages for unused state, dead constants, or commented-out code blocks.
