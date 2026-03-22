# Phase 3 — Batch 010 Report

## Target

Refactor `stats/page.tsx` — 3 repeated `res.ok` + `json()` unwrap blocks in `fetchStats`, raw `fetch` in `handleExport`.

## Changes

### `apps/web/src/lib/api.ts`

**Added `unwrapJson`** — handles both raw `Response` objects and pre-parsed `ApiResponse` data:

```ts
export async function unwrapJson<T = unknown>(resOrData: Response | ApiResponse<T>): Promise<T> {
  if (resOrData instanceof Response) {
    if (resOrData.status === 401) throw new Error("Session expired. Please log in again.");
    if (!resOrData.ok) {
      let msg = `HTTP ${resOrData.status}`;
      try {
        const j = await resOrData.json();
        msg = j?.message || msg;
      } catch {
        /* ignore */
      }
      throw new Error(msg);
    }
    return resOrData.json() as Promise<T>;
  }
  if (!resOrData.ok) throw new Error((resOrData as ApiResponse<T>).message || "Request failed");
  return (resOrData as ApiResponse<T>).data as T;
}
```

### `apps/web/src/app/stats/page.tsx`

**Refactored `fetchStats`** — replaced 3 repeated unwrap blocks with parallel `unwrapJson` calls:

```ts
// Before: 3× repeated pattern
const dashData = await resDash.json();
setDashboardStats(dashData.data);
if (resChart && resChart.ok) {
  const cData = await resChart.json();
  if (cData.ok) setChartData(cData.data);
}
if (resTrend && resTrend.ok) {
  const tData = await resTrend.json();
  if (tData.ok) setTrendData(tData.data);
}

// After: 3 parallel unwrapJson calls
const [dashData, cData, tData] = await Promise.all([
  unwrapJson<{ data: DashboardStats }>(dashRes),
  chartRes ? unwrapJson<{ data: StatsChartData[] }>(chartRes) : Promise.resolve(null),
  unwrapJson<{ data: any[] }>(trendRes),
]);
setDashboardStats(dashData.data);
if (cData) setChartData(cData.data);
if (tData) setTrendData(tData.data);
```

**Updated `handleExport`** — uses `authHeader()` helper instead of manual token extraction:

```ts
// Before
const token = localStorage.getItem("token");
const res = await fetch(`${API_BASE}/stats/export`, {
  headers: { Authorization: `Bearer ${token}` },
});

// After
const res = await fetch(`${API_BASE}/stats/export`, { headers: authHeader() });
```

## Impact

- `fetchStats` reduced from ~30 lines of mixed unwrap logic to 7 clean parallel calls
- `unwrapJson` provides consistent error handling (401, non-ok, JSON parse failures) in one place
- `unwrapJson` is reusable across both raw `Response` and pre-parsed `ApiResponse` objects

## Validation

- `pnpm --filter orbisvoice-web typecheck` — ✅ Clean
- `pnpm --filter orbisvoice-api typecheck` — ✅ Clean
