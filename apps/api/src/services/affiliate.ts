import { prisma } from "../db";
import { logger } from "../logger";

export class AffiliateManager {
    // Submit an affiliate application
    async applyForAffiliate(userId: string, status: "PENDING" | "ACTIVE" = "PENDING") {
        try {
            // Check if already an affiliate
            const existing = await prisma.affiliate.findUnique({
                where: { userId },
            });

            if (existing) {
                return { success: false, message: "Already an affiliate or application pending" };
            }

            // Generate a slug from user's name or username
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user) return { success: false, message: "User not found" };

            const baseSlug = (user.username || user.name.split(" ")[0] || "user").toLowerCase().replace(/[^a-z0-9]/g, "");
            let slug = baseSlug;
            let counter = 1;

            // Ensure unique slug
            while (await prisma.affiliate.findUnique({ where: { slug } })) {
                slug = `${baseSlug}${counter}`;
                counter++;
            }

            const affiliate = await prisma.affiliate.create({
                data: {
                    userId,
                    status,
                    slug,
                    balance: 0,
                    totalEarnings: 0,
                    totalPaid: 0,
                },
            });

            logger.info({ userId, affiliateId: affiliate.id }, "Affiliate application submitted");
            return { success: true, data: affiliate };
        } catch (err) {
            logger.error({ err, userId }, "Failed to apply for affiliate");
            return { success: false, message: "Internal server error" };
        }
    }

    // Get affiliate stats
    async getStats(userId: string) {
        try {
            const affiliate = await prisma.affiliate.findUnique({
                where: { userId },
                include: {
                    referrals: {
                        orderBy: { createdAt: "desc" },
                        take: 10,
                    },
                },
            });

            if (!affiliate) return null;

            const totalReferrals = await prisma.affiliateReferral.count({
                where: { affiliateId: affiliate.id },
            });

            const convertedReferrals = await prisma.affiliateReferral.count({
                where: { affiliateId: affiliate.id, status: "CONVERTED" },
            });

            return {
                ...affiliate,
                totalReferrals,
                convertedReferrals,
            };
        } catch (err) {
            logger.error({ err, userId }, "Failed to get affiliate stats");
            throw err;
        }
    }

    // Record a referral (when a new user signs up via affiliate link)
    async recordReferral(slug: string, refereeId: string) {
        try {
            const affiliate = await prisma.affiliate.findUnique({
                where: { slug, status: "ACTIVE" },
            });

            if (!affiliate) return null;

            const referral = await prisma.affiliateReferral.create({
                data: {
                    affiliateId: affiliate.id,
                    refereeId,
                    status: "PENDING",
                    commissionAmount: 0, // Will be set upon conversion (payment)
                },
            });

            logger.info({ affiliateId: affiliate.id, refereeId }, "Affiliate referral recorded");
            return referral;
        } catch (err) {
            logger.error({ err, slug, refereeId }, "Failed to record affiliate referral");
            return null;
        }
    }

    // Convert a referral (when a referred user makes a payment)
    async convertReferral(refereeId: string, commissionAmount: number) {
        try {
            const referral = await prisma.affiliateReferral.findUnique({
                where: { refereeId },
            });

            if (!referral || referral.status !== "PENDING") return null;

            const updatedReferral = await prisma.$transaction(async (tx) => {
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

            logger.info({ referralId: referral.id, commissionAmount }, "Affiliate referral converted");
            return updatedReferral;
        } catch (err) {
            logger.error({ err, refereeId }, "Failed to convert affiliate referral");
            return null;
        }
    }
}

export const affiliateManager = new AffiliateManager();
