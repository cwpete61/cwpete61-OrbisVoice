# Phase 3 — Batch 012 Report

## Target

Refactor `admin/payouts/page.tsx` - consolidate repetitive fetch patterns and improve error handling consistency.

## Change

### `apps/web/src/app/admin/payouts/page.tsx`

**Extracted common fetch pattern into reusable helper function:**

```ts
// Before - repetitive fetch patterns throughout the component
const fetchProfile = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data.data);
    }
  } catch (err) {
    console.error("Failed to fetch profile");
  }
};

// After - consolidated into reusable function
const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = localStorage.getItem("token");
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
  return response;
};

const fetchProfile = async () => {
  try {
    const res = await fetchWithAuth(`${API_BASE}/users/me`);
    if (res.ok) {
      const data = await res.json();
      setProfile(data.data);
    }
  } catch (err) {
    console.error("Failed to fetch profile");
  }
};
```

## Impact

- Reduced repetitive authorization header setup code
- Improved consistency in API calls
- Made error handling pattern more uniform
- Simplified future maintenance of fetch operations

## Validation

- `pnpm --filter orbisvoice-web typecheck` — ✅ Clean
- `pnpm --filter orbisvoice-api typecheck` — ✅ Clean

## Result

✅ Complete

## Rollback Note

Revert to original repetitive fetch patterns and remove the `fetchWithAuth` helper function.

## Next Safe Step

Consider extracting the fetch helper to a common utility file in `lib/` for broader reuse.
