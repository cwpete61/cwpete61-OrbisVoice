# Phase 3 — Batch 008 Report

## Target

Extract 5-level nested nav visibility conditional from `DashboardShell.tsx` into a pure function.

## Change

### `apps/web/src/app/components/DashboardShell.tsx`

**Added `NavItem` type** (before `TYPE_LABELS`):

```ts
type NavItem = {
  label: string;
  href: string;
  category: string;
  icon?: React.ReactNode;
  isSystemAdminOnly?: boolean;
  isAdminOnly?: boolean;
  isAffiliateHidden?: boolean;
};
```

**Added `shouldShowNavItem` pure function** (replaces 18-line nested conditional):

```ts
const shouldShowNavItem = (item: NavItem, profile: User | null | undefined): boolean => {
  const isSystemAdmin = profile?.role === "SYSTEM_ADMIN";
  const isAffiliateOnly =
    typeof profile?.isAffiliate === "boolean" ? profile.isAffiliate && !profile.isAdmin : false;

  if (item.isSystemAdminOnly && !isSystemAdmin) return false;
  if (item.isAdminOnly && !profile?.isAdmin) return false;
  if (item.isAffiliateHidden && isAffiliateOnly) return false;

  if (item.label === "My Affiliate Partnership") {
    return !!(profile?.isAdmin || profile?.isAffiliate);
  }
  return true;
};
```

**Simplified filter** at line ~580 (was 19 lines, now 1 line):

```ts
const items = (NAV as NavItem[]).filter(
  (item) => item.category === cat && shouldShowNavItem(item, profile)
);
```

## Impact

- Reduced nav item filtering from ~19 lines (3-level nested, 5 boolean guards) to 1 line
- Replaced `as any[]` with typed `NavItem[]`
- Added missing `icon` property to the `NavItem` type (was previously `any`)
- `shouldShowNavItem` is now independently testable and reusable

## Validation

- `pnpm --filter orbisvoice-web typecheck` — ✅ Clean
- `pnpm --filter orbisvoice-api typecheck` — ✅ Clean
- No vitest scripts in either package
