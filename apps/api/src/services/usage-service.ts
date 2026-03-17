import { prisma } from "../db";
import { logger } from "../logger";
import { createNotification, NotifType } from "./notification";

const TIER_PRIORITY: Record<string, number> = {
  "free": 0,
  "starter": 1,
  "ltd": 2,
  "professional": 3,
  "enterprise": 4,
  "ai-revenue-infrastructure": 5,
};

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

  /**
   * Update tenant's subscription tier and usage limits
   */
  static async updateSubscriptionTier(tenantId: string, tier: string, stripeSubscriptionId?: string, force: boolean = false) {
    const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) return null;

    // Downgrade protection: only update if higher priority or forced (manual sync)
    const currentPriority = TIER_PRIORITY[tenant.subscriptionTier] || 0;
    const newPriority = TIER_PRIORITY[tier] || 0;

    if (!force && newPriority < currentPriority && tenant.subscriptionStatus === "active") {
      logger.info({ 
        tenantId, 
        currentTier: tenant.subscriptionTier, 
        rejectedTier: tier,
        reason: "Downgrade protection active" 
      }, "Skipping subscription update to lower tier");
      
      // Still update the status and sub ID if they match the current tier's sub
      if(stripeSubscriptionId === tenant.stripeSubscriptionId) {
          await prisma.tenant.update({
              where: { id: tenantId },
              data: { stripeSubscriptionId }
          });
      }
      return tenant;
    }

    const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
    let newUsageLimit = 100;

    if (tier === 'ltd') newUsageLimit = settings?.ltdLimit ?? 1000;
    else if (tier === 'starter') newUsageLimit = settings?.starterLimit ?? 1000;
    else if (tier === 'professional') newUsageLimit = settings?.professionalLimit ?? 10000;
    else if (tier === 'enterprise') newUsageLimit = settings?.enterpriseLimit ?? 100000;
    else if (tier === 'ai-revenue-infrastructure') newUsageLimit = settings?.aiInfraLimit ?? 250000;

    const data: any = {
      subscriptionTier: tier,
      subscriptionStatus: "active",
      usageLimit: newUsageLimit,
    };

    if (stripeSubscriptionId) {
      data.stripeSubscriptionId = stripeSubscriptionId;
    }

    const updated = await prisma.tenant.update({
      where: { id: tenantId },
      data,
    });

    logger.info({ tenantId, tier, newUsageLimit }, "Tenant subscription tier updated");

    // Create notification for the admin
    try {
      const admin = await prisma.user.findFirst({ where: { tenantId, isAdmin: true } });
      if (admin) {
        await createNotification({
          userId: admin.id,
          title: "Infrastructure Scaling Complete",
          body: `Your system has been successfully upgraded to the ${tier.toUpperCase()} tier.`,
          type: NotifType.SYSTEM_ANNOUNCEMENT,
        });
      }
    } catch (err) {
      logger.error({ err, tenantId }, "Failed to create upgrade notification");
    }

    return updated;
  }
}
