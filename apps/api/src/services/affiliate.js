"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateManager = exports.AffiliateManager = void 0;
const db_1 = require("../db");
const logger_1 = require("../logger");
const referral_1 = require("./referral");
const stripe_1 = require("../integrations/stripe");
const env_1 = require("../env");
const stripe = new stripe_1.StripeClient({
    apiKey: env_1.env.STRIPE_API_KEY || "",
});
class AffiliateManager {
    // Submit an affiliate application
    async applyForAffiliate(userId, status = "PENDING") {
        try {
            // Check if already an affiliate
            const existing = await db_1.prisma.affiliate.findUnique({
                where: { userId },
            });
            if (existing) {
                return { success: false, message: "Already an affiliate or application pending" };
            }
            // Generate a slug from user's name or username
            const user = await db_1.prisma.user.findUnique({ where: { id: userId } });
            if (!user)
                return { success: false, message: "User not found" };
            const baseSlug = (user.username || user.name.split(" ")[0] || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
            let slug = baseSlug;
            let counter = 1;
            // Ensure unique slug
            while (await db_1.prisma.affiliate.findUnique({ where: { slug } })) {
                slug = `${baseSlug}${counter}`;
                counter++;
            }
            // Fetch platform settings to determine the initial locked commission rate
            const settings = await db_1.prisma.platformSettings.findUnique({ where: { id: "global" } });
            const userLevel = user.commissionLevel || settings?.defaultCommissionLevel || "LOW";
            let rate = settings?.lowCommission ?? 10;
            if (userLevel === "MED")
                rate = settings?.medCommission ?? 20;
            if (userLevel === "HIGH")
                rate = settings?.highCommission ?? 30;
            const affiliate = await db_1.prisma.affiliate.create({
                data: {
                    userId,
                    status,
                    slug,
                    balance: 0,
                    totalEarnings: 0,
                    totalPaid: 0,
                    lockedCommissionRate: rate, // Lock in the system commission setting at signup
                },
            });
            // Sync isAffiliate flag on User model
            if (status === "ACTIVE") {
                await db_1.prisma.user.update({
                    where: { id: userId },
                    data: { isAffiliate: true },
                });
            }
            logger_1.logger.info({ userId, affiliateId: affiliate.id }, "Affiliate application submitted");
            return { success: true, data: affiliate };
        }
        catch (err) {
            logger_1.logger.error({ err, userId }, "Failed to apply for affiliate");
            return { success: false, message: "Internal server error" };
        }
    }
    // Get affiliate stats
    async getStats(userId) {
        try {
            const affiliate = await db_1.prisma.affiliate.findUnique({
                where: { userId }
            });
            if (!affiliate)
                return null;
            const referralStats = await referral_1.referralManager.getReferralStats(userId);
            const ytdEarnings = await this.calculateYTDEarnings(userId);
            // Compliance check: If YTD > $600, require tax form
            const requiresTaxForm = ytdEarnings >= 600;
            const complianceBlocked = requiresTaxForm && !affiliate.taxFormCompleted;
            return {
                ...affiliate,
                shareUrl: `${process.env.WEB_URL || "http://localhost:3000"}/a/${affiliate.slug}`,
                clicks: 0, // Clicks tracking to be implemented later 
                sales: referralStats.transactions.length,
                revenue: referralStats.totalRewards,
                totalReferrals: referralStats.totalReferred,
                convertedReferrals: referralStats.transactions.length,
                balance: referralStats.availableRewards,
                totalEarnings: referralStats.totalRewards,
                ytdEarnings,
                requiresTaxForm,
                complianceBlocked,
                referrals: referralStats.referrals.map((r) => ({
                    id: r.id,
                    createdAt: r.createdAt,
                    name: r.name,
                    email: r.email,
                    plan: r.plan,
                    status: r.status,
                    rewardAmount: r.rewardAmount,
                    referralCodeUsed: r.referralCodeUsed
                }))
            };
        }
        catch (err) {
            logger_1.logger.error({ err, userId }, "Failed to get affiliate stats");
            throw err;
        }
    }
    // Calculate earnings for the current calendar year
    async calculateYTDEarnings(userId) {
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const paidRewards = await db_1.prisma.rewardTransaction.findMany({
            where: {
                referrerId: userId,
                status: 'paid',
                createdAt: {
                    gte: startOfYear
                }
            }
        });
        return paidRewards.reduce((sum, r) => sum + r.amount, 0);
    }
    // Record a referral (when a new user signs up via affiliate link)
    async recordReferral(slug, refereeId) {
        try {
            const affiliate = await db_1.prisma.affiliate.findUnique({
                where: { slug, status: "ACTIVE" },
            });
            if (!affiliate)
                return null;
            const referral = await db_1.prisma.affiliateReferral.create({
                data: {
                    affiliateId: affiliate.id,
                    refereeId,
                    status: "PENDING",
                    commissionAmount: 0, // Will be set upon conversion (payment)
                },
            });
            logger_1.logger.info({ affiliateId: affiliate.id, refereeId }, "Affiliate referral recorded");
            return referral;
        }
        catch (err) {
            logger_1.logger.error({ err, slug, refereeId }, "Failed to record affiliate referral");
            return null;
        }
    }
    // Convert a referral (when a referred user makes a payment)
    async convertReferral(refereeId, commissionAmount) {
        try {
            const referral = await db_1.prisma.affiliateReferral.findUnique({
                where: { refereeId },
            });
            if (!referral || referral.status !== "PENDING")
                return null;
            const updatedReferral = await db_1.prisma.$transaction(async (tx) => {
                const r = await tx.affiliateReferral.update({
                    where: { id: referral.id },
                    data: {
                        status: "CONVERTED",
                        commissionAmount,
                    },
                });
                await tx.affiliate.update({
                    where: { id: referral.affiliateId },
                    data: {
                        balance: { increment: commissionAmount },
                        totalEarnings: { increment: commissionAmount },
                    },
                });
                return r;
            });
            logger_1.logger.info({ referralId: referral.id, commissionAmount }, "Affiliate referral converted");
            return updatedReferral;
        }
        catch (err) {
            logger_1.logger.error({ err, refereeId }, "Failed to convert affiliate referral");
            return null;
        }
    }
    // Get the payout queue (partners with available rewards)
    async getPayoutQueue() {
        try {
            const affiliates = await db_1.prisma.affiliate.findMany({
                where: {
                    user: {
                        rewards: {
                            some: { status: 'available' }
                        }
                    }
                },
                include: {
                    user: {
                        select: { name: true, email: true, username: true }
                    }
                }
            });
            const settings = await db_1.prisma.platformSettings.findUnique({ where: { id: "global" } });
            const feePercent = settings?.transactionFeePercent || 3.4;
            const queue = await Promise.all(affiliates.map(async (aff) => {
                const txs = await db_1.prisma.rewardTransaction.findMany({
                    where: { referrerId: aff.userId, status: 'available' }
                });
                const grossAmount = txs.reduce((sum, t) => sum + t.amount, 0);
                const feeAmount = grossAmount * (feePercent / 100);
                const netAmount = grossAmount - feeAmount;
                // compliance check
                const ytdEarnings = await this.calculateYTDEarnings(aff.userId);
                const requiresTaxForm = (ytdEarnings + grossAmount) >= 600;
                const complianceBlocked = requiresTaxForm && !aff.taxFormCompleted;
                return {
                    ...aff,
                    grossAmount,
                    feeAmount,
                    netAmount,
                    transactionCount: txs.length,
                    ytdEarnings,
                    requiresTaxForm,
                    complianceBlocked,
                    stripeConnected: !!aff.stripeAccountId && aff.stripeAccountStatus === 'active'
                };
            }));
            return queue;
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get payout queue");
            throw err;
        }
    }
    // Process a single payout (Real Stripe Transfer)
    async processPayout(affiliateId) {
        try {
            const affiliate = await db_1.prisma.affiliate.findUnique({
                where: { id: affiliateId }
            });
            if (!affiliate)
                throw new Error("Affiliate not found");
            if (!affiliate.stripeAccountId) {
                throw new Error("Affiliate does not have a connected Stripe account");
            }
            if (affiliate.stripeAccountStatus !== 'active') {
                throw new Error(`Stripe account status is ${affiliate.stripeAccountStatus}, not active`);
            }
            const txs = await db_1.prisma.rewardTransaction.findMany({
                where: { referrerId: affiliate.userId, status: 'available' }
            });
            if (txs.length === 0)
                throw new Error("No available funds");
            const settings = await db_1.prisma.platformSettings.findUnique({ where: { id: "global" } });
            const payoutMinimum = settings?.payoutMinimum || 100;
            const feePercent = settings?.transactionFeePercent || 3.4;
            const payoutAmount = txs.reduce((sum, t) => sum + t.amount, 0);
            if (payoutAmount < payoutMinimum) {
                throw new Error(`Earnings must be at least $${payoutMinimum} for payout. Current balance: $${payoutAmount.toFixed(2)}`);
            }
            const feeAmount = payoutAmount * (feePercent / 100);
            const netAmount = Math.floor((payoutAmount - feeAmount) * 100); // Stripe expects cents, also rounding correctly
            if (netAmount <= 0) {
                throw new Error("Net payout amount must be greater than zero after fees");
            }
            // 1. Mark as PAID in DB first within a transaction
            const result = await db_1.prisma.$transaction(async (tx) => {
                // Update all available to paid
                await tx.rewardTransaction.updateMany({
                    where: {
                        referrerId: affiliate.userId,
                        status: 'available',
                        id: { in: txs.map((t) => t.id) }
                    },
                    data: { status: 'paid' }
                });
                // Update affiliate totals
                await tx.affiliate.update({
                    where: { id: affiliateId },
                    data: {
                        balance: { decrement: payoutAmount },
                        totalPaid: { increment: payoutAmount },
                        lastPayoutAt: new Date()
                    }
                });
                // 2. Execute the actual Stripe Transfer
                let transferId = "simulated";
                const isDummy = affiliate.stripeAccountId?.startsWith('acct_dummy');
                if (!isDummy && (env_1.env.NODE_ENV === "production" || env_1.env.STRIPE_API_KEY)) {
                    try {
                        const transfer = await stripe.createTransfer({
                            amount: netAmount,
                            currency: "usd",
                            destination: affiliate.stripeAccountId,
                            description: `Affiliate payout for ${affiliate.slug}`,
                            metadata: {
                                affiliateId: affiliate.id,
                                userId: affiliate.userId,
                            }
                        });
                        transferId = transfer.id;
                    }
                    catch (stripeErr) {
                        logger_1.logger.error({ stripeErr, affiliateId }, "Stripe transfer failed during payout");
                        throw new Error(`Stripe transfer failed: ${stripeErr.message}`);
                    }
                }
                // Record the finished payout
                return await db_1.prisma.affiliatePayout.create({
                    data: {
                        affiliateId: affiliate.id,
                        amount: payoutAmount,
                        feeAmount: feeAmount,
                        netAmount: netAmount,
                        status: "PAID",
                        method: "stripe",
                        transactionId: transferId
                    }
                });
            });
            return { success: true, payout: result };
        }
        catch (err) {
            logger_1.logger.error({ err, affiliateId }, "Failed to process payout");
            return { success: false, message: err.message };
        }
    }
    // Process multiple payouts in bulk
    async processBulkPayouts(affiliateIds) {
        const results = {
            successful: [],
            failed: [],
            totalAmount: 0,
        };
        for (const id of affiliateIds) {
            try {
                const res = await this.processPayout(id);
                if (res.success && res.payout) {
                    results.successful.push(res.payout);
                    results.totalAmount += res.payout.amount;
                }
                else {
                    results.failed.push({ id, error: res.message || "Unknown error" });
                }
            }
            catch (err) {
                results.failed.push({ id, error: err.message || "Internal error" });
            }
        }
        return results;
    }
}
exports.AffiliateManager = AffiliateManager;
exports.affiliateManager = new AffiliateManager();
