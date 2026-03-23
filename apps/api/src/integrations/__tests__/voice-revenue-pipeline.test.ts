import { describe, expect, it, vi, beforeEach } from "vitest";
import { PricingService } from "../../services/pricing";
import { UsageService } from "../../services/usage-service";
import { prisma } from "../../db";

// Mock utilities
vi.mock("../../db", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
    },
    pricingRegistry: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    transcript: {
      create: vi.fn(),
    }
  },
}));

describe("Voice Revenue Pipeline (Integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (PricingService as any).clearCache();
  });

  it("should successfully track session usage and deduct revenue from tenant credits", async () => {
    const tenantId = "tenant_test_123";
    
    // 1. Initial State: Tenant has $1.00 credit
    const initialTenant = {
      id: tenantId,
      name: "Test Tenant",
      creditBalance: 1.0,
      usageCount: 0,
      usageLimit: 1000,
      bonusCredits: 0,
      usageResetAt: new Date(Date.now() + 86400000),
    };

    (prisma.tenant.findUnique as any).mockResolvedValue(initialTenant);
    (prisma.tenant.update as any).mockImplementation(({ data }: any) => {
        // Simple simulation of credit deduction and usage increment
        if (data.creditBalance?.decrement) {
            initialTenant.creditBalance -= data.creditBalance.decrement;
        }
        if (data.usageCount?.increment) {
            initialTenant.usageCount += data.usageCount.increment;
        }
        return initialTenant;
    });

    // 2. Pre-Session Check (Can Start?)
    const preCheck = await UsageService.canStartSession(tenantId);
    expect(preCheck.allowed).toBe(true);

    // 3. Post-Session Finalization (Gateway sends metrics)
    // Scenario: Heavy session with tools ($0.25 revenue)
    const usageMetrics = {
      inputTokens: 10000,   // ~ $0.01 cost -> $0.03 rev
      outputTokens: 5000,   // ~ $0.01 cost -> $0.03 rev
      durationSeconds: 60,  // 1 min -> $0.15 rev
      toolsCalled: 1,       // 1 tool -> $0.05 rev
    };

    // Mock pricing registry for predictable numbers
    (prisma.pricingRegistry.findUnique as any).mockResolvedValue({
      id: "global",
      inputTokenPrice: 0.000001,
      outputTokenPrice: 0.000002,
      minutePrice: 0.01,
      smsPrice: 0.05,
      toolCallPrice: 0.005,
      retailInputTokenPrice: 0.000003,
      retailOutputTokenPrice: 0.000006,
      retailMinutePrice: 0.15,
      retailToolCallPrice: 0.05,
      minMarginPercent: 20
    });

    const pricing = PricingService.getInstance();
    const finance = await pricing.calculateSessionFinance(usageMetrics);

    // Calc check:
    // Rev Input: 10000 * 0.000003 = 0.03
    // Rev Output: 5000 * 0.000006 = 0.03
    // Rev Minutes: 1 * 0.15 = 0.15
    // Rev Tools: 1 * 0.05 = 0.05
    // Total Revenue = 0.03+0.03+0.15+0.05 = 0.26
    expect(finance.revenue).toBe(0.26);

    // 4. Finalize
    await UsageService.finalizeSessionUsage(tenantId, finance.revenue);

    // 5. Final State Check
    expect(initialTenant.creditBalance).toBe(0.74); // 1.0 - 0.26
    expect(initialTenant.usageCount).toBe(1);
    
    // 6. Verify blocking when empty
    initialTenant.creditBalance = 0;
    const postEmptyCheck = await UsageService.canStartSession(tenantId);
    expect(postEmptyCheck.allowed).toBe(false);
  });
});
