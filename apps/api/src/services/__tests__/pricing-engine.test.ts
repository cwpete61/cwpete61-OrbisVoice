import { describe, expect, it, vi, beforeEach } from "vitest";
import { PricingService } from "../pricing";
import { prisma } from "../../db";

// Mock Prisma
vi.mock("../../db", () => ({
  prisma: {
    pricingRegistry: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe("PricingService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PricingService.clearCache();
  });

  it("calculates session finance correctly with default fallback", async () => {
    // Mock registry not found to trigger fallback
    (prisma.pricingRegistry.findUnique as any).mockResolvedValue(null);
    (prisma.pricingRegistry.create as any).mockResolvedValue({
      id: "global",
      inputTokenPrice: 0.00000035,
      outputTokenPrice: 0.00000105,
      minutePrice: 0.015,
      smsPrice: 0.05,
      toolCallPrice: 0.005,
      minMarginPercent: 20,
    });

    const usage = {
      inputTokens: 1000,
      outputTokens: 500,
      durationSeconds: 120, // 2 minutes
      toolsCalled: 2,
    };

    const pricing = PricingService.getInstance();
    const finance = await pricing.calculateSessionFinance(usage as any);

    // Costs:
    // Input: 1000 * 0.00000035 = 0.00035
    // Output: 500 * 0.00000105 = 0.000525
    // Minutes: 2 * 0.015 = 0.03
    // Tools: 2 * 0.005 = 0.01
    // Total Cost = 0.040875 -> 0.0409 (fixed 4)

    // Revenues (fallback defaults):
    // Input: 1000 * (0.00000035 * 3) = 0.00105
    // Output: 500 * (0.00000105 * 3) = 0.001575
    // Minutes: 2 * 0.15 = 0.30
    // Tools: 2 * 0.05 = 0.10
    // Total Revenue = 0.402625 -> 0.4026 (fixed 4)

    // Margin = 0.402625 - 0.040875 = 0.36175 -> 0.3618 (fixed 4)

    expect(finance.cost).toBe(0.0409);
    expect(finance.revenue).toBe(0.4026);
    expect(finance.margin).toBe(0.3618);
    expect(finance.isLowMargin).toBe(false);
  });

  it("identifies low margin sessions", async () => {
    (prisma.pricingRegistry.findUnique as any).mockResolvedValue({
      id: "global",
      inputTokenPrice: 1.0, // Extremely expensive
      outputTokenPrice: 1.0,
      minutePrice: 1.0,
      smsPrice: 1.0,
      toolCallPrice: 1.0,
      minMarginPercent: 90, // Expect at least 90% margin
    });

    const usage = {
      inputTokens: 1,
      outputTokens: 1,
      durationSeconds: 60,
      toolsCalled: 0,
    };

    const pricing = PricingService.getInstance();
    const finance = await pricing.calculateSessionFinance(usage as any);
    
    // Revenue would be ~3x cost (6.0), margin ~66%, which is < 90%
    expect(finance.isLowMargin).toBe(true);
  });
});
