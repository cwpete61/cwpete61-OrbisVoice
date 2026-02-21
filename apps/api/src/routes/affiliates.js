"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateRoutes = affiliateRoutes;
const auth_1 = require("../middleware/auth");
const affiliate_1 = require("../services/affiliate");
const db_1 = require("../db");
const env_1 = require("../env");
const zod_1 = require("zod");
const stripe_1 = __importDefault(require("stripe"));
const bcrypt = __importStar(require("bcryptjs"));
const PublicApplySchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(8).optional(), // optional if they already have an account
    firstName: zod_1.z.string().min(1),
    lastName: zod_1.z.string().min(1),
    businessName: zod_1.z.string().optional(),
    address: zod_1.z.string().min(1),
    unit: zod_1.z.string().optional(),
    city: zod_1.z.string().min(1),
    state: zod_1.z.string().min(1),
    zip: zod_1.z.string().min(1),
    phone: zod_1.z.string().min(1),
    tinSsn: zod_1.z.string().min(1),
    taxFormUrl: zod_1.z.string().optional(),
});
async function affiliateRoutes(fastify) {
    // Public endpoint to get program details (commission rates)
    fastify.get("/affiliates/program-details", async (request, reply) => {
        try {
            const settings = await db_1.prisma.platformSettings.findUnique({
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
                return reply.send({
                    ok: true,
                    data: {
                        commissionRate: 30,
                        payoutMinimum: 100,
                    },
                });
            }
            let commissionRate = settings.lowCommission;
            if (settings.defaultCommissionLevel === "MED") commissionRate = settings.medCommission;
            if (settings.defaultCommissionLevel === "HIGH") commissionRate = settings.highCommission;
            return reply.send({
                ok: true,
                data: {
                    commissionRate,
                    payoutMinimum: settings.payoutMinimum,
                },
            });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Get current user's affiliate status and stats
    fastify.get("/affiliates/me", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const stats = await affiliate_1.affiliateManager.getStats(userId);
            if (!stats) {
                return reply.send({
                    ok: true,
                    data: { isAffiliate: false },
                });
            }
            return reply.send({
                ok: true,
                data: {
                    isAffiliate: true,
                    ...stats,
                },
            });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Public endpoint for users to apply for the affiliate program (creates account if new)
    fastify.post("/affiliates/public-apply", async (request, reply) => {
        try {
            const body = PublicApplySchema.parse(request.body);
            let user = await db_1.prisma.user.findUnique({ where: { email: body.email } });
            if (user) {
                if (!body.password) {
                    return reply.code(400).send({ ok: false, message: "Please provide your password to verify your account" });
                }
                if (!user.passwordHash || !(await bcrypt.compare(body.password, user.passwordHash))) {
                    return reply.code(401).send({ ok: false, message: "Invalid email or password" });
                }
                // Update existing user's billing info
                user = await db_1.prisma.user.update({
                    where: { id: user.id },
                    data: {
                        firstName: body.firstName,
                        lastName: body.lastName,
                        businessName: body.businessName,
                        address: body.address,
                        unit: body.unit,
                        city: body.city,
                        state: body.state,
                        zip: body.zip,
                        phone: body.phone,
                        tinSsn: body.tinSsn,
                        taxFormUrl: body.taxFormUrl,
                    },
                });
            }
            else {
                if (!body.password) {
                    return reply.code(400).send({ ok: false, message: "Password is required for new accounts" });
                }
                // Create new user
                const hashedPassword = await bcrypt.hash(body.password, 10);
                const tenant = await db_1.prisma.tenant.create({ data: { name: `${body.firstName}'s Workspace` } });
                user = await db_1.prisma.user.create({
                    data: {
                        email: body.email,
                        name: `${body.firstName} ${body.lastName}`,
                        username: body.email.split('@')[0] + Math.floor(Math.random() * 1000),
                        passwordHash: hashedPassword,
                        tenantId: tenant.id,
                        firstName: body.firstName,
                        lastName: body.lastName,
                        businessName: body.businessName,
                        address: body.address,
                        unit: body.unit,
                        city: body.city,
                        state: body.state,
                        zip: body.zip,
                        phone: body.phone,
                        tinSsn: body.tinSsn,
                        taxFormUrl: body.taxFormUrl,
                    },
                });
            }
            // Apply for affiliate
            const result = await affiliate_1.affiliateManager.applyForAffiliate(user.id, "PENDING");
            if (!result.success) {
                return reply.code(400).send({ ok: false, message: result.message });
            }
            // Generate Auth JWT so they are logged in seamlessly
            const token = fastify.jwt.sign({ userId: user.id, tenantId: user.tenantId, email: user.email }, { expiresIn: "7d" });
            return reply.send({ ok: true, message: "Application submitted successfully", data: { token } });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ ok: false, message: "Invalid application data: " + err.errors[0].message });
            }
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Update affiliate payout email
    fastify.put("/affiliates/me/payout-email", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { payoutEmail } = zod_1.z.object({ payoutEmail: zod_1.z.string().email() }).parse(request.body);
            const affiliate = await db_1.prisma.affiliate.findUnique({ where: { userId } });
            if (!affiliate) {
                return reply.code(404).send({ ok: false, message: "No affiliate profile found" });
            }
            await db_1.prisma.affiliate.update({
                where: { userId },
                data: { payoutEmail },
            });
            return reply.send({ ok: true, message: "Payout email updated" });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ ok: false, message: "Invalid email address" });
            }
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Get current user's Stripe Connect status
    fastify.get("/affiliates/stripe/status", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            let affiliate = await db_1.prisma.affiliate.findUnique({ where: { userId } });
            if (!affiliate) {
                // Create an empty affiliate record so standard users can connect Stripe too
                affiliate = await db_1.prisma.affiliate.create({
                    data: {
                        userId,
                        status: "PENDING",
                        balance: 0,
                        totalPaid: 0,
                    },
                });
            }
            if (!affiliate.stripeAccountId) {
                return reply.send({ ok: true, data: { status: "not_connected", accountId: null } });
            }
            // If pending, check Stripe directly to see if they finished onboarding
            let currentStatus = affiliate.stripeAccountStatus;
            if (currentStatus === "pending" && env_1.env.STRIPE_API_KEY) {
                const stripe = new stripe_1.default(env_1.env.STRIPE_API_KEY, { apiVersion: "2024-06-20" });
                const account = await stripe.accounts.retrieve(affiliate.stripeAccountId);
                if (account.details_submitted) {
                    currentStatus = "active";
                    await db_1.prisma.affiliate.update({
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
            });
        }
        catch (err) {
            fastify.log.error(err, "Failed to fetch Stripe Connect status:");
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Generate Stripe Connect onboarding link
    fastify.post("/affiliates/stripe/onboard", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            if (!env_1.env.STRIPE_API_KEY) {
                return reply.code(400).send({ ok: false, message: "Stripe integration is not configured" });
            }
            const userId = request.user.userId;
            let affiliate = await db_1.prisma.affiliate.findUnique({
                where: { userId },
                include: { user: true }
            });
            if (!affiliate) {
                // Create an empty affiliate record for standard users
                affiliate = await db_1.prisma.affiliate.create({
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
            const stripe = new stripe_1.default(env_1.env.STRIPE_API_KEY, { apiVersion: "2024-06-20" });
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
                await db_1.prisma.affiliate.update({
                    where: { id: affiliate.id },
                    data: { stripeAccountId: accountId, stripeAccountStatus: "pending" },
                });
            }
            // Generate onboarding link
            const accountLink = await stripe.accountLinks.create({
                account: accountId,
                refresh_url: `${env_1.env.WEB_URL}/affiliates?stripe_refresh=true`,
                return_url: `${env_1.env.WEB_URL}/affiliates?stripe_return=true`,
                type: "account_onboarding",
            });
            return reply.send({
                ok: true,
                data: { url: accountLink.url },
            });
        }
        catch (err) {
            fastify.log.error("Failed to generate Stripe onboarding link:", err);
            return reply.code(500).send({ ok: false, message: `Server error: ${err.message}` });
        }
    });
    // Apply for affiliate status
    fastify.post("/affiliates/apply", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const result = await affiliate_1.affiliateManager.applyForAffiliate(userId);
            if (!result.success) {
                return reply.code(400).send({ ok: false, message: result.message });
            }
            return reply.send({
                ok: true,
                message: "Application submitted successfully",
                data: result.data,
            });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: List all affiliate applications
    fastify.get("/admin/affiliates", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const affiliates = await db_1.prisma.affiliate.findMany({
                include: {
                    user: {
                        select: { name: true, email: true, username: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            return reply.send({ ok: true, data: affiliates });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: Update affiliate status
    const UpdateStatusSchema = zod_1.z.object({
        status: zod_1.z.enum(["PENDING", "ACTIVE", "REJECTED"]),
    });
    fastify.post("/admin/affiliates/:id/status", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { status } = UpdateStatusSchema.parse(request.body);
            const updated = await db_1.prisma.affiliate.update({
                where: { id },
                data: { status },
            });
            return reply.send({
                ok: true,
                message: `Affiliate status updated to ${status}`,
                data: updated,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ ok: false, message: "Invalid status" });
            }
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: Promote user to affiliate directly
    const PromoteSchema = zod_1.z.object({
        userId: zod_1.z.string(),
    });
    fastify.post("/admin/affiliates/promote", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { userId } = PromoteSchema.parse(request.body);
            // We pass "ACTIVE" to skip the pending state for manual admin promotion
            const result = await affiliate_1.affiliateManager.applyForAffiliate(userId, "ACTIVE");
            if (!result.success) {
                return reply.code(400).send({ ok: false, message: result.message });
            }
            return reply.send({
                ok: true,
                message: "User promoted to affiliate successfully",
                data: result.data,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ ok: false, message: "Missing userId" });
            }
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: Process payout for an affiliate
    fastify.post("/admin/affiliates/:id/payout", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const affiliate = await db_1.prisma.affiliate.findUnique({
                where: { id }
            });
            if (!affiliate) {
                return reply.code(404).send({ ok: false, message: "Affiliate not found" });
            }
            // Find all available transactions for this user
            const txs = await db_1.prisma.rewardTransaction.findMany({
                where: { referrerId: affiliate.userId, status: 'available' }
            });
            if (txs.length === 0) {
                return reply.code(400).send({ ok: false, message: "No available funds to payout" });
            }
            const payoutAmount = txs.reduce((sum, t) => sum + t.amount, 0);
            // Update within a transaction
            await db_1.prisma.$transaction(async (tx) => {
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
            });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
}
