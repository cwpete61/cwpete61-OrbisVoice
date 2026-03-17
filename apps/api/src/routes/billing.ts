import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { prisma } from "../db";
import { StripeClient } from "../integrations/stripe";
import { env } from "../env";
import { logger } from "../logger";
import { UsageService } from "../services/usage-service";
import { referralManager } from "../services/referral";

// Price ID mapping - fallback to placeholders if not in env
// Price ID helper function
// Price ID helper function - now fetches from DB-backed config or env fallback
const getPriceIdsFromConfig = async () => {
  const stripeConfig = await prisma.stripeConnectConfig.findUnique({ where: { id: "global" } });
  
  const ids = {
    starter: (stripeConfig as any)?.priceStarter || env.STRIPE_PRICE_STARTER,
    professional: (stripeConfig as any)?.priceProfessional || env.STRIPE_PRICE_PROFESSIONAL,
    enterprise: (stripeConfig as any)?.priceEnterprise || env.STRIPE_PRICE_ENTERPRISE,
    "ai-revenue-infrastructure": (stripeConfig as any)?.priceAiInfra || env.STRIPE_PRICE_AI_INFRA,
    ltd: (stripeConfig as any)?.priceLtd || env.STRIPE_PRICE_LTD,
  };

  logger.info({ 
    hasGlobalConfig: !!stripeConfig,
    starter: ids.starter ? "SET" : "MISSING",
    professional: ids.professional ? "SET" : "MISSING",
    enterprise: ids.enterprise ? "SET" : "MISSING",
    aiInfra: ids["ai-revenue-infrastructure"] ? "SET" : "MISSING",
    ltd: ids.ltd ? "SET" : "MISSING"
  }, "Resolved Price IDs from DB/Env");

  return ids;
};

const CheckoutSchema = z.object({
  tier: z.enum(["starter", "professional", "enterprise", "ai-revenue-infrastructure", "ltd"]),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
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
        ltd: { conversations: settings?.ltdLimit ?? 1000, price: 497, monthly: 20 },
        free: { conversations: 0, price: 0 }
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

      const tenant = await UsageService.getEffectiveUsage(tenantId);

      if (!tenant) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
      let tierInfo = { conversations: 1000, price: 197 };
      if (tenant.subscriptionTier === 'professional') tierInfo = { conversations: settings?.professionalLimit ?? 10000, price: 497 };
      else if (tenant.subscriptionTier === 'enterprise') tierInfo = { conversations: settings?.enterpriseLimit ?? 100000, price: 997 };
      else if (tenant.subscriptionTier === 'ai-revenue-infrastructure') tierInfo = { conversations: settings?.aiInfraLimit ?? 250000, price: 1997 };
      else if (tenant.subscriptionTier === 'ltd') tierInfo = { conversations: settings?.ltdLimit ?? 1000, price: 497 };
      else if (tenant.subscriptionTier === 'free') tierInfo = { conversations: 0, price: 0 };

      const usagePercent = tenant.usageLimit > 0 
        ? Math.min(100, (tenant.usageCount / tenant.usageLimit) * 100)
        : (tenant.usageCount > 0 ? 100 : 0);

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
      const { tenantId } = request.user as any;
      let { email } = request.user as any;
      const { tier, successUrl, cancelUrl } = CheckoutSchema.parse(request.body);

      const stripe = await StripeClient.getPlatformClient(prisma, env);

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      // Fallback: If email is missing from JWT, find it in the DB
      if (!email) {
        const dbUser = await prisma.user.findFirst({
          where: { tenantId, isAdmin: true },
          select: { email: true }
        });
        email = dbUser?.email;
      }

      if (!email) {
        logger.error({ tenantId, tier }, "Cannot create checkout: missing user email");
        return reply.status(400).send({ error: "Your account is missing an email address. Please update your profile." });
      }

      let customerId = tenant.stripeCustomerId;

      // Create Stripe customer if doesn't exist
      if (!customerId) {
        try {
          logger.info({ tenantId, email }, "Creating new Stripe customer");
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
          logger.info({ tenantId, customerId }, "Stripe customer associated with tenant");
        } catch (err: any) {
          logger.error({ 
            err: err.message, 
            type: err.type,
            code: err.code,
            tenantId, 
            email 
          }, "Failed to create Stripe customer");
          return reply.status(500).send({ 
            error: "Stripe customer creation failed",
            details: process.env.NODE_ENV === "development" ? err.message : undefined
          });
        }
      }

      const priceIds = await getPriceIdsFromConfig();
      const priceId = (priceIds as any)[tier];

      logger.info({ tier, priceId, customerId }, "Initiating checkout session");

      if (!priceId || priceId.includes("placeholder")) {
        logger.error({ tier, priceId }, "Invalid price ID configuration");
        return reply.status(400).send({ 
          error: `Price ID not configured for tier: ${tier}. Please contact support or update Stripe settings.` 
        });
      }

      try {
        const session = await stripe.createCheckoutSession({
          customerId: customerId!,
          priceId,
          successUrl: successUrl || `${env.WEB_URL}/billing?success=true`,
          cancelUrl: cancelUrl || `${env.WEB_URL}/billing?canceled=true`,
          metadata: { tenantId, tier },
          mode: tier === 'ltd' ? 'payment' : 'subscription',
          description: tier === 'ltd' ? "Lifetime deal for AI engine. A $20/month charge for token costs begins next month." : undefined,
          customText: tier === 'ltd' ? "By paying $497 now, you agree to a recurring $20/month fee for token costs starting next month." : undefined,
        });

        return {
          ok: true,
          url: session.url,
          sessionId: session.id,
        };
      } catch (err: any) {
        logger.error({ 
          err: err.message, 
          type: err.type,
          code: err.code,
          tenantId, 
          tier 
        }, "Failed to create checkout session");
        return reply.status(500).send({ 
          error: "Checkout session creation failed",
          details: process.env.NODE_ENV === "development" ? err.message : undefined
        });
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

      if (!tenant) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      // If they are on a paid tier but no sub ID (e.g. legacy or manual), just reset them
      if (!tenant.stripeSubscriptionId) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            subscriptionStatus: "canceled",
            subscriptionTier: "free",
            usageLimit: 100
          }
        });
        return { ok: true, message: "Subscription reset to free tier" };
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

  // Purchase a conversation package (one-time credit top-up)
  fastify.post(
    "/billing/purchase-package",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const { tenantId } = request.user as any;
      let { email } = request.user as any;
      const { packageId } = request.body as { packageId: string };

      if (!packageId) {
        return reply.status(400).send({ error: "packageId is required" });
      }

      const pkg = await prisma.conversationPackage.findUnique({ where: { id: packageId } });
      if (!pkg || !pkg.active) {
        return reply.status(404).send({ error: "Package not found or inactive" });
      }

      const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
      if (!tenant) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      if (!email) {
        const dbUser = await prisma.user.findFirst({
          where: { tenantId, isAdmin: true },
          select: { email: true },
        });
        email = dbUser?.email;
      }

      const stripe = await StripeClient.getPlatformClient(prisma, env);

      let customerId = tenant.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.createCustomer({ email, name: tenant.name, metadata: { tenantId } });
        customerId = customer.id;
        await prisma.tenant.update({ where: { id: tenantId }, data: { stripeCustomerId: customerId } });
      }

      try {
        // Use raw Stripe API to support dynamic price_data (price not pre-created in Stripe)
        const priceInCents = Math.round(pkg.price * 100);
        const params = new URLSearchParams({
          customer: customerId!,
          mode: "payment",
          success_url: `${env.WEB_URL}/billing?package_success=true`,
          cancel_url: `${env.WEB_URL}/billing?canceled=true`,
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][unit_amount]": String(priceInCents),
          "line_items[0][price_data][product_data][name]": pkg.name,
          "line_items[0][price_data][product_data][description]": `${pkg.credits.toLocaleString()} conversation credits (rolls over monthly)`,
          "line_items[0][quantity]": "1",
          "metadata[tenantId]": tenantId,
          "metadata[type]": "package",
          "metadata[packageId]": pkg.id,
          "metadata[credits]": String(pkg.credits),
        });

        const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.STRIPE_API_KEY}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!stripeRes.ok) {
          const errBody = await stripeRes.text();
          logger.error({ tenantId, packageId, errBody }, "Stripe session creation failed for package");
          return reply.status(500).send({ error: "Checkout session creation failed" });
        }

        const session = await stripeRes.json() as any;
        return { ok: true, url: session.url, sessionId: session.id };
      } catch (err: any) {
        logger.error({ err: err.message, tenantId, packageId }, "Failed to create package checkout session");
        return reply.status(500).send({
          error: "Checkout session creation failed",
          details: process.env.NODE_ENV === "development" ? err.message : undefined,
        });
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
      const stripe = await StripeClient.getPlatformClient(prisma, env);

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
  
  // Sync subscription status with Stripe
  fastify.post(
    "/billing/sync",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const { tenantId } = request.user as any;
      const stripe = await StripeClient.getPlatformClient(prisma, env);

      const tenant = await prisma.tenant.findUnique({
        where: { id: tenantId },
      });

      if (!tenant || !tenant.stripeCustomerId) {
        return reply.status(400).send({ error: "No billing account to sync" });
      }

      try {
        // 1. Check for active or trialing subscriptions
        // Sort by created descending to get the newest first
        const allSubscriptions = await (stripe as any).stripe.subscriptions.list({
          customer: tenant.stripeCustomerId,
          status: "all",
          limit: 20
        });

        // Use a more intelligent selector: 
        // - Priority 1: Non-LTD active/trialing subscriptions
        // - Priority 2: LTD active/trialing subscriptions
        // - Priority 3: Most recent successful session (for one-time payments)
        
        const activeSubs = allSubscriptions.data
          .filter((s: any) => s.status === "active" || s.status === "trialing")
          .sort((a: any, b: any) => b.created - a.created);

        // Filter for subscriptions that specifically have a tier in metadata
        const validTiers = activeSubs.filter((s: any) => s.metadata?.tier);
        
        // Find the "best" one: prefer non-ltd if both exist (unlikely but safe)
        const bestSub = validTiers.find((s: any) => s.metadata.tier !== 'ltd') || validTiers[0];

        if (bestSub) {
          const tier = bestSub.metadata.tier || (bestSub as any).plan?.metadata?.tier;
          
          if (tier) {
            logger.info({ tenantId, tier, subId: bestSub.id }, "Sync: Found active subscription, updating tier");
            await UsageService.updateSubscriptionTier(tenantId, tier, bestSub.id, true);
            
            // Try to process commission if missed
            const admin = await prisma.user.findFirst({ where: { tenantId, isAdmin: true } });
            if (admin) {
              await referralManager.processCommission(admin.id, (bestSub as any).plan?.amount / 100 || 0, bestSub.id);
            }
            
            return { ok: true, message: `Synced ${tenant.name}: Updated to ${tier}`, tier };
          }
        }

        // 2. Fallback: Check for recent successful checkout sessions for ANY tier
        const sessions = await stripe.listCheckoutSessions(tenant.stripeCustomerId);
        const successfulSession = sessions
          .filter(s => s.payment_status === 'paid' && s.status === 'complete' && s.metadata?.tier)
          .sort((a: any, b: any) => b.created - a.created)[0];

        if (successfulSession) {
          const tier = successfulSession.metadata!.tier as string;
          logger.info({ tenantId, tier, sessionId: successfulSession.id }, "Sync: Found successful checkout session, updating tier");
          await UsageService.updateSubscriptionTier(tenantId, tier, undefined, true);
          
          // Try to process commission if missed
          const admin = await prisma.user.findFirst({ where: { tenantId, isAdmin: true } });
          if (admin) {
            await referralManager.processCommission(admin.id, successfulSession.amount_total! / 100, successfulSession.id);
          }
          
          return { ok: true, message: `Synced ${tenant.name}: Updated to ${tier} from recent payment`, tier };
        }

        return { ok: true, message: `Sync completed for ${tenant.name}: Current tier is ${tenant.subscriptionTier}`, tier: tenant.subscriptionTier };
      } catch (err: any) {
        logger.error({ err: err.message, tenantId }, "Failed to sync billing state");
        return reply.status(500).send({ error: "Sync failed", details: err.message });
      }
    }
  );
}

export default billingRoutes;
