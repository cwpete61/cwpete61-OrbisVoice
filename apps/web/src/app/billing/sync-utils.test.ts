import { describe, expect, it, vi } from "vitest";
import { retrySyncUntilPaid, isPaidTier } from "./sync-utils";

describe("isPaidTier", () => {
  it("returns false for free and empty tiers", () => {
    expect(isPaidTier(null)).toBe(false);
    expect(isPaidTier(undefined)).toBe(false);
    expect(isPaidTier("free")).toBe(false);
  });

  it("returns true for paid tiers", () => {
    expect(isPaidTier("ltd")).toBe(true);
    expect(isPaidTier("starter")).toBe(true);
  });
});

describe("retrySyncUntilPaid", () => {
  it("retries until a paid tier is returned", async () => {
    const syncOnce = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce("free")
      .mockResolvedValueOnce("free")
      .mockResolvedValueOnce("ltd");

    const result = await retrySyncUntilPaid(syncOnce, { maxAttempts: 4, waitMs: 1 });

    expect(result).toEqual({ upgraded: true, tier: "ltd", attempts: 3 });
    expect(syncOnce).toHaveBeenCalledTimes(3);
  });

  it("returns not upgraded after max attempts", async () => {
    const syncOnce = vi.fn<() => Promise<string | null>>().mockResolvedValue("free");

    const result = await retrySyncUntilPaid(syncOnce, { maxAttempts: 3, waitMs: 1 });

    expect(result).toEqual({ upgraded: false, tier: "free", attempts: 3 });
    expect(syncOnce).toHaveBeenCalledTimes(3);
  });
});
