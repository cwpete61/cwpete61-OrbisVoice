"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = billingRoutes;
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const zod_1 = require("zod");
// Subscription tier pricing
const TIER_LIMITS = {
    starter: { conversations: 1000, price: 197 },
    professional: { conversations: 10000, price: 497 },
    enterprise: { conversations: 100000, price: 997 },
    "ai-revenue-infrastructure": { conversations: 250000, price: 1997 },
};
// Schema for creating a subscription
const createSubscriptionSchema = zod_1.z.object({
    tier: zod_1.z.enum(["starter", "professional", "enterprise", "ai-revenue-infrastructure"]),
    billingEmail: zod_1.z.string().email().optional(),
});
// Schema for usage tracking
const trackUsageSchema = zod_1.z.object({
    count: zod_1.z.number().int().positive().optional().default(1),
});
async function billingRoutes(fastify) {
    // Get tenant subscription info
    fastify.get("/billing/subscription", { preHandler: [auth_1.authenticate] }, async (request, reply) => {
        const tenantId = request.user.tenantId;
        const tenant = await db_1.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                subscriptionTier: true,
                subscriptionStatus: true,
                subscriptionEnds: true,
                usageLimit: true,
                usageCount: true,
                usageResetAt: true,
                billingEmail: true,
                stripeCustomerId: true,
                stripeSubscriptionId: true,
            },
        });
        if (!tenant) {
            return reply.code(404).send({ error: "Tenant not found" });
        }
        // Calculate usage percentage
        const usagePercent = (tenant.usageCount / tenant.usageLimit) * 100;
        // Check if usage period has reset
        const now = new Date();
        const shouldReset = now >= tenant.usageResetAt;
        const tierKey = tenant.subscriptionTier;
        const tierInfo = TIER_LIMITS[tierKey] || TIER_LIMITS.starter;
        return reply.send({
            data: {
                ...tenant,
                usagePercent: Math.round(usagePercent * 10) / 10,
                shouldReset,
                tierInfo,
            },
        });
    });
    // Create or upgrade subscription
    fastify.post("/billing/subscription", { preHandler: [auth_1.authenticate] }, async (request, reply) => {
        const tenantId = request.user.tenantId;
        const validation = createSubscriptionSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({
                error: "Validation failed",
                details: validation.error.errors,
            });
        }
        const { tier, billingEmail } = validation.data;
        // In production, this would integrate with Stripe to create a subscription
        // For now, we'll simulate the subscription creation
        const tierLimit = TIER_LIMITS[tier].conversations;
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const updated = await db_1.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                subscriptionTier: tier,
                subscriptionStatus: "active",
                subscriptionEnds: nextMonth,
                usageLimit: tierLimit,
                billingEmail: billingEmail || undefined,
                // In production: stripeCustomerId and stripeSubscriptionId would be set from Stripe
            },
        });
        return reply.send({
            message: `Subscription updated to ${tier} tier`,
            data: updated,
        });
    });
    // Cancel subscription
    fastify.delete("/billing/subscription", { preHandler: [auth_1.authenticate] }, async (request, reply) => {
        const tenantId = request.user.tenantId;
        // In production, this would cancel the Stripe subscription
        const updated = await db_1.prisma.tenant.update({
            where: { id: tenantId },
            data: {
                subscriptionStatus: "canceled",
                // Keep tier active until subscriptionEnds date
            },
        });
        return reply.send({
            message: "Subscription canceled. Access continues until end of billing period.",
            data: updated,
        });
    });
    // Track usage (called when a conversation is created)
    fastify.post("/billing/usage", { preHandler: [auth_1.authenticate] }, async (request, reply) => {
        const tenantId = request.user.tenantId;
        const validation = trackUsageSchema.safeParse(request.body);
        if (!validation.success) {
            return reply.code(400).send({
                error: "Validation failed",
                details: validation.error.errors,
            });
        }
        const { count } = validation.data;
        const tenant = await db_1.prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                usageCount: true,
                usageLimit: true,
                usageResetAt: true,
            },
        });
        if (!tenant) {
            return reply.code(404).send({ error: "Tenant not found" });
        }
        // Check if usage period should reset (monthly)
        const now = new Date();
        let resetData = {};
        if (now >= tenant.usageResetAt) {
            const nextReset = new Date(now);
            nextReset.setMonth(nextReset.getMonth() + 1);
            resetData = {
                usageCount: count,
                usageResetAt: nextReset,
            };
        }
        else {
            const newCount = tenant.usageCount + count;
            if (newCount > tenant.usageLimit) {
                return reply.code(429).send({
                    error: "Usage limit exceeded",
                    current: newCount,
                    limit: tenant.usageLimit,
                    resetsAt: tenant.usageResetAt,
                });
            }
            resetData = {
                usageCount: newCount,
            };
        }
        const updated = await db_1.prisma.tenant.update({
            where: { id: tenantId },
            data: resetData,
        });
        return reply.send({
            data: {
                usageCount: updated.usageCount,
                usageLimit: updated.usageLimit,
                remaining: updated.usageLimit - updated.usageCount,
            },
        });
    });
    // Get usage history (last 30 days)
    fastify.get("/billing/usage/history", { preHandler: [auth_1.authenticate] }, async (request, reply) => {
        const tenantId = request.user.tenantId;
        // Get transcripts from last 30 days grouped by date
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const transcripts = await db_1.prisma.transcript.groupBy({
            by: ["createdAt"],
            where: {
                agent: {
                    tenantId: tenantId,
                },
                createdAt: {
                    gte: thirtyDaysAgo,
                },
            },
            _count: true,
        });
        // Group by date
        const usageByDay = {};
        transcripts.forEach((record) => {
            const date = record.createdAt.toISOString().split("T")[0];
            usageByDay[date] = (usageByDay[date] || 0) + record._count;
        });
        return reply.send({
            data: usageByDay,
        });
    });
    // Get available tiers and pricing
    fastify.get("/billing/tiers", async (request, reply) => {
        return reply.send({
            data: TIER_LIMITS,
        });
    });
}
