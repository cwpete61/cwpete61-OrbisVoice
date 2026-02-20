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
                    status: 'pending',
                    rewardAmount: 0, // Legacy
                }
            });
            return code;
        }
        catch (err) {
            logger_1.logger.error({ err, userId }, "Failed to get or create referral code");
            throw err;
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
            // Update referee to link them
            await db_1.prisma.user.update({
                where: { id: refereeId },
                data: { referralCodeUsed: code }
            });
            logger_1.logger.info({ code, refereeId }, "Referral code redeemed (linked)");
            return {
                success: true,
            };
        }
        catch (err) {
            logger_1.logger.error({ err, code }, "Failed to link referral");
            return { success: false };
        }
    }
    // Process commission on payment
    async processCommission(refereeId, paymentAmount, paymentId) {
        try {
            // Get the referee to check who referred them
            const referee = await db_1.prisma.user.findUnique({
                where: { id: refereeId },
                select: { referralCodeUsed: true }
            });
            if (!referee?.referralCodeUsed)
                return false;
            // Ensure this payment hasn't already been processed
            const existingTx = await db_1.prisma.rewardTransaction.findFirst({
                where: { sourcePaymentId: paymentId }
            });
            if (existingTx)
                return false;
            // Find the referrer: Check standard referrals first
            let referrerId;
            const referralCode = await db_1.prisma.referral.findUnique({
                where: { code: referee.referralCodeUsed },
                select: { referrerId: true }
            });
            if (referralCode) {
                referrerId = referralCode.referrerId;
            }
            else {
                // If not found, check if it's an affiliate slug
                const affiliate = await db_1.prisma.affiliate.findUnique({
                    where: { slug: referee.referralCodeUsed },
                    select: { userId: true }
                });
                if (affiliate) {
                    referrerId = affiliate.userId;
                }
            }
            if (!referrerId)
                return false;
            // Get referrer to check their commission level
            const referrerUser = await db_1.prisma.user.findUnique({
                where: { id: referrerId },
                select: { commissionLevel: true }
            });
            if (!referrerUser)
                return false;
            // Get platform settings for rates and hold period
            const settings = await db_1.prisma.platformSettings.findUnique({
                where: { id: "global" }
            });
            // Determine rate based on referrer's commission level
            const userLevel = referrerUser.commissionLevel || settings?.defaultCommissionLevel || "LOW";
            let ratePercentage = settings?.lowCommission ?? 10;
            if (userLevel === "MED")
                ratePercentage = settings?.medCommission ?? 20;
            if (userLevel === "HIGH")
                ratePercentage = settings?.highCommission ?? 30;
            const rate = ratePercentage / 100;
            const delayMonths = settings?.payoutCycleDelayMonths ?? 1;
            const commissionAmount = paymentAmount * rate;
            const holdEndsAt = new Date();
            holdEndsAt.setMonth(holdEndsAt.getMonth() + delayMonths);
            // Create pending reward transaction
            await db_1.prisma.rewardTransaction.create({
                data: {
                    referrerId: referrerId,
                    refereeId: refereeId,
                    amount: commissionAmount,
                    status: 'pending',
                    sourcePaymentId: paymentId,
                    holdEndsAt: holdEndsAt
                }
            });
            logger_1.logger.info({ referrerId: referrerId, commissionAmount }, "Commission processed");
            return true;
        }
        catch (err) {
            logger_1.logger.error({ err, refereeId }, "Failed to process commission");
            return false;
        }
    }
    // Clear pending holds that have passed their holdEndsAt date
    async clearPendingHolds() {
        try {
            const now = new Date();
            const updated = await db_1.prisma.rewardTransaction.updateMany({
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
                logger_1.logger.info({ count: updated.count }, "Cleared pending commission holds");
            }
            return updated.count;
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to clear pending holds");
            return 0;
        }
    }
    // Get referral stats for user
    async getReferralStats(referrerId) {
        try {
            // For signups, we look at users who have this referrer's code
            const codes = await db_1.prisma.referral.findMany({
                where: { referrerId },
                select: { code: true }
            });
            const codeStrings = codes.map(c => c.code);
            // Add affiliate slug if the user is an affiliate
            const affiliate = await db_1.prisma.affiliate.findUnique({
                where: { userId: referrerId },
                select: { slug: true }
            });
            if (affiliate) {
                codeStrings.push(affiliate.slug);
            }
            const signups = await db_1.prisma.user.findMany({
                where: { referralCodeUsed: { in: codeStrings } },
                select: { id: true, name: true, email: true, createdAt: true }
            });
            // For monetary stats, we query RewardTransactions
            const txs = await db_1.prisma.rewardTransaction.findMany({
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
        }
        catch (err) {
            logger_1.logger.error({ err, referrerId }, "Failed to get referral stats");
            throw err;
        }
    }
}
exports.referralManager = new ReferralManager();
