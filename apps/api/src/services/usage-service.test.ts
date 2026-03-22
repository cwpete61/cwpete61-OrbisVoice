import { describe, expect, it } from "vitest";
import { resolveUsageLimitForTier } from "./usage-service";

describe("resolveUsageLimitForTier", () => {
  it("uses global free tier limit when tier is free", () => {
    const limit = resolveUsageLimitForTier("free", {
      freeTierLimit: 42,
      starterLimit: 1000,
      professionalLimit: 10000,
      enterpriseLimit: 100000,
      ltdLimit: 1000,
      aiInfraLimit: 250000,
    });

    expect(limit).toBe(42);
  });

  it("falls back to default free limit when setting is missing", () => {
    const limit = resolveUsageLimitForTier("free", null);
    expect(limit).toBe(100);
  });

  it("uses enabled paid tier limit for free tier testing", () => {
    const limit = resolveUsageLimitForTier("free", {
      freeTierLimit: 50,
      starterLimit: 1000,
      professionalLimit: 10000,
      enterpriseLimit: 100000,
      ltdLimit: 1000,
      aiInfraLimit: 250000,
      freeToProfessionalEnabled: true,
    });

    expect(limit).toBe(10000);
  });

  it("chooses highest enabled testing tier", () => {
    const limit = resolveUsageLimitForTier("free", {
      freeTierLimit: 50,
      starterLimit: 1000,
      professionalLimit: 10000,
      enterpriseLimit: 100000,
      ltdLimit: 1000,
      aiInfraLimit: 250000,
      freeToStarterEnabled: true,
      freeToAiInfraEnabled: true,
    });

    expect(limit).toBe(250000);
  });
});
