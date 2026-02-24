// Referral Roster: All users are pre-approved as ACTIVE referrers
import { FastifyInstance } from "fastify";
import { authenticate, requireAdmin } from "../middleware/auth";
import { verifyAppCheck } from "../middleware/app-check";
import { affiliateManager } from "../services/affiliate";
import { prisma } from "../db";
import { env } from "../env";
import { ApiResponse, AuthPayload } from "../types";
import { z } from "zod";
import Stripe from "stripe";
import * as bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";

const PublicApplySchema = z.object({
    email: z.string().email().refine(email => email.toLowerCase().endsWith("@gmail.com"), {
        message: "Only @gmail.com accounts are allowed"
    }),
    password: z.string().min(8).optional(), // optional if they already have an account
    firstName: z.string().min(1),
    lastName: z.string().min(1),
});

export async function affiliateRoutes(fastify: FastifyInstance) {
    // Public endpoint to get program details (commission rates)
    fastify.get(
        "/affiliates/program-details",
        async (request, reply) => {
            try {
                const settings = await prisma.platformSettings.findUnique({
                    where: { id: "global" },
                    select: {
                        lowCommission: true,
                        medCommission: true,
                        highCommission: true,
                        defaultCommissionLevel: true,
                        payoutMinimum: true,
                    }
                });

                if (!settings) {
                    // Fallback defaults if settings not initialized
                    return reply.send({
                        ok: true,
                        data: {
                            commissionRate: 30, // Default 30%
                            payoutMinimum: 100,
                        },
                    } as ApiResponse);
                }

                // Determine the default public commission rate based on the default level
                let commissionRate = settings.lowCommission;
                if (settings.defaultCommissionLevel === "MED") commissionRate = settings.medCommission;
                if (settings.defaultCommissionLevel === "HIGH") commissionRate = settings.highCommission;

                return reply.send({
                    ok: true,
                    data: {
                        commissionRate,
                        payoutMinimum: settings.payoutMinimum,
                    },
                } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );
    // Get current user's affiliate status and stats
    fastify.get(
        "/affiliates/me",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
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

    // Public endpoint for users to apply for the affiliate program (creates account if new)
    fastify.post<{ Body: z.infer<typeof PublicApplySchema> }>(
        "/affiliates/public-apply",
        { preHandler: [verifyAppCheck] },
        async (request, reply) => {
            try {
                const body = PublicApplySchema.parse(request.body);
                const isGmail = body.email.toLowerCase().endsWith("@gmail.com");
                if (!isGmail) {
                    return reply.code(400).send({ ok: false, message: "Only @gmail.com accounts are allowed for partner applications" });
                }
                let user = await prisma.user.findUnique({ where: { email: body.email } });

                if (user) {
                    if (!body.password) {
                        return reply.code(400).send({ ok: false, message: "Please provide your password to verify your account" });
                    }
                    if (!user.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) {
                        return reply.code(401).send({ ok: false, message: "Invalid email or password" });
                    }

                    // Update existing user's billing info
                    user = await prisma.user.update({
                        where: { id: user.id },
                        data: {
                            firstName: body.firstName,
                            lastName: body.lastName,
                        },
                    });
                } else {
                    if (!body.password) {
                        return reply.code(400).send({ ok: false, message: "Password is required for new accounts" });
                    }
                    // Create new user
                    const hashedPassword = await bcrypt.hash(body.password, 10);
                    const tenant = await prisma.tenant.create({ data: { name: `${body.firstName}'s Workspace` } });
                    const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });

                    user = await prisma.user.create({
                        data: {
                            email: body.email,
                            name: `${body.firstName} ${body.lastName}`,
                            username: body.email.split('@')[0] + Math.floor(Math.random() * 1000),
                            passwordHash: hashedPassword,
                            tenantId: tenant.id,
                            firstName: body.firstName,
                            lastName: body.lastName,
                            commissionLevel: settings?.defaultCommissionLevel || "LOW",
                        } as any,
                    });
                }

                // Apply for affiliate
                const result = await affiliateManager.applyForAffiliate(user.id, "PENDING");
                if (!result.success) {
                    return reply.code(400).send({ ok: false, message: result.message });
                }

                // Generate Auth JWT so they are logged in seamlessly
                const token = fastify.jwt.sign(
                    { userId: user.id, tenantId: user.tenantId, email: user.email },
                    { expiresIn: "7d" }
                );

                return reply.send({ ok: true, message: "Application submitted successfully", data: { token } } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Invalid application data: " + err.errors[0].message });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Get current user's payout history
    fastify.get(
        "/affiliates/me/payouts",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
                const affiliate = await prisma.affiliate.findUnique({ where: { userId } });
                if (!affiliate) {
                    return reply.code(404).send({ ok: false, message: "Affiliate profile not found" });
                }

                const payouts = await prisma.affiliatePayout.findMany({
                    where: { affiliateId: affiliate.id },
                    orderBy: { createdAt: "desc" },
                });

                return reply.send({ ok: true, data: payouts } as ApiResponse);
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
                const userId = (request.user as AuthPayload).userId;
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
                const userId = (request.user as AuthPayload).userId;
                let affiliate = await prisma.affiliate.findUnique({ where: { userId } });

                if (!affiliate) {
                    // Create an empty affiliate record so standard users can connect Stripe too
                    const result = await affiliateManager.applyForAffiliate(userId, "PENDING");
                    if (!result.success || !result.data) {
                        return reply.code(500).send({ ok: false, message: "Failed to initialize partner profile" } as ApiResponse);
                    }
                    affiliate = result.data;
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
                fastify.log.error(err, "Failed to fetch Stripe Connect status:");
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

                const userId = (request.user as AuthPayload).userId;
                let affiliate = await prisma.affiliate.findUnique({
                    where: { userId },
                    include: { user: true }
                });

                if (!affiliate) {
                    // Create an empty affiliate record for standard users
                    const result = await affiliateManager.applyForAffiliate(userId, "PENDING");
                    if (!result.success) {
                        return reply.code(500).send({ ok: false, message: "Failed to initialize partner profile" } as ApiResponse);
                    }
                    affiliate = await prisma.affiliate.findUnique({
                        where: { userId },
                        include: { user: true }
                    });
                }

                if (!affiliate) {
                    return reply.code(404).send({ ok: false, message: "Affiliate profile not found" });
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
                        where: { id: (affiliate as any).id },
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
                const userId = (request.user as AuthPayload).userId;
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
                const filter = (request.query as { filter?: string })?.filter;
                const search = (request.query as { search?: string })?.search;

                if (filter === "referrers") {
                    // For referrers roster, we show ALL users as active referrers
                    const where: any = {};
                    if (search) {
                        where.OR = [
                            { name: { contains: search, mode: "insensitive" } },
                            { email: { contains: search, mode: "insensitive" } },
                            { affiliate: { slug: { contains: search, mode: "insensitive" } } },
                            { username: { contains: search, mode: "insensitive" } }
                        ];
                    }

                    const users = await prisma.user.findMany({
                        where,
                        include: {
                            affiliate: true
                        },
                        orderBy: { createdAt: "desc" },
                    });



                    const data = users.map((u: any) => {
                        const aff = u.affiliate;
                        return {
                            id: aff ? aff.id : u.id,
                            userId: aff ? aff.userId : u.id,
                            status: "ACTIVE" as const, // All users are pre-approved referrers
                            balance: aff ? aff.balance : 0,
                            totalEarnings: aff ? aff.totalEarnings : 0,
                            totalPaid: aff ? aff.totalPaid : 0,
                            slug: aff ? aff.slug : (u.username || u.email.split('@')[0]),
                            createdAt: aff ? aff.createdAt : u.createdAt,
                            stripeAccountStatus: aff ? aff.stripeAccountStatus : null,
                            taxFormCompleted: aff ? aff.taxFormCompleted : false,
                            tax1099Uploaded: aff ? aff.tax1099Uploaded : false,
                            lastPayoutAt: aff ? aff.lastPayoutAt : null,
                            user: {
                                name: u.name,
                                email: u.email,
                                username: u.username,
                                isAffiliate: u.isAffiliate
                            }
                        };
                    });

                    return reply.send({ ok: true, data } as ApiResponse);
                }

                // Default: list actual affiliate records (e.g. for "affiliates" filter or general view)
                let where: any = {};
                if (filter === "affiliates") {
                    where.user = { isAffiliate: true };
                }

                if (search) {
                    where = {
                        ...where,
                        OR: [
                            { slug: { contains: search, mode: "insensitive" } },
                            { user: { is: { name: { contains: search, mode: "insensitive" } } } },
                            { user: { is: { email: { contains: search, mode: "insensitive" } } } },
                        ] as any[],
                    };
                }

                const affiliates = await prisma.affiliate.findMany({
                    where,
                    include: {
                        user: {
                            select: { name: true, email: true, username: true, isAffiliate: true },
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

                // Try to find existing affiliate record
                let affiliate = await prisma.affiliate.findUnique({
                    where: { id },
                    include: { user: true }
                });

                // If not found, check if ID is actually a userId (virtual record from referrers list)
                if (!affiliate) {
                    const user = await prisma.user.findUnique({ where: { id } });
                    if (user) {
                        // Create the affiliate record now
                        const result = await affiliateManager.applyForAffiliate(user.id, status === "ACTIVE" ? "ACTIVE" : "PENDING");
                        if (!result.success || !result.data) {
                            return reply.code(400).send({ ok: false, message: result.message });
                        }
                        affiliate = await prisma.affiliate.findUnique({
                            where: { id: result.data.id },
                            include: { user: true }
                        });
                    }
                }

                if (!affiliate) {
                    return reply.code(404).send({ ok: false, message: "Affiliate or User not found" });
                }

                // When activating, snapshot the current global commission rate
                // so this partner is immune to future global rate changes
                const lockData: { lockedCommissionRate?: number } = {};
                if (status === "ACTIVE") {
                    // Only lock if not already locked
                    if (!affiliate.lockedCommissionRate) {
                        const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
                        const userLevel = affiliate.user?.commissionLevel || settings?.defaultCommissionLevel || "LOW";
                        let rate = settings?.lowCommission ?? 10;
                        if (userLevel === "MED") rate = settings?.medCommission ?? 20;
                        if (userLevel === "HIGH") rate = settings?.highCommission ?? 30;
                        lockData.lockedCommissionRate = rate;
                    }
                }

                const updated = await prisma.affiliate.update({
                    where: { id: affiliate.id },
                    data: { status, ...lockData },
                });

                // Sync isAffiliate flag on User model
                await prisma.user.update({
                    where: { id: updated.userId },
                    data: { isAffiliate: status === "ACTIVE" },
                });

                return reply.send({
                    ok: true,
                    message: `Affiliate status updated to ${status}${lockData.lockedCommissionRate ? ` (commission locked at ${lockData.lockedCommissionRate}%)` : ""}`,
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

    // Admin: Set a custom commission rate override for a specific affiliate
    const CustomRateSchema = z.object({
        customCommissionRate: z.number().min(0).max(100).nullable(),
    });

    fastify.patch<{ Params: { id: string }; Body: z.infer<typeof CustomRateSchema> }>(
        "/admin/affiliates/:id/commission-rate",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params as { id: string };
                const { customCommissionRate } = CustomRateSchema.parse(request.body);

                const affiliate = await prisma.affiliate.findUnique({ where: { id } });
                if (!affiliate) {
                    return reply.code(404).send({ ok: false, message: "Affiliate not found" });
                }

                const updated = await prisma.affiliate.update({
                    where: { id },
                    data: { customCommissionRate },
                });

                return reply.send({
                    ok: true,
                    message: customCommissionRate === null
                        ? "Custom rate cleared — partner will now use their locked/global rate"
                        : `Custom commission rate set to ${customCommissionRate}%`,
                    data: updated,
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Invalid rate value" });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );


    fastify.post<{ Params: { id: string } }>(
        "/admin/affiliates/:id/payout",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;
                const result = await affiliateManager.processPayout(id);

                if (!result.success) {
                    return reply.code(400).send({ ok: false, message: result.message });
                }

                return reply.send({
                    ok: true,
                    message: "Payout processed successfully",
                    data: result.payout
                } as ApiResponse);

            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    const BulkPayoutSchema = z.object({
        affiliateIds: z.array(z.string()).min(1),
    });

    fastify.post<{ Body: z.infer<typeof BulkPayoutSchema> }>(
        "/admin/affiliates/payout-bulk",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { affiliateIds } = BulkPayoutSchema.parse(request.body);
                const results = await affiliateManager.processBulkPayouts(affiliateIds);

                return reply.send({
                    ok: true,
                    message: `Processed ${affiliateIds.length} payouts`,
                    data: results
                } as ApiResponse);

            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Invalid request data: " + err.errors[0].message });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // ─── NEW: Live Stripe account details (balance, status, payout schedule) ───
    fastify.get(
        "/affiliates/stripe/account-details",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
                const affiliate = await prisma.affiliate.findUnique({ where: { userId } });

                if (!affiliate?.stripeAccountId) {
                    return reply.send({ ok: true, data: { connected: false } } as ApiResponse);
                }

                if (!env.STRIPE_API_KEY) {
                    return reply.send({
                        ok: true,
                        data: {
                            connected: true,
                            accountId: affiliate.stripeAccountId,
                            status: affiliate.stripeAccountStatus,
                            liveDataAvailable: false,
                        },
                    } as ApiResponse);
                }

                const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2024-06-20" as any });

                // Retrieve live account info
                const account = await stripe.accounts.retrieve(affiliate.stripeAccountId);

                // Retrieve connected account's own balance (as platform)
                let connectedBalance: { available: number; pending: number } = { available: 0, pending: 0 };
                try {
                    const bal = await stripe.balance.retrieve({}, { stripeAccount: affiliate.stripeAccountId });
                    connectedBalance = {
                        available: bal.available.reduce((s, b) => s + b.amount, 0) / 100,
                        pending: bal.pending.reduce((s, b) => s + b.amount, 0) / 100,
                    };
                } catch (_) {
                    // Not all accounts have balance readable by platform
                }

                const schedule = account.settings?.payouts?.schedule;

                return reply.send({
                    ok: true,
                    data: {
                        connected: true,
                        liveDataAvailable: true,
                        accountId: account.id,
                        detailsSubmitted: account.details_submitted,
                        chargesEnabled: account.charges_enabled,
                        payoutsEnabled: account.payouts_enabled,
                        requirementsDue: account.requirements?.currently_due ?? [],
                        defaultCurrency: account.default_currency,
                        payoutSchedule: schedule
                            ? `${schedule.interval === "daily" ? "Daily" : schedule.interval === "weekly" ? `Weekly (${schedule.weekly_anchor})` : `Monthly (day ${schedule.monthly_anchor})`}`
                            : "Manual",
                        connectedBalance,
                    },
                } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // ─── NEW: Generate Stripe Express Dashboard login link ──────────────────
    fastify.post(
        "/affiliates/stripe/login-link",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
                const affiliate = await prisma.affiliate.findUnique({ where: { userId } });

                if (!affiliate?.stripeAccountId || affiliate.stripeAccountStatus !== "active") {
                    return reply.code(400).send({ ok: false, message: "No active Stripe account connected" });
                }

                if (!env.STRIPE_API_KEY) {
                    return reply.code(400).send({ ok: false, message: "Stripe not configured" });
                }

                const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2024-06-20" as any });
                const loginLink = await stripe.accounts.createLoginLink(affiliate.stripeAccountId);

                return reply.send({ ok: true, data: { url: loginLink.url } } as ApiResponse);
            } catch (err: any) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: err.message || "Server error" });
            }
        }
    );

    // ─── NEW: Tax compliance status (YTD earnings + $600 threshold) ─────────
    fastify.get(
        "/affiliates/me/tax-status",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
                const affiliate = await prisma.affiliate.findUnique({ where: { userId } });

                // YTD = Jan 1 of current year to now
                const now = new Date();
                const ytdStart = new Date(now.getFullYear(), 0, 1);

                const ytdTxs = await prisma.rewardTransaction.findMany({
                    where: {
                        referrerId: userId,
                        status: { in: ["available", "paid"] },
                        createdAt: { gte: ytdStart },
                    },
                });
                const ytdEarnings = ytdTxs.reduce((s, t) => s + t.amount, 0);
                const thresholdCrossed = ytdEarnings >= 600;

                // 1099 availability via Stripe (if connected)
                let taxForms: any[] = [];
                if (affiliate?.stripeAccountId && env.STRIPE_API_KEY) {
                    try {
                        const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2024-06-20" as any });
                        // List tax forms for this connected account (Stripe Tax Forms API)
                        const forms = await (stripe as any).tax?.forms?.list?.(
                            { limit: 10 },
                            { stripeAccount: affiliate.stripeAccountId }
                        );
                        taxForms = forms?.data ?? [];
                    } catch (_) {
                        // Tax Forms API may not be enabled — graceful skip
                    }
                }

                return reply.send({
                    ok: true,
                    data: {
                        ytdEarnings: Math.round(ytdEarnings * 100) / 100,
                        ytdStart: ytdStart.toISOString(),
                        thresholdCrossed,
                        thresholdAmount: 600,
                        taxFormCompleted: affiliate?.taxFormCompleted ?? false,
                        tax1099Uploaded: affiliate?.tax1099Uploaded ?? false,
                        availableTaxForms: taxForms.length,
                        taxForms: taxForms.map((f: any) => ({
                            id: f.id,
                            type: f.type,
                            year: f.filing_details?.year,
                            status: f.status,
                        })),
                    },
                } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // ── GET /affiliates/me/payout-eligibility ─────────────────────────────────
    fastify.get(
        "/affiliates/me/payout-eligibility",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
                const affiliate = await prisma.affiliate.findUnique({
                    where: { userId },
                    include: {
                        payouts: {
                            where: {
                                status: "PAID",
                                createdAt: {
                                    gte: new Date(new Date().getFullYear(), 0, 1), // Jan 1 of this year
                                    lt: new Date(new Date().getFullYear() + 1, 0, 1),
                                },
                            },
                            select: { netAmount: true },
                        },
                    },
                });

                if (!affiliate) {
                    return reply.code(404).send({ ok: false, message: "Affiliate record not found" });
                }

                const ytdPaid = affiliate.payouts.reduce((sum: number, p: any) => sum + p.netAmount, 0);
                const IRSThreshold = 600;
                const thresholdReached = ytdPaid >= IRSThreshold;
                const taxComplete = affiliate.taxFormCompleted && affiliate.tax1099Uploaded;
                const eligibleForPayout = !affiliate.payoutHeld && (!thresholdReached || taxComplete);

                return reply.code(200).send({
                    ok: true,
                    data: {
                        eligible: eligibleForPayout,
                        payoutHeld: affiliate.payoutHeld,
                        holdReason: affiliate.payoutHoldReason,
                        ytdPaid: Math.round(ytdPaid * 100) / 100,
                        irsThreshold: IRSThreshold,
                        thresholdReached,
                        taxFormCompleted: affiliate.taxFormCompleted,
                        tax1099Uploaded: affiliate.tax1099Uploaded,
                        requiredActions: [
                            ...(!affiliate.taxFormCompleted ? ["Complete tax information form"] : []),
                            ...(!affiliate.tax1099Uploaded ? ["Upload W-9 or tax documentation"] : []),
                        ],
                    },
                });
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // ── POST /affiliates/me/submit-tax-docs ───────────────────────────────────
    fastify.post<{ Body: { taxFormUrl?: string; tinSsn?: string } }>(
        "/affiliates/me/submit-tax-docs",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
                const { taxFormUrl, tinSsn } = request.body as any;

                // Update user tax fields
                if (taxFormUrl || tinSsn) {
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            ...(taxFormUrl && { taxFormUrl }),
                            ...(tinSsn && { tinSsn }),
                        },
                    });
                }

                // Mark affiliate tax1099Uploaded + taxFormCompleted if both are present
                const user = await prisma.user.findUnique({ where: { id: userId }, select: { taxFormUrl: true, tinSsn: true } });
                const hasDoc = !!(taxFormUrl || user?.taxFormUrl);
                const hasTin = !!(tinSsn || user?.tinSsn);

                await prisma.affiliate.update({
                    where: { userId },
                    data: {
                        ...(hasDoc && { tax1099Uploaded: true }),
                        ...(hasTin && { taxFormCompleted: true }),
                    },
                });

                return reply.code(200).send({ ok: true, message: "Tax documents submitted" });
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // ── POST /admin/affiliates/:id/lift-hold ──────────────────────────────────
    fastify.post<{ Params: { id: string } }>(
        "/admin/affiliates/:id/lift-hold",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;
                const adminId = (request.user as AuthPayload).userId;

                const affiliate = await prisma.affiliate.update({
                    where: { id },
                    data: {
                        payoutHeld: false,
                        payoutHoldReason: null,
                        payoutHoldLiftedAt: new Date(),
                        payoutHoldLiftedBy: adminId,
                    },
                    include: { user: { select: { id: true, name: true, email: true } } },
                });

                // Fire notification to the payee
                try {
                    const { createNotification, NotifType } = await import("../services/notification");
                    await createNotification({
                        userId: affiliate.userId,
                        type: NotifType.TAX_HOLD_LIFTED,
                        title: "Payout Hold Lifted",
                        body: "Your payout hold has been reviewed and lifted. You are now eligible to receive payouts again.",
                        data: { liftedBy: adminId, liftedAt: new Date().toISOString() },
                    });
                } catch { }

                return reply.code(200).send({
                    ok: true,
                    message: `Payout hold lifted for ${affiliate.user.name}`,
                    data: { affiliateId: affiliate.id, userId: affiliate.userId },
                });
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );
}
