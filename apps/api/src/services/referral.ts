import { prisma } from "../db";
import { logger } from "../logger";

class ReferralManager {
  // Generate unique referral code
  generateCode(userId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `REF_${userId.substring(0, 4)}_${timestamp}_${random}`.toUpperCase();
  }

  // Get or Create referral code for user
  async getOrCreateCode(userId: string): Promise<string> {
    try {
      // Find existing referral for this user that is not expired/invalid
      const existing = await prisma.referral.findFirst({
        where: { referrerId: userId },
        orderBy: { createdAt: 'desc' }
      });

      if (existing) return existing.code;

      const code = this.generateCode(userId);
      await prisma.referral.create({
        data: {
          referrerId: userId,
          code,
          status: 'pending',
          rewardAmount: 0,   // Legacy
        }
      });

      return code;
    } catch (err) {
      logger.error({ err, userId }, "Failed to get or create referral code");
      throw err;
    }
  }

  // Redeem referral code on signup
  async redeemReferral(code: string, refereeId: string): Promise<{ success: boolean; reward?: number }> {
    try {
      const referral = await prisma.referral.findUnique({
        where: { code },
      });

      if (!referral) {
        return { success: false };
      }

      // Update referee to link them
      await prisma.user.update({
        where: { id: refereeId },
        data: { referralCodeUsed: code }
      });

      logger.info({ code, refereeId }, "Referral code redeemed (linked)");

      return {
        success: true,
      };
    } catch (err) {
      logger.error({ err, code }, "Failed to link referral");
      return { success: false };
    }
  }

  // Process commission on payment
  async processCommission(refereeId: string, paymentAmount: number, paymentId: string): Promise<boolean> {
    try {
      // Get the referee to check who referred them
      const referee = await prisma.user.findUnique({
        where: { id: refereeId },
        select: { referralCodeUsed: true }
      });

      if (!referee?.referralCodeUsed) return false;

      // Ensure this payment hasn't already been processed
      const existingTx = await prisma.rewardTransaction.findFirst({
        where: { sourcePaymentId: paymentId }
      });

      if (existingTx) return false;

      // Find the referrer: Check standard referrals first
      let referrerId: string | undefined;
      let affiliateRecord: any = null;

      const referralCode = await prisma.referral.findUnique({
        where: { code: referee.referralCodeUsed },
        select: { referrerId: true }
      });

      if (referralCode) {
        referrerId = referralCode.referrerId;
        // Try to find their affiliate record for locked/custom rates
        affiliateRecord = await prisma.affiliate.findUnique({
          where: { userId: referrerId },
          select: { customCommissionRate: true, lockedCommissionRate: true }
        });
      } else {
        // If not found, check if it's an affiliate slug
        const affiliate = await prisma.affiliate.findUnique({
          where: { slug: referee.referralCodeUsed },
          select: { userId: true, customCommissionRate: true, lockedCommissionRate: true }
        });
        if (affiliate) {
          referrerId = affiliate.userId;
          affiliateRecord = affiliate;
        }
      }

      if (!referrerId) return false;

      // Get platform settings for rates and hold period
      const settings = await prisma.platformSettings.findUnique({
        where: { id: "global" }
      });

      // ── Commission rate priority chain ──────────────────────────────────
      // 1. customCommissionRate  — Per-partner admin override (highest priority)
      // 2. lockedCommissionRate  — Rate snapshotted at approval (immune to global changes)
      // 3. Global tier rate      — Current PlatformSettings rate (lowest priority)
      let ratePercentage: number;

      if (affiliateRecord?.customCommissionRate != null) {
        // Admin has set a specific custom rate for this partner
        ratePercentage = affiliateRecord.customCommissionRate;
        logger.info({ referrerId, ratePercentage }, "Using custom per-partner commission rate");
      } else if (affiliateRecord?.lockedCommissionRate != null) {
        // Use the rate that was locked in when this partner was approved
        ratePercentage = affiliateRecord.lockedCommissionRate;
        logger.info({ referrerId, ratePercentage }, "Using locked commission rate (immune to global changes)");
      } else {
        // Fall back to current global tier rate based on user's assigned level
        const referrerUser = await prisma.user.findUnique({
          where: { id: referrerId },
          select: { commissionLevel: true }
        });
        const userLevel = referrerUser?.commissionLevel || settings?.defaultCommissionLevel || "LOW";
        ratePercentage = settings?.lowCommission ?? 10;
        if (userLevel === "MED") ratePercentage = settings?.medCommission ?? 20;
        if (userLevel === "HIGH") ratePercentage = settings?.highCommission ?? 30;
        logger.info({ referrerId, ratePercentage, userLevel }, "Using user-specific global tier commission rate");
      }
      // ───────────────────────────────────────────────────────────────────

      const rate = ratePercentage / 100;
      const delayMonths = settings?.payoutCycleDelayMonths ?? 1;

      const commissionAmount = paymentAmount * rate;

      const holdEndsAt = new Date();
      holdEndsAt.setMonth(holdEndsAt.getMonth() + delayMonths);

      // Create pending reward transaction
      await prisma.rewardTransaction.create({
        data: {
          referrerId: referrerId,
          refereeId: refereeId,
          amount: commissionAmount,
          status: 'pending',
          sourcePaymentId: paymentId,
          holdEndsAt: holdEndsAt
        }
      });

      logger.info({ referrerId: referrerId, commissionAmount, ratePercentage }, "Commission processed");
      return true;
    } catch (err) {
      logger.error({ err, refereeId }, "Failed to process commission");
      return false;
    }
  }

  // Clear pending holds that have passed their holdEndsAt date
  async clearPendingHolds(): Promise<number> {
    try {
      const now = new Date();
      const updated = await prisma.rewardTransaction.updateMany({
        where: {
          status: 'pending',
          holdEndsAt: {
            lte: now
          }
        },
        data: {
          status: 'available'
        }
      });

      if (updated.count > 0) {
        logger.info({ count: updated.count }, "Cleared pending commission holds");
      }
      return updated.count;
    } catch (err) {
      logger.error(err, "Failed to clear pending holds");
      return 0;
    }
  }

  // Get referral stats for user
  async getReferralStats(referrerId: string): Promise<{
    totalClicks: number;
    totalSignups: number;
    pendingRewards: number;
    availableRewards: number;
    totalRewards: number;
    referrals: any[];
    transactions: any[];
  }> {
    try {
      // For signups, we look at users who have this referrer's code
      const codes = await prisma.referral.findMany({
        where: { referrerId },
        select: { code: true }
      });
      const codeStrings = codes.map(c => c.code);

      // Add affiliate slug if the user is an affiliate
      const affiliate = await prisma.affiliate.findUnique({
        where: { userId: referrerId },
        select: { slug: true }
      });
      if (affiliate) {
        codeStrings.push(affiliate.slug);
      }

      const signups = await prisma.user.findMany({
        where: { referralCodeUsed: { in: codeStrings } },
        select: { id: true, name: true, email: true, createdAt: true }
      });

      // For monetary stats, we query RewardTransactions
      const txs = await prisma.rewardTransaction.findMany({
        where: { referrerId },
        orderBy: { createdAt: 'desc' },
        include: {
          referrer: { select: { name: true, email: true } }
        }
      });

      const pendingRewards = txs.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
      const availableRewards = txs.filter(t => t.status === 'available').reduce((sum, t) => sum + t.amount, 0);
      const totalRewards = txs.filter(t => t.status === 'available' || t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);

      return {
        totalClicks: 0, // Would need click tracking for this
        totalSignups: signups.length,
        pendingRewards,
        availableRewards,
        totalRewards,
        referrals: signups,
        transactions: txs
      };
    } catch (err) {
      logger.error({ err, referrerId }, "Failed to get referral stats");
      throw err;
    }
  }
}

export const referralManager = new ReferralManager();
