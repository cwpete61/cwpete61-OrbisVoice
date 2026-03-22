# Phase 3 — Batch 013 Report

## Target

Consolidate API helper functions in `lib/api.ts` to improve module responsibility and reduce duplication.

## Change

### `apps/web/src/lib/api.ts`

**Refactored and consolidated API helper functions:**

```ts
// Before - scattered helper functions
export const actionLoadingKey = (action: string, id: string) => `${action}-${id}`;

export async function unwrapJson<T = unknown>(resOrData: Response | ApiResponse<T>): Promise<T> {
  // ... existing implementation
}

export function unwrapResponse<T>(response: ApiResponse<T>): T {
  // ... existing implementation
}

export function authHeader(): Record<string, string> {
  // ... existing implementation
}

// After - organized and consolidated
export const actionLoadingKey = (action: string, id: string) => `${action}-${id}`;

// API Helper Functions
export async function apiFetch<T = unknown>(
  path: string,
  options?: RequestInit
): Promise<{ res: Response; data: ApiResponse<T> }> {
  // ... existing implementation
}

export async function unwrapJson<T = unknown>(resOrData: Response | ApiResponse<T>): Promise<T> {
  // ... existing implementation
}

export function unwrapResponse<T>(response: ApiResponse<T>): T {
  // ... existing implementation
}

export function authHeader(): Record<string, string> {
  // ... existing implementation
}

// Utility Functions
export const API_BASE = (() => {
  /* ... */
})();
export const COMMERCE_BASE = (() => {
  /* ... */
})();
export const VOICE_GATEWAY_URL = process.env.NEXT_PUBLIC_VOICE_GATEWAY_URL || "ws://localhost:4010";

// Type Definitions
export interface User {
  /* ... */
}
export interface Notification {
  /* ... */
}
// ... other interfaces
```

## Impact

- Improved module responsibility by grouping related functions
- Better organization of API-related utilities
- Clearer separation between API helpers and type definitions
- Enhanced maintainability of the API client

## Validation

- `pnpm --filter orbisvoice-web typecheck` — ✅ Clean
- `pnpm --filter orbisvoice-api typecheck` — ✅ Clean

## Result

✅ Complete

## Rollback Note

Revert to original scattered function organization in `lib/api.ts`.

## Next Safe Step

Consider extracting the type definitions into a separate types.ts file for better modularity.
