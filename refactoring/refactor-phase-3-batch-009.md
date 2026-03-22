# Phase 3 — Batch 009 Report

## Target

Refactor `admin/users/page.tsx` — 11 identical try/catch fetch patterns, duplicate `fetchUsers`/`fetchAffiliates`, manual loading key strings.

## Changes

### `apps/web/src/lib/api.ts`

**Added two helpers:**

```ts
export const actionLoadingKey = (action: string, id: string) => `${action}-${id}`;
export function unwrapResponse<T>(response: ApiResponse<T>): T {
  if (!response.ok) throw new Error(response.message || "Request failed");
  return response.data as T;
}
```

### `apps/web/src/app/admin/users/page.tsx`

**Refactored 9 handlers** to use `apiFetch` (eliminated manual `authHeader()` construction, manual JSON parsing, manual `res.ok` unwrapping):

| Handler                       | Before                               | After                      |
| ----------------------------- | ------------------------------------ | -------------------------- |
| `fetchUsers`                  | raw `fetch` + manual JSON            | `apiFetch` → `resp?.data`  |
| `fetchAffiliates`             | raw `fetch` + manual JSON            | `apiFetch` → `resp?.data`  |
| `handleUpdateAffiliateStatus` | raw `fetch` + 20 lines               | `apiFetch` → 8 lines       |
| `saveEditUser`                | raw `fetch` + 25 lines               | `apiFetch` → 16 lines      |
| `promoteToAffiliate`          | raw `fetch` + manual JSON + 18 lines | `apiFetch` → 15 lines      |
| `toggleBlockUser`             | raw `fetch` + 16 lines               | `apiFetch` → 7 lines       |
| `deleteUser`                  | raw `fetch` + 13 lines               | `apiFetch` → 5 lines       |
| `handleBulkDelete`            | sequential `for` loop + raw `fetch`  | `Promise.all` + `apiFetch` |
| `handleBulkBlock`             | sequential `for` loop + raw `fetch`  | `Promise.all` + `apiFetch` |
| `handleSetCustomRate`         | raw `fetch` + manual JSON            | `apiFetch`                 |

**Standardized loading keys:**

```ts
// Before (scattered, inconsistent)
setActionLoading(`save-${userId}`);
setActionLoading(`promote-${userId}`);
setActionLoading(`block-${user.id}`);
setActionLoading(`delete-${user.id}`);
setActionLoading(`rate-${aff.id}`);

// After (consistent helper)
setActionLoading(actionLoadingKey("save", userId));
setActionLoading(actionLoadingKey("promote", userId));
setActionLoading(actionLoadingKey("block", user.id));
setActionLoading(actionLoadingKey("delete", user.id));
setActionLoading(actionLoadingKey("rate", aff.id));
```

**Bulk operations converted from sequential to parallel:**

```ts
// Before
for (const id of selectedUserIds) {
    await fetch(`${API_BASE}/admin/users/${id}`, { method: "DELETE", ... });
}

// After
await Promise.all(selectedUserIds.map((id) =>
    apiFetch(`/admin/users/${id}`, { method: "DELETE" })
));
```

## Impact

- Eliminated ~120 lines of boilerplate fetch code across 10 handlers
- All 10 handlers now use the centralized `apiFetch` wrapper (auth headers, JSON parsing, 401 handling)
- Bulk delete/block now fire requests in parallel instead of sequentially
- `handleSetCustomRate` and `promoteToAffiliate` now properly type their response data

## Validation

- `pnpm --filter orbisvoice-web typecheck` — ✅ Clean
- `pnpm --filter orbisvoice-api typecheck` — ✅ Clean
