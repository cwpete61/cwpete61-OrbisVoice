import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { prisma } from "../db";
import { authenticate } from "../middleware/auth";
import { z } from "zod";
import { referralManager } from "../services/referral";
import { env } from "../env";
import { logger } from "../logger";
import { AuthPayload } from "../types";

// Stripe Price IDs — map each tier to its Stripe price(s)
const STRIPE_PRICES: Record<string, { oneTime?: string; recurring?: string }> = {
  ltd: {
    oneTime: "price_1T2kFjEFjM4hGTWYoZrCCDMJ",    // $497 one-time
    recurring: "price_1T2kHaEFjM4hGTWYOvNxHr89",   // $20/month
  },
  starter: {
    recurring: "price_1T2kh8EFjM4hGTWY08r5GmOe",   // $197/month
  },
  professional: {
    recurring: "price_1T2kh9EFjM4hGTWYZxPvZBq6",   // $497/month
  },
  enterprise: {
    recurring: "price_1T2khAEFjM4hGTWY6tmOu6lJ",   // $997/month
  },
  "ai-revenue-infrastructure": {
    recurring: "price_1T2khBEFjM4hGTWYpmm7EC7s",   // $1997/month
  },
};

// Hardcoded prices (conversation limits are now fetched from DB)
const TIER_PRICES = {
  ltd: 497,
  starter: 197,
  professional: 497,
  enterprise: 997,
  "ai-revenue-infrastructure": 1997,
};

async function getTierLimits() {
  const settings = await prisma.platformSettings.findUnique({
    where: { id: "global" },
  });

  return {
    ltd: { conversations: settings?.ltdLimit ?? 1000, price: TIER_PRICES.ltd },
    starter: { conversations: settings?.starterLimit ?? 1000, price: TIER_PRICES.starter },
    professional: { conversations: settings?.professionalLimit ?? 10000, price: TIER_PRICES.professional },
    enterprise: { conversations: settings?.enterpriseLimit ?? 100000, price: TIER_PRICES.enterprise },
    "ai-revenue-infrastructure": { conversations: settings?.aiInfraLimit ?? 250000, price: TIER_PRICES["ai-revenue-infrastructure"] },
  };
}

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

  // ─── CREATE STRIPE CHECKOUT SESSION ──────────────────────────
  fastify.post(
    "/billing/checkout",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;
      const userId = (request as unknown as { user: AuthPayload }).user.userId;

      const parsed = z.object({
        tier: z.enum(["ltd", "starter", "professional", "enterprise", "ai-revenue-infrastructure"]),
      }).safeParse(request.body);

      if (!parsed.success) {
        logger.error({ errors: parsed.error.issues }, "Invalid checkout request body");
        return reply.code(400).send({ error: "Invalid tier specified" });
      }

      const { tier } = parsed.data;

      const stripePrices = STRIPE_PRICES[tier];
      if (!stripePrices || (!stripePrices.oneTime && !stripePrices.recurring)) {
        return reply.code(400).send({ error: `Stripe checkout is not yet available for the ${tier} tier. Please contact support.` });
      }

      if (!env.STRIPE_API_KEY) {
        return reply.code(500).send({ error: "Stripe API key not configured" });
      }

      try {
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!tenant || !user) {
          return reply.code(404).send({ error: "Tenant or user not found" });
        }

        // Get or create Stripe customer
        let stripeCustomerId = tenant.stripeCustomerId;
        if (!stripeCustomerId) {
          const params = new URLSearchParams({
            email: user.email,
            name: user.name || tenant.name || "",
            "metadata[tenantId]": tenantId,
            "metadata[userId]": userId,
          });

          const customerRes = await fetch("https://api.stripe.com/v1/customers", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.STRIPE_API_KEY}`,
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          });

          if (!customerRes.ok) {
            const err = await customerRes.text();
            logger.error({ err }, "Failed to create Stripe customer");
            return reply.code(500).send({ error: "Failed to create Stripe customer" });
          }

          const customer = (await customerRes.json()) as any;
          stripeCustomerId = customer.id;

          // Save Stripe customer ID to tenant
          await prisma.tenant.update({
            where: { id: tenantId },
            data: { stripeCustomerId },
          });
        }

        const webUrl = env.WEB_URL || "http://localhost:3000";

        // Build the checkout session parameters
        const bodyParts: string[] = [];
        bodyParts.push(`customer=${stripeCustomerId}`);
        bodyParts.push(`success_url=${encodeURIComponent(`${webUrl}/billing?success=true`)}`);
        bodyParts.push(`cancel_url=${encodeURIComponent(`${webUrl}/billing?canceled=true`)}`);
        bodyParts.push(`metadata[tier]=${tier}`);
        bodyParts.push(`metadata[tenantId]=${tenantId}`);
        bodyParts.push(`metadata[userId]=${userId}`);

        // For LTD: charge $497 one-time first, $20/month subscription starts via webhook
        // For other tiers: just the recurring subscription
        if (stripePrices.oneTime && stripePrices.recurring) {
          // LTD: payment mode for the $497 one-time
          // The $20/month subscription will be created in the webhook after payment
          bodyParts.push(`mode=payment`);
          bodyParts.push(`line_items[0][price]=${stripePrices.oneTime}`);
          bodyParts.push(`line_items[0][quantity]=1`);
        } else if (stripePrices.recurring) {
          // Regular subscription tiers
          bodyParts.push(`mode=subscription`);
          bodyParts.push(`line_items[0][price]=${stripePrices.recurring}`);
          bodyParts.push(`line_items[0][quantity]=1`);
        } else if (stripePrices.oneTime) {
          // One-time only
          bodyParts.push(`mode=payment`);
          bodyParts.push(`line_items[0][price]=${stripePrices.oneTime}`);
          bodyParts.push(`line_items[0][quantity]=1`);
        }

        const sessionRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.STRIPE_API_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: bodyParts.join("&"),
        });

        if (!sessionRes.ok) {
          const errText = await sessionRes.text();
          logger.error({ err: errText, tier }, "Failed to create Stripe Checkout session");
          return reply.code(400).send({ error: "Failed to create checkout session", details: errText });
        }

        const session = (await sessionRes.json()) as any;
        logger.info({ sessionId: session.id, tier }, "Checkout session created");

        return reply.send({ url: session.url });
      } catch (err) {
        logger.error({ err }, "Checkout error");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );

  // Get tenant subscription info
  fastify.get(
    "/billing/subscription",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return reply.code(404).send({ error: "Tenant not found" });
      }

      // Calculate usage percentage
      const usagePercent = (tenant.usageCount / tenant.usageLimit) * 100;

      // Check if usage period has reset
      const now = new Date();
      const shouldReset = now >= tenant.usageResetAt;

      const tierLimits = await getTierLimits();
      const tierKey = tenant.subscriptionTier as keyof typeof tierLimits;
      const tierInfo = tierLimits[tierKey] ?? tierLimits.starter;

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
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

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

      const tierLimits = await getTierLimits();
      const tierLimit = tierLimits[tier].conversations;
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const updated = await prisma.tenant.update({
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

      // Simulate a webhook for commission processing (since we lack a live webhook here)
      // Only trigger if they are selecting a paid plan
      if (tierLimits[tier].price > 0) {
        const user = await prisma.user.findFirst({
          where: { tenantId }
        });

        if (user) {
          const simulatedPaymentId = `sub_${Date.now()}_${Math.random().toString(36).substring(7)}`;
          await referralManager.processCommission(user.id, tierLimits[tier].price, simulatedPaymentId);
        }
      }

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
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

      // In production, this would cancel the Stripe subscription
      const updated = await prisma.tenant.update({
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
    }
  );

  // Track usage (called when a conversation is created)
  fastify.post(
    "/billing/usage",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

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
      });

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
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

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
      transcripts.forEach((record: { createdAt: Date, _count: number }) => {
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
    const tierLimits = await getTierLimits();
    return reply.send({
      data: tierLimits,
    });
  });

  // Purchase conversation package
  fastify.post(
    "/billing/purchase-package",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;
      const { packageId } = (request.body as any) || {};

      if (!packageId) {
        return reply.code(400).send({ error: "Package ID is required" });
      }

      try {
        const pkg = await prisma.conversationPackage.findUnique({
          where: { id: packageId, active: true },
        });

        if (!pkg) {
          return reply.code(404).send({ error: "Package not found or inactive" });
        }

        // In production: Create Stripe Checkout session for this package
        // For now: Simulate successful purchase and add credits

        const updated = await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            creditBalance: {
              increment: pkg.credits,
            },
          },
        });

        logger.info({ tenantId, packageId, credits: pkg.credits }, "Credits purchased");

        return reply.send({
          ok: true,
          message: `Successfully purchased ${pkg.name}. ${pkg.credits} credits added.`,
          data: {
            newBalance: updated.creditBalance,
          },
        });
      } catch (err) {
        logger.error({ err }, "Failed to purchase package");
        return reply.code(500).send({ error: "Internal server error" });
      }
    }
  );
}
