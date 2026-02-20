import { FastifyInstance } from "fastify";
import { authenticate, requireAdmin } from "../middleware/auth";
import { affiliateManager } from "../services/affiliate";
import { prisma } from "../db";
import { env } from "../env";
import { ApiResponse } from "../types";
import { z } from "zod";
import Stripe from "stripe";

export async function affiliateRoutes(fastify: FastifyInstance) {
    // Get current user's affiliate status and stats
    fastify.get(
        "/affiliates/me",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as any).userId;
                const stats = await affiliateManager.getStats(userId);

                if (!stats) {
                    return reply.send({
                        ok: true,
                        data: { isAffiliate: false },
                    } as ApiResponse);
                }

                return reply.send({
                    ok: true,
                    data: {
                        isAffiliate: true,
                        ...stats,
                    },
                } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Update affiliate payout email
    fastify.put(
        "/affiliates/me/payout-email",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as any).userId;
                const { payoutEmail } = z.object({ payoutEmail: z.string().email() }).parse(request.body);

                const affiliate = await prisma.affiliate.findUnique({ where: { userId } });
                if (!affiliate) {
                    return reply.code(404).send({ ok: false, message: "No affiliate profile found" });
                }

                await prisma.affiliate.update({
                    where: { userId },
                    data: { payoutEmail },
                });

                return reply.send({ ok: true, message: "Payout email updated" } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Invalid email address" });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Get current user's Stripe Connect status
    fastify.get(
        "/affiliates/stripe/status",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as any).userId;
                let affiliate = await prisma.affiliate.findUnique({ where: { userId } });

                if (!affiliate) {
                    // Create an empty affiliate record so standard users can connect Stripe too
                    affiliate = await prisma.affiliate.create({
                        data: {
                            userId,
                            status: "PENDING",
                            balance: 0,
                            totalPaid: 0,
                        },
                    });
                }

                if (!affiliate.stripeAccountId) {
                    return reply.send({ ok: true, data: { status: "not_connected", accountId: null } } as ApiResponse);
                }

                // If pending, check Stripe directly to see if they finished onboarding
                let currentStatus = affiliate.stripeAccountStatus;
                if (currentStatus === "pending" && env.STRIPE_API_KEY) {
                    const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2024-06-20" as any });
                    const account = await stripe.accounts.retrieve(affiliate.stripeAccountId);
                    if (account.details_submitted) {
                        currentStatus = "active";
                        await prisma.affiliate.update({
                            where: { id: affiliate.id },
                            data: { stripeAccountStatus: "active" },
                        });
                    }
                }

                return reply.send({
                    ok: true,
                    data: {
                        status: currentStatus,
                        accountId: affiliate.stripeAccountId,
                    },
                } as ApiResponse);
            } catch (err) {
                fastify.log.error("Failed to fetch Stripe Connect status:", err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Generate Stripe Connect onboarding link
    fastify.post(
        "/affiliates/stripe/onboard",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                if (!env.STRIPE_API_KEY) {
                    return reply.code(400).send({ ok: false, message: "Stripe integration is not configured" });
                }

                const userId = (request.user as any).userId;
                let affiliate = await prisma.affiliate.findUnique({
                    where: { userId },
                    include: { user: true }
                });

                if (!affiliate) {
                    // Create an empty affiliate record for standard users
                    affiliate = await prisma.affiliate.create({
                        data: {
                            userId,
                            status: "PENDING",
                            balance: 0,
                            totalPaid: 0,
                        },
                        include: { user: true }
                    });
                }

                if (affiliate.stripeAccountStatus === "active") {
                    return reply.code(400).send({ ok: false, message: "Stripe account is already connected and active." });
                }

                const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2024-06-20" as any });
                let accountId = affiliate.stripeAccountId;

                // Create a new connected account if they don't have one
                if (!accountId) {
                    const account = await stripe.accounts.create({
                        type: "express",
                        email: affiliate.payoutEmail || affiliate.user.email,
                        capabilities: {
                            transfers: { requested: true },
                        },
                    });
                    accountId = account.id;

                    await prisma.affiliate.update({
                        where: { id: affiliate.id },
                        data: { stripeAccountId: accountId, stripeAccountStatus: "pending" },
                    });
                }

                // Generate onboarding link
                const accountLink = await stripe.accountLinks.create({
                    account: accountId,
                    refresh_url: `${env.WEB_URL}/affiliates?stripe_refresh=true`,
                    return_url: `${env.WEB_URL}/affiliates?stripe_return=true`,
                    type: "account_onboarding",
                });

                return reply.send({
                    ok: true,
                    data: { url: accountLink.url },
                } as ApiResponse);
            } catch (err: any) {
                fastify.log.error("Failed to generate Stripe onboarding link:", err);
                return reply.code(500).send({ ok: false, message: `Server error: ${err.message}` });
            }
        }
    );

    // Apply for affiliate status
    fastify.post(
        "/affiliates/apply",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as any).userId;
                const result = await affiliateManager.applyForAffiliate(userId);

                if (!result.success) {
                    return reply.code(400).send({ ok: false, message: result.message });
                }

                return reply.send({
                    ok: true,
                    message: "Application submitted successfully",
                    data: result.data,
                } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: List all affiliate applications
    fastify.get(
        "/admin/affiliates",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const affiliates = await prisma.affiliate.findMany({
                    include: {
                        user: {
                            select: { name: true, email: true, username: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });

                return reply.send({ ok: true, data: affiliates } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: Update affiliate status
    const UpdateStatusSchema = z.object({
        status: z.enum(["PENDING", "ACTIVE", "REJECTED"]),
    });

    fastify.post<{ Params: { id: string }; Body: z.infer<typeof UpdateStatusSchema> }>(
        "/admin/affiliates/:id/status",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { status } = UpdateStatusSchema.parse(request.body);

                const updated = await prisma.affiliate.update({
                    where: { id },
                    data: { status },
                });

                return reply.send({
                    ok: true,
                    message: `Affiliate status updated to ${status}`,
                    data: updated,
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Invalid status" });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: Promote user to affiliate directly
    const PromoteSchema = z.object({
        userId: z.string(),
    });

    fastify.post<{ Body: z.infer<typeof PromoteSchema> }>(
        "/admin/affiliates/promote",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { userId } = PromoteSchema.parse(request.body);
                // We pass "ACTIVE" to skip the pending state for manual admin promotion
                const result = await affiliateManager.applyForAffiliate(userId, "ACTIVE");

                if (!result.success) {
                    return reply.code(400).send({ ok: false, message: result.message });
                }

                return reply.send({
                    ok: true,
                    message: "User promoted to affiliate successfully",
                    data: result.data,
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Missing userId" });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: Process payout for an affiliate
    fastify.post<{ Params: { id: string } }>(
        "/admin/affiliates/:id/payout",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;

                const affiliate = await prisma.affiliate.findUnique({
                    where: { id }
                });

                if (!affiliate) {
                    return reply.code(404).send({ ok: false, message: "Affiliate not found" });
                }

                // Find all available transactions for this user
                const txs = await prisma.rewardTransaction.findMany({
                    where: { referrerId: affiliate.userId, status: 'available' }
                });

                if (txs.length === 0) {
                    return reply.code(400).send({ ok: false, message: "No available funds to payout" });
                }

                const payoutAmount = txs.reduce((sum, t) => sum + t.amount, 0);

                // Update within a transaction
                await prisma.$transaction(async (tx) => {
                    // Update all available to paid
                    await tx.rewardTransaction.updateMany({
                        where: { referrerId: affiliate.userId, status: 'available' },
                        data: { status: 'paid' }
                    });

                    // Update affiliate totals
                    await tx.affiliate.update({
                        where: { id },
                        data: {
                            balance: { decrement: payoutAmount },
                            totalPaid: { increment: payoutAmount }
                        }
                    });
                });

                return reply.send({
                    ok: true,
                    message: `Processed payout of $${payoutAmount.toFixed(2)}`,
                } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );
}
