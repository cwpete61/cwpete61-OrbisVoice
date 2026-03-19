import { describe, expect, it } from "vitest";
import { pickEffectiveTenantId } from "./admin-scope";

describe("pickEffectiveTenantId", () => {
  it("prefers the system admin tenant when available", () => {
    expect(pickEffectiveTenantId("tenant-admin", "tenant-user")).toBe("tenant-admin");
  });

  it("falls back to the user tenant when admin tenant is missing", () => {
    expect(pickEffectiveTenantId(null, "tenant-user")).toBe("tenant-user");
    expect(pickEffectiveTenantId(undefined, "tenant-user")).toBe("tenant-user");
  });
});
