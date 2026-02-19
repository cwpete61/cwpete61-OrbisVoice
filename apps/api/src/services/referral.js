"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralManager = void 0;
const db_1 = require("../db");
const logger_1 = require("../logger");
class ReferralManager {
    // Generate unique referral code
    generateCode(userId) {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 7);
        return `REF_${userId.substring(0, 4)}_${timestamp}_${random}`.toUpperCase();
    }
    // Get or Create referral code for user
    async getOrCreateCode(userId) {
        try {
            // Find existing referral for this user that is not expired/invalid
            const existing = await db_1.prisma.referral.findFirst({
                where: { referrerId: userId },
                orderBy: { createdAt: 'desc' }
            });
            if (existing)
                return existing.code;
            const code = this.generateCode(userId);
            await db_1.prisma.referral.create({
                data: {
                    referrerId: userId,
                    code,
                    status: 'pending', // Initial status for the code itself
                    rewardAmount: 5, // $5 per referral
                }
            });
            return code;
        }
        catch (err) {
            logger_1.logger.error({ err, userId }, "Failed to get or create referral code");
            throw err;
        }
    }
    // Create referral link when someone uses a code
    async createReferralRecord(code, refereeId) {
        try {
            const parentReferral = await db_1.prisma.referral.findUnique({
                where: { code }
            });
            if (!parentReferral)
                return false;
            // Create a specific record for this successful sign-up
            await db_1.prisma.referral.create({
                data: {
                    referrerId: parentReferral.referrerId,
                    refereeId: refereeId,
                    code: `${code}_${refereeId}`, // Unique sub-code
                    status: 'accepted',
                    rewardAmount: 5,
                }
            });
            return true;
        }
        catch (err) {
            logger_1.logger.error({ err, code, refereeId }, "Failed to create referral record");
            return false;
        }
    }
    // Redeem referral code on signup
    async redeemReferral(code, refereeId) {
        try {
            const referral = await db_1.prisma.referral.findUnique({
                where: { code },
            });
            if (!referral) {
                return { success: false };
            }
            // Track the usage
            await db_1.prisma.referral.create({
                data: {
                    referrerId: referral.referrerId,
                    refereeId,
                    code: `USE_${code}_${refereeId}_${Date.now()}`,
                    status: 'accepted',
                    rewardAmount: 5, // Reward for referrer
                }
            });
            // Update referee
            await db_1.prisma.user.update({
                where: { id: refereeId },
                data: { referralCodeUsed: code }
            });
            logger_1.logger.info({ code, refereeId }, "Referral code redeemed");
            return {
                success: true,
                reward: 10, // $10 credit for signup given to the new user
            };
        }
        catch (err) {
            logger_1.logger.error({ err, code }, "Failed to redeem referral");
            return { success: false };
        }
    }
    // Mark referral as completed
    async completeReferral(referralId) {
        try {
            await db_1.prisma.referral.update({
                where: { id: referralId },
                data: { status: 'completed' },
            });
            logger_1.logger.info({ referralId }, "Referral completed");
            return true;
        }
        catch (err) {
            logger_1.logger.error({ err, referralId }, "Failed to complete referral");
            return false;
        }
    }
    // Get referral stats for user
    async getReferralStats(referrerId) {
        try {
            const allReferrals = await db_1.prisma.referral.findMany({
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
        }
        catch (err) {
            logger_1.logger.error({ err, referrerId }, "Failed to get referral stats");
            throw err;
        }
    }
}
exports.referralManager = new ReferralManager();
