import { prisma } from "../db";
import { logger } from "../logger";

export interface ReferralData {
  referrerId: string;
  refereeId: string;
  code: string;
  status: "pending" | "accepted" | "completed";
  rewardAmount?: number;
  rewardCurrency?: string;
  expiresAt?: Date;
}

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
          status: 'pending', // Initial status for the code itself
          rewardAmount: 5,   // $5 per referral
        }
      });

      return code;
    } catch (err) {
      logger.error({ err, userId }, "Failed to get or create referral code");
      throw err;
    }
  }

  // Create referral link when someone uses a code
  async createReferralRecord(code: string, refereeId: string): Promise<boolean> {
    try {
      const parentReferral = await prisma.referral.findUnique({
        where: { code }
      });

      if (!parentReferral) return false;

      // Create a specific record for this successful sign-up
      await prisma.referral.create({
        data: {
          referrerId: parentReferral.referrerId,
          refereeId: refereeId,
          code: `${code}_${refereeId}`, // Unique sub-code
          status: 'accepted',
          rewardAmount: 5,
        }
      });

      return true;
    } catch (err) {
      logger.error({ err, code, refereeId }, "Failed to create referral record");
      return false;
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

      // Track the usage
      await prisma.referral.create({
        data: {
          referrerId: referral.referrerId,
          refereeId,
          code: `USE_${code}_${refereeId}_${Date.now()}`,
          status: 'accepted',
          rewardAmount: 5, // Reward for referrer
        }
      });

      // Update referee
      await prisma.user.update({
        where: { id: refereeId },
        data: { referralCodeUsed: code }
      });

      logger.info({ code, refereeId }, "Referral code redeemed");

      return {
        success: true,
        reward: 10, // $10 credit for signup given to the new user
      };
    } catch (err) {
      logger.error({ err, code }, "Failed to redeem referral");
      return { success: false };
    }
  }

  // Mark referral as completed
  async completeReferral(referralId: string): Promise<boolean> {
    try {
      await prisma.referral.update({
        where: { id: referralId },
        data: { status: 'completed' },
      });

      logger.info({ referralId }, "Referral completed");
      return true;
    } catch (err) {
      logger.error({ err, referralId }, "Failed to complete referral");
      return false;
    }
  }

  // Get referral stats for user
  async getReferralStats(referrerId: string): Promise<{
    totalReferred: number;
    accepted: number;
    completed: number;
    totalRewards: number;
    referrals: any[];
  }> {
    try {
      const allReferrals = await prisma.referral.findMany({
        where: {
          referrerId,
          refereeId: { not: null } // Only records representing people signed up
        },
        include: {
          referrer: {
            select: { name: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      const accepted = allReferrals.filter(r => r.status === 'accepted').length;
      const completed = allReferrals.filter(r => r.status === 'completed').length;
      const totalRewards = allReferrals
        .filter(r => r.status === 'completed' || r.status === 'accepted')
        .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

      return {
        totalReferred: allReferrals.length,
        accepted,
        completed,
        totalRewards,
        referrals: allReferrals
      };
    } catch (err) {
      logger.error({ err, referrerId }, "Failed to get referral stats");
      throw err;
    }
  }
}

export const referralManager = new ReferralManager();
