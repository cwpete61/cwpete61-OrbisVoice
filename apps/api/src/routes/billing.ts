import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../db";
import { authenticate } from "../middleware/auth";
import { z } from "zod";

// Subscription tier pricing
// Subscription tier pricing
const TIER_LIMITS = {
  ltd: { conversations: 1000, price: 497 },
  starter: { conversations: 1000, price: 197 },
  professional: { conversations: 10000, price: 497 },
  enterprise: { conversations: 100000, price: 997 },
  "ai-revenue-infrastructure": { conversations: 250000, price: 1997 },
};

// Schema for creating a subscription
const createSubscriptionSchema = z.object({
  tier: z.enum(["ltd", "starter", "professional", "enterprise", "ai-revenue-infrastructure"]),
  billingEmail: z.string().email().optional(),
});

// Schema for usage tracking
const trackUsageSchema = z.object({
  count: z.number().int().positive().optional().default(1),
});

export default async function billingRoutes(fastify: FastifyInstance) {
  // Get tenant subscription info
  fastify.get(
    "/billing/subscription",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request.user as any).tenantId;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      }) as any;

      if (!tenant) {
        return reply.code(404).send({ error: "Tenant not found" });
      }

      // Calculate usage percentage
      const usagePercent = (tenant.usageCount / tenant.usageLimit) * 100;

      // Check if usage period has reset
      const now = new Date();
      const shouldReset = now >= tenant.usageResetAt;

      const tierKey = tenant.subscriptionTier as keyof typeof TIER_LIMITS;
      const tierInfo = TIER_LIMITS[tierKey] ?? TIER_LIMITS.starter;

      return reply.send({
        data: {
          ...tenant,
          usagePercent: Math.round(usagePercent * 10) / 10,
          shouldReset,
          tierInfo,
        },
      });
    }
  );

  // Create or upgrade subscription
  fastify.post(
    "/billing/subscription",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request.user as any).tenantId;

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

      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionTier: tier as any,
          subscriptionStatus: "active" as any,
          subscriptionEnds: nextMonth,
          usageLimit: tierLimit,
          billingEmail: billingEmail || undefined,
          // In production: stripeCustomerId and stripeSubscriptionId would be set from Stripe
        } as any,
      }) as any;

      return reply.send({
        message: `Subscription updated to ${tier} tier`,
        data: updated,
      });
    }
  );

  // Cancel subscription
  fastify.delete(
    "/billing/subscription",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request.user as any).tenantId;

      // In production, this would cancel the Stripe subscription
      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          subscriptionStatus: "canceled" as any,
          // Keep tier active until subscriptionEnds date
        } as any,
      }) as any;

      return reply.send({
        message: "Subscription canceled. Access continues until end of billing period.",
        data: updated,
      });
    }
  );

  // Track usage (called when a conversation is created)
  fastify.post(
    "/billing/usage",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request.user as any).tenantId;

      const validation = trackUsageSchema.safeParse(request.body);
      if (!validation.success) {
        return reply.code(400).send({
          error: "Validation failed",
          details: validation.error.errors,
        });
      }

      const { count } = validation.data;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: {
          id: true,
          name: true,
          usageCount: true,
          usageLimit: true,
          usageResetAt: true,
          createdAt: true,
          updatedAt: true,
        } as any,
      }) as any;

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
      } else {
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

      const updated = await prisma.tenant.update({
        where: { id: tenantId },
        data: resetData,
      }) as any;

      return reply.send({
        data: {
          usageCount: updated.usageCount,
          usageLimit: updated.usageLimit,
          remaining: updated.usageLimit - updated.usageCount,
        },
      });
    }
  );

  // Get usage history (last 30 days)
  fastify.get(
    "/billing/usage/history",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request.user as any).tenantId;

      // Get transcripts from last 30 days grouped by date
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const transcripts = await prisma.transcript.groupBy({
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
      const usageByDay: Record<string, number> = {};
      transcripts.forEach((record: any) => {
        const date = record.createdAt.toISOString().split("T")[0];
        usageByDay[date] = (usageByDay[date] || 0) + record._count;
      });

      return reply.send({
        data: usageByDay,
      });
    }
  );

  // Get available tiers and pricing
  fastify.get("/billing/tiers", async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      data: TIER_LIMITS,
    });
  });
}
