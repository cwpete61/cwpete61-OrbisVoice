# Batch ID

PH3-B005

# Scope

- `apps/web/src/app/stats/page.tsx`

# Intent

Remove unused interface and state declarations from the stats page as Phase 3 Pass 1 dead code cleanup.

# Reason

Phase 3 Pass 1 prioritizes low-risk cleanup. Three items were declared but never referenced anywhere in the file:

- `interface AgentStats` — unused interface
- `const [agentStats, setAgentStats] = useState<AgentStats[]>([])` — state with no usages of value or setter
- `const [selectedAgent, setSelectedAgent] = useState<string | null>(null)` — state with no usages of value or setter

Removing these reduces noise and clarifies that the stats page does not currently support per-agent filtering.

# Risk

Low — removed declarations that had zero references in the module. Behavior is unchanged.

# Changes

- `stats/page.tsx`: Removed `AgentStats` interface (10 lines) — dead interface declaration.
- `stats/page.tsx`: Removed `const [agentStats, setAgentStats] = useState<AgentStats[]>([])` — unused state.
- `stats/page.tsx`: Removed `const [selectedAgent, setSelectedAgent] = useState<string | null>(null)` — unused state.

# Validation

- `pnpm --filter orbisvoice-web typecheck`
  - Checked TypeScript correctness after cleanup. Exit code 0.
- `pnpm --filter orbisvoice-web exec vitest run`
  - Checked unit tests still pass. 3 test files, 7 tests, all passed.

# Result

Pass.

# Rollback Note

Revert `apps/web/src/app/stats/page.tsx` to restore the removed interface and state declarations.

# Next Safe Step

Continue Phase 3 Pass 1 cleanup in `apps/web` — scan remaining pages (auth callbacks, admin pages) for unused state, dead constants, or stale commented-out code.
