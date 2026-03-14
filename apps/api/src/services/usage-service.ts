import { prisma } from "../db";
import { logger } from "../logger";

export class UsageService {
  /**
   * Check if a tenant has remaining credits and reset monthly usage if needed.
   */
  static async getEffectiveUsage(tenantId: string) {
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) throw new Error("Tenant not found");

    // Monthly reset logic (lazy reset)
    const now = new Date();
    if (tenant.usageResetAt < now) {
      // Calculate next reset date (one month from the previous reset date or now)
      let nextReset = new Date(tenant.usageResetAt);
      while (nextReset < now) {
        nextReset.setMonth(nextReset.getMonth() + 1);
      }

      logger.info({ tenantId, oldResetAt: tenant.usageResetAt, newResetAt: nextReset }, "Performing monthly usage reset");

      return await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          usageCount: 0,
          usageResetAt: nextReset,
        },
      });
    }

    return tenant;
  }

  /**
   * Increment usage for a session.
   * Priority: Monthly Limit -> Bonus Credits
   */
  static async recordUsage(tenantId: string) {
    const tenant = await this.getEffectiveUsage(tenantId);

    // 1. Try to use monthly allowance
    if (tenant.usageCount < tenant.usageLimit) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          usageCount: { increment: 1 },
        },
      });
      logger.debug({ tenantId }, "Monthly usage count incremented");
      return true;
    }

    // 2. Try to use bonus credits (rollover)
    if ((tenant as any).bonusCredits > 0) {
      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          bonusCredits: { decrement: 1 } as any,
        } as any,
      });
      logger.info({ tenantId }, "Bonus credits decremented (monthly limit reached)");
      return true;
    }

    // 3. No credits left
    logger.warn({ tenantId }, "Tenant has reached usage limit and has no bonus credits");
    return false;
  }

  /**
   * Check if tenant is allowed to start a new session
   */
  static async canStartSession(tenantId: string): Promise<boolean> {
    const tenant = (await this.getEffectiveUsage(tenantId)) as any;
    return tenant.usageCount < tenant.usageLimit || tenant.bonusCredits > 0;
  }
}
