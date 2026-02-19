"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateManager = exports.AffiliateManager = void 0;
const db_1 = require("../db");
const logger_1 = require("../logger");
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
            const affiliate = await db_1.prisma.affiliate.create({
                data: {
                    userId,
                    status,
                    slug,
                    balance: 0,
                    totalEarnings: 0,
                    totalPaid: 0,
                },
            });
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
                where: { userId },
                include: {
                    referrals: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                },
            });
            if (!affiliate)
                return null;
            const totalReferrals = await db_1.prisma.affiliateReferral.count({
                where: { affiliateId: affiliate.id },
            });
            const convertedReferrals = await db_1.prisma.affiliateReferral.count({
                where: { affiliateId: affiliate.id, status: "CONVERTED" },
            });
            return {
                ...affiliate,
                totalReferrals,
                convertedReferrals,
            };
        }
        catch (err) {
            logger_1.logger.error({ err, userId }, "Failed to get affiliate stats");
            throw err;
        }
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
}
exports.AffiliateManager = AffiliateManager;
exports.affiliateManager = new AffiliateManager();
