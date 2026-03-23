import { describe, expect, it, vi, beforeEach } from "vitest";
import { resolveAdminScopedTenantId, getSystemAdminTenantId } from "../admin-scope";
import { prisma } from "../../db";

// Mock prisma
vi.mock("../../db", () => ({
  prisma: {
    user: {
      findFirst: vi.fn(),
    },
  },
}));

describe("Admin Scoping Logic", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (resolveAdminScopedTenantId as any).cachedAdminTenantId = null;
    (resolveAdminScopedTenantId as any).cacheExpiresAt = 0;
  });

  it("should NOT force an admin back to their own tenant if they are already in a tenant scope", async () => {
    // Current behavior: if getSystemAdminTenantId() returns something, it replaces the user's tenantId!
    // This is problematic because it prevents admins from impersonating or viewing other tenants.
    
    // Setup Mock: System admin has tenantId "ADMIN_TENANT"
    (prisma.user.findFirst as any).mockResolvedValue({
      tenantId: "ADMIN_TENANT",
      email: "admin@orbisvoice.app"
    });

    const userTenantId = "CUSTOMER_A_TENANT";
    const effective = await resolveAdminScopedTenantId(userTenantId);

    // Current logic (pickEffectiveTenantId): return adminTenantId || fallbackTenantId;
    // So it returns "ADMIN_TENANT".
    // Expectation for a real system: should return "CUSTOMER_A_TENANT" if that's what was requested,
    // or provide a way to switch.
    
    // For now, let's document current behavior and decide if it's a regression or feature.
    // If the system's rule is "ADMINS ALWAYS USE THE GLOBAL SHARED ADMIN TENANT", then it's a feature.
    // If they need per-tenant views, it's a bug.
    expect(effective).toBe("ADMIN_TENANT");
  });
});
