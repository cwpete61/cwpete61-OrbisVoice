
import { prisma } from "../db";
import { logger } from "../logger";

export class ReferralManager {
  // Get or create referral code for user
  async getOrCreateCode(userId: string): Promise<string> {
    try {
      const existing = await prisma.referral.findFirst({
        where: { referrerId: userId },
      });

      if (existing) return existing.code;

      // Generate a clean code based on user info or random
      const user = await prisma.user.findUnique({ where: { id: userId } });
      const base = (user?.username || user?.name?.split(" ")[0] || "USER").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;

      await prisma.referral.create({
        data: {
          referrerId: userId,
          code,
          status: "pending",
          rewardAmount: 10,
        }
      });

      return code;
    } catch (err) {
      logger.error({ err, userId }, "Failed to get or create referral code");
      throw err;
    }
  }

  // Get or create referral code for user (deprecated alias)
  async getOrCreateReferralCode(userId: string): Promise<string> {
    return this.getOrCreateCode(userId);
  }

  // Redeem referral code on signup
  async redeemReferral(code: string, refereeId: string): Promise<{ success: boolean; reward?: number }> {
    try {
      const referral = await prisma.referral.findUnique({
        where: { code },
      });

      if (!referral) {
        // Check if it is an affiliate slug
        const isAffiliate = await prisma.affiliate.findUnique({ where: { slug: code } });
        if (isAffiliate) {
          // It is an affiliate slug, the affiliate recording will happen in recordReferral
          return { success: true };
        }
        return { success: false };
      }

      // Standard referral logic
      await prisma.user.update({
        where: { id: refereeId },
        data: { referralCodeUsed: code }
      });

      return { success: true, reward: referral.rewardAmount };
    } catch (err) {
      logger.error({ err, code, refereeId }, "Failed to redeem referral");
      return { success: false };
    }
  }

  // Get referral stats for user (Final Boss Mode: Multi-Source Aggregation)
  async getReferralStats(referrerId: string): Promise<{
    totalClicks: number;
    totalReferred: number;
    accepted: number;
    completed: number;
    pendingRewards: number;
    availableRewards: number;
    totalRewards: number;
    transactionFeePercent: number;
    estimatedFee: number;
    estimatedNetBalance: number;
    referrals: any[];
    transactions: any[];
    isAffiliate: boolean;
  }> {
    try {
      // 1. Get all codes and affiliate info
      const codes = await prisma.referral.findMany({ where: { referrerId }, select: { code: true } });
      const codeStrings = codes.map((c: any) => c.code);

      const affiliate = await prisma.affiliate.findUnique({
        where: { userId: referrerId },
        select: { id: true, slug: true, status: true }
      });
      if (affiliate?.slug) codeStrings.push(affiliate.slug);

      // 2. Source A: Users who have used the codes
      const signupsFromCodes = await prisma.user.findMany({
        where: { referralCodeUsed: { in: codeStrings } },
        include: { tenant: { select: { subscriptionStatus: true, subscriptionTier: true } } }
      });

      // 3. Source B: AffiliateReferral records
      let affiliateSignups: any[] = [];
      if (affiliate) {
        const affRefs = await prisma.affiliateReferral.findMany({
          where: { affiliateId: affiliate.id, refereeId: { not: null } }
        });

        const refereeIds = affRefs.map(r => r.refereeId).filter(Boolean) as string[];
        if (refereeIds.length > 0) {
          affiliateSignups = await prisma.user.findMany({
            where: { id: { in: refereeIds } },
            include: { tenant: { select: { subscriptionStatus: true, subscriptionTier: true } } }
          });
        }
      }

      // 4. Source C: Reward Transactions
      const txs = await prisma.rewardTransaction.findMany({
        where: { referrerId },
        orderBy: { createdAt: 'desc' },
        include: {
          referee: { select: { id: true, name: true, email: true } }
        } as any
      });

      // 5. Deduplicate and Unify
      const allUniqueUsers = new Map<string, any>();

      [...signupsFromCodes, ...affiliateSignups].forEach(u => {
        allUniqueUsers.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          createdAt: u.createdAt,
          referralCodeUsed: u.referralCodeUsed || "",
          status: u.tenant?.subscriptionStatus === 'active' ? 'completed' : 'accepted',
          plan: u.tenant?.subscriptionTier || 'free',
          rewardAmount: 0
        });
      });

      txs.forEach(t => {
        if (t.refereeId && !allUniqueUsers.has(t.refereeId)) {
          const referee = (t as any).referee;
          allUniqueUsers.set(t.refereeId, {
            id: t.refereeId,
            name: referee?.name || "Unknown User",
            email: referee?.email || "",
            createdAt: t.createdAt,
            referralCodeUsed: "COMMISSION",
            status: 'completed',
            plan: 'premium',
            rewardAmount: t.amount
          });
        } else if (t.refereeId) {
          const u = allUniqueUsers.get(t.refereeId);
          if (u) {
            u.rewardAmount = t.amount;
            // Any transaction (even pending) means a conversion happened
            u.status = 'completed';
          }
        }
      });

      const activities = Array.from(allUniqueUsers.values()).sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      // 6. Calculate Totals
      const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      const feePercent = settings?.transactionFeePercent || 3.4;

      const pendingRewards = txs.filter(t => t.status === 'pending').reduce((sum, t) => sum + t.amount, 0);
      const availableRewards = txs.filter(t => t.status === 'available').reduce((sum, t) => sum + t.amount, 0);
      const totalRewards = txs.filter(t => t.status === 'available' || t.status === 'paid').reduce((sum, t) => sum + t.amount, 0);

      const estimatedFee = availableRewards * (feePercent / 100);
      const estimatedNetBalance = availableRewards - estimatedFee;

      return {
        totalClicks: 0,
        totalReferred: activities.length,
        accepted: activities.filter(a => a.status === 'accepted').length,
        completed: activities.filter(a => a.status === 'completed' || txs.some(t => t.refereeId === a.id && t.status === 'pending')).length,
        pendingRewards,
        availableRewards,
        totalRewards,
        transactionFeePercent: feePercent,
        estimatedFee,
        estimatedNetBalance,
        referrals: activities.map(a => ({
          ...a,
          referredUser: { name: a.name, email: a.email }
        })),
        transactions: txs,
        isAffiliate: affiliate?.status === 'ACTIVE'
      };

    } catch (err) {
      logger.error({ err, referrerId }, "Failed to get referral stats");
      throw err;
    }
  }

  // Clear pending holds that have expired
  async clearPendingHolds(): Promise<number> {
    try {
      const now = new Date();
      const result = await prisma.rewardTransaction.updateMany({
        where: {
          status: 'pending',
          holdEndsAt: { lte: now }
        },
        data: {
          status: 'available'
        }
      });

      if (result.count > 0) {
        logger.info({ count: result.count }, "Cleared pending commission holds");
      }
      return result.count;
    } catch (err) {
      logger.error(err, "Failed to clear pending holds");
      return 0;
    }
  }

  // Process a commission from a payment (called via webhooks)
  async processCommission(refereeId: string, amount: number, sourceId: string): Promise<boolean> {
    try {
      // 0. Idempotency check
      const existingTx = await prisma.rewardTransaction.findFirst({
        where: { sourcePaymentId: sourceId }
      });
      if (existingTx) {
        logger.info({ sourceId }, "Commission already processed for this payment");
        return true;
      }

      // 1. Find the referee and their referrer
      const referee = await prisma.user.findUnique({
        where: { id: refereeId },
        select: { id: true, referralCodeUsed: true }
      });

      if (!referee || !referee.referralCodeUsed) {
        logger.info({ refereeId }, "Skipping commission: No referral code used");
        return false;
      }

      // 2. Find the referrer by code or slug
      let referrerId: string | null = null;
      const refCode = await prisma.referral.findUnique({
        where: { code: referee.referralCodeUsed }
      });

      if (refCode) {
        referrerId = refCode.referrerId;
      } else {
        const affiliate = await prisma.affiliate.findUnique({
          where: { slug: referee.referralCodeUsed }
        });
        if (affiliate) {
          referrerId = affiliate.userId;
        }
      }

      if (!referrerId) {
        logger.info({ refereeId, code: referee.referralCodeUsed }, "Skipping commission: No referrer found for code");
        return false;
      }

      if (referrerId === refereeId) {
        logger.warn({ referrerId, refereeId }, "Self-referral detected, skipping commission");
        return false;
      }

      // 3. Calculate commission amount
      const referrer = await prisma.user.findUnique({
        where: { id: referrerId },
        include: { affiliate: true }
      });

      if (!referrer) return false;

      const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      const globalLow = settings?.lowCommission ?? 10;
      const globalMed = settings?.medCommission ?? 20;
      const globalHigh = settings?.highCommission ?? 30;

      let commissionRate = globalLow;
      if (referrer.affiliate?.lockedCommissionRate) {
        commissionRate = referrer.affiliate.lockedCommissionRate;
      } else if (referrer.affiliate?.customCommissionRate) {
        commissionRate = referrer.affiliate.customCommissionRate;
      } else {
        if (referrer.commissionLevel === 'MED') commissionRate = globalMed;
        if (referrer.commissionLevel === 'HIGH') commissionRate = globalHigh;
      }

      const rewardAmount = (amount * commissionRate) / 100;

      // 4. Create RewardTransaction
      const refundHoldDays = settings?.refundHoldDays ?? 14;
      const holdEndsAt = new Date();
      holdEndsAt.setDate(holdEndsAt.getDate() + refundHoldDays);

      await prisma.rewardTransaction.create({
        data: {
          referrerId,
          refereeId,
          amount: rewardAmount,
          status: "pending",
          sourcePaymentId: sourceId,
          holdEndsAt
        }
      });

      // 5. If affiliate, update their internal balance immediately
      if (referrer.affiliate) {
        await prisma.affiliate.update({
          where: { id: referrer.affiliate.id },
          data: {
            balance: { increment: rewardAmount },
            totalEarnings: { increment: rewardAmount }
          }
        });
      }

      logger.info({ referrerId, refereeId, amount, rewardAmount }, "Commission processed successfully");
      return true;
    } catch (err) {
      logger.error({ err, refereeId, amount }, "Failed to process commission");
      return false;
    }
  }
}

export const referralManager = new ReferralManager();
