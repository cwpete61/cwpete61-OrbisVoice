import { describe, expect, it, vi, beforeEach } from "vitest";
import { UsageService } from "../usage-service";
import { prisma } from "../../db";

// Mock Prisma
vi.mock("../../db", () => ({
  prisma: {
    tenant: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe("UsageService Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("canStartSession", () => {
    it("denies access when creditBalance is 0", async () => {
      (prisma.tenant.findUnique as any).mockResolvedValue({
        id: "tenant-1",
        creditBalance: 0,
        usageCount: 0,
        usageLimit: 100,
        usageResetAt: new Date(Date.now() + 100000),
      });

      const res = await UsageService.canStartSession("tenant-1");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Insufficient credit balance");
    });

    it("denies access when usage limit is reached and no bonus credits", async () => {
      (prisma.tenant.findUnique as any).mockResolvedValue({
        id: "tenant-1",
        creditBalance: 10.0,
        usageCount: 100,
        usageLimit: 100,
        bonusCredits: 0,
        usageResetAt: new Date(Date.now() + 100000),
      });

      const res = await UsageService.canStartSession("tenant-1");
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain("Monthly conversation limit reached");
    });

    it("allows access when usage limit is reached but bonus credits exist", async () => {
      (prisma.tenant.findUnique as any).mockResolvedValue({
        id: "tenant-1",
        creditBalance: 10.0,
        usageCount: 100,
        usageLimit: 100,
        bonusCredits: 50,
        usageResetAt: new Date(Date.now() + 100000),
      });

      const res = await UsageService.canStartSession("tenant-1");
      expect(res.allowed).toBe(true);
    });
  });

  describe("finalizeSessionUsage", () => {
    it("deducts credits correctly", async () => {
      const tenantId = "tenant-1";
      const revenue = 1.25;

      await UsageService.finalizeSessionUsage(tenantId, revenue);

      expect(prisma.tenant.update).toHaveBeenCalledWith({
        where: { id: tenantId },
        data: {
          usageCount: { increment: 1 },
          creditBalance: { decrement: revenue },
        },
      });
    });
  });

  describe("reset logic", () => {
    it("resets usageCount when reset timer expires", async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1); // Yesterday

      (prisma.tenant.findUnique as any).mockResolvedValue({
        id: "tenant-1",
        usageCount: 50,
        usageResetAt: pastDate,
      });

      await UsageService.getEffectiveUsage("tenant-1");

      // Verify reset happens
      expect(prisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            usageCount: 0,
          }),
        })
      );
    });
  });
});
