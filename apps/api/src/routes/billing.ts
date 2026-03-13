import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { prisma } from "../db";
import { StripeClient } from "../integrations/stripe";
import { env } from "../env";
import { logger } from "../logger";

const stripe = new StripeClient({
  apiKey: env.STRIPE_API_KEY || "",
});

// Price ID mapping - fallback to placeholders if not in env
const PRICE_IDS: Record<string, string> = {
  starter: process.env.STRIPE_PRICE_STARTER || "price_starter_placeholder",
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || "price_professional_placeholder",
  enterprise: process.env.STRIPE_PRICE_ENTERPRISE || "price_enterprise_placeholder",
  "ai-revenue-infrastructure": process.env.STRIPE_PRICE_AI_INFRA || "price_ai_infra_placeholder",
};

const CheckoutSchema = z.object({
  tier: z.enum(["starter", "professional", "enterprise", "ai-revenue-infrastructure", "ltd"]),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
});

async function billingRoutes(fastify: FastifyInstance) {
  // Get available tiers
  fastify.get(
    "/billing/tiers",
    async (request, reply) => {
      const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      
      const tiers = {
        starter: { conversations: settings?.starterLimit ?? 1000, price: 197 },
        professional: { conversations: settings?.professionalLimit ?? 10000, price: 497 },
        enterprise: { conversations: settings?.enterpriseLimit ?? 100000, price: 997 },
        "ai-revenue-infrastructure": { conversations: settings?.aiInfraLimit ?? 250000, price: 1997 },
        ltd: { conversations: settings?.ltdLimit ?? 1000, price: 497, monthly: 20 }
      };

      return {
        ok: true,
        data: tiers,
      };
    }
  );

  // Get current subscription status
  fastify.get(
    "/billing/subscription",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const { tenantId } = request.user as any;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      let tierInfo = { conversations: 1000, price: 197 };
      if (tenant.subscriptionTier === 'professional') tierInfo = { conversations: settings?.professionalLimit ?? 10000, price: 497 };
      else if (tenant.subscriptionTier === 'enterprise') tierInfo = { conversations: settings?.enterpriseLimit ?? 100000, price: 997 };
      else if (tenant.subscriptionTier === 'ai-revenue-infrastructure') tierInfo = { conversations: settings?.aiInfraLimit ?? 250000, price: 1997 };
      else if (tenant.subscriptionTier === 'ltd') tierInfo = { conversations: settings?.ltdLimit ?? 1000, price: 497 };

      const usagePercent = Math.min(100, (tenant.usageCount / (tenant.usageLimit || 1)) * 100);

      return {
        ok: true,
        data: {
          ...tenant,
          usagePercent,
          tierInfo
        },
      };
    }
  );

  // Create Checkout Session
  fastify.post(
    "/billing/checkout",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const { tenantId, email } = request.user as any;
      const { tier, successUrl, cancelUrl } = CheckoutSchema.parse(request.body);

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      let customerId = tenant.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        try {
          const customer = await stripe.createCustomer({
            email,
            name: tenant.name,
            metadata: { tenantId },
          });
          customerId = customer.id;

          await prisma.tenant.update({
            where: { id: tenantId },
            data: { stripeCustomerId: customerId },
          });
        } catch (err) {
          logger.error({ err, tenantId }, "Failed to create Stripe customer");
          return reply.status(500).send({ error: "Stripe customer creation failed" });
        }
      }

      const priceId = PRICE_IDS[tier];
      if (!priceId || (priceId.includes("placeholder") && env.NODE_ENV === 'production')) {
        return reply.status(400).send({ 
          error: `Price ID not configured for tier: ${tier}. Please contact support.` 
        });
      }

      try {
        const session = await stripe.createCheckoutSession({
          customerId: customerId!,
          priceId: priceId.includes("placeholder") ? "price_1T2kHaEFjM4hGTWYOvNxHr89" : priceId, // Fallback to a test price if placeholder
          successUrl: successUrl || `${env.WEB_URL}/billing?success=true`,
          cancelUrl: cancelUrl || `${env.WEB_URL}/billing?canceled=true`,
          metadata: { tenantId, tier },
        });

        return {
          ok: true,
          url: session.url,
          sessionId: session.id,
        };
      } catch (err) {
        logger.error({ err, tenantId }, "Failed to create checkout session");
        return reply.status(500).send({ error: "Checkout session creation failed" });
      }
    }
  );

  // Cancel Subscription
  fastify.delete(
    "/billing/subscription",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const { tenantId } = request.user as any;

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant || !tenant.stripeSubscriptionId) {
        return reply.status(400).send({ error: "No active subscription found to cancel" });
      }

      try {
        // In this custom fetch-based StripeClient, we should add cancelSubscription
        // For now, we'll manually fetch
        const response = await fetch(`https://api.stripe.com/v1/subscriptions/${tenant.stripeSubscriptionId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${env.STRIPE_API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        await prisma.tenant.update({
          where: { id: tenantId },
          data: { 
            subscriptionStatus: "canceling",
            // Note: Actual transition to 'free' should happen via webhook when period ends
          },
        });

        return { ok: true, message: "Subscription canceled successfully" };
      } catch (err) {
        logger.error({ err, tenantId }, "Failed to cancel subscription");
        return reply.status(500).send({ error: "Subscription cancellation failed" });
      }
    }
  );

  // Create Portal Session
  fastify.post(
    "/billing/portal",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const { tenantId } = request.user as any;
      const { returnUrl } = request.body as { returnUrl: string };

      if (!returnUrl) {
        return reply.status(400).send({ error: "returnUrl is required" });
      }

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant || !tenant.stripeCustomerId) {
        return reply.status(400).send({ error: "Active billing account not found" });
      }

      try {
        const session = await stripe.createPortalSession({
          customerId: tenant.stripeCustomerId,
          returnUrl,
        });

        return {
          ok: true,
          url: session.url,
        };
      } catch (err) {
        logger.error({ err, tenantId }, "Failed to create portal session");
        return reply.status(500).send({ error: "Portal session creation failed" });
      }
    }
  );
}

export default billingRoutes;
