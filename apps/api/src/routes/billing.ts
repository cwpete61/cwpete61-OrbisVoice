import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { prisma } from "../db";
import { StripeClient } from "../integrations/stripe";
import { env } from "../env";
import { logger } from "../logger";
import { UsageService, resolveUsageLimitForTier } from "../services/usage-service";
import { referralManager } from "../services/referral";
import { resolveAdminScopedTenantId } from "../services/admin-scope";

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

  logger.info(
    {
      hasGlobalConfig: !!stripeConfig,
      starter: ids.starter ? "SET" : "MISSING",
      professional: ids.professional ? "SET" : "MISSING",
      enterprise: ids.enterprise ? "SET" : "MISSING",
      aiInfra: ids["ai-revenue-infrastructure"] ? "SET" : "MISSING",
      ltd: ids.ltd ? "SET" : "MISSING",
    },
    "Resolved Price IDs from DB/Env"
  );

  return ids;
};

const CheckoutSchema = z.object({
  tier: z.enum(["starter", "professional", "enterprise", "ai-revenue-infrastructure", "ltd"]),
  successUrl: z.string().optional(),
  cancelUrl: z.string().optional(),
});

// Helper: Resolve effective tenant ID with admin scoping
async function resolveEffectiveTenantId(request: FastifyRequest) {
  const { tenantId } = request.user as any;
  return resolveAdminScopedTenantId(tenantId);
}

// Helper: Resolve user email for Stripe
async function resolveUserEmail(request: FastifyRequest, scopedTenantId: string) {
  let { email } = request.user as any;
  if (!email) {
    const dbUser = await prisma.user.findFirst({
      where: { tenantId: scopedTenantId, isAdmin: true },
      select: { email: true },
    });
    email = dbUser?.email;
  }
  return email;
}

// Helper: Get tier configuration
async function getTierConfig() {
  const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
  return {
    starter: { conversations: settings?.starterLimit ?? 1000, price: 197 },
    professional: { conversations: settings?.professionalLimit ?? 10000, price: 497 },
    enterprise: { conversations: settings?.enterpriseLimit ?? 100000, price: 997 },
    "ai-revenue-infrastructure": { conversations: settings?.aiInfraLimit ?? 250000, price: 1997 },
    ltd: { conversations: settings?.ltdLimit ?? 1000, price: 497, monthly: 20 },
    free: { conversations: 0, price: 0 },
  };
}

// Helper: Get or Create Stripe Customer
async function getOrCreateStripeCustomer(stripe: any, tenant: any, email: string) {
  if (tenant.stripeCustomerId) return tenant.stripeCustomerId;

  logger.info({ tenantId: tenant.id, email }, "Creating new Stripe customer");
  const customer = await stripe.createCustomer({
    email,
    name: tenant.name,
    metadata: { tenantId: tenant.id },
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}


async function billingRoutes(fastify: FastifyInstance) {
  // Get available tiers
  fastify.get("/billing/tiers", async (request, reply) => {
    const tiers = await getTierConfig();
    return { ok: true, data: tiers };
  });

  // Verify if session can start (used by Voice Gateway)
  fastify.get(
    "/billing/can-start-session",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const scopedTenantId = await resolveEffectiveTenantId(request);
      const check = await UsageService.canStartSession(scopedTenantId);
      
      if (!check.allowed) {
        return reply.code(403).send({ ok: false, message: check.reason });
      }

      return { ok: true, message: "Session allowed" };
    }
  );

  // Get current subscription status
  fastify.get(
    "/billing/subscription",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const scopedTenantId = await resolveEffectiveTenantId(request);
      const tenant = await UsageService.getEffectiveUsage(scopedTenantId);

      if (!tenant) {
        return reply.status(404).send({ error: "Tenant not found" });
      }

      const tiers = await getTierConfig();
      const tierInfo = (tiers as any)[tenant.subscriptionTier] || tiers.starter;

      const usagePercent =
        tenant.usageLimit > 0
          ? Math.min(100, (tenant.usageCount / tenant.usageLimit) * 100)
          : tenant.usageCount > 0 ? 100 : 0;

      return {
        ok: true,
        data: { ...tenant, usagePercent, tierInfo },
      };
    }
  );

  // Create Checkout Session
  fastify.post(
    "/billing/checkout",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const scopedTenantId = await resolveEffectiveTenantId(request);
      const email = await resolveUserEmail(request, scopedTenantId);
      const { tier, successUrl, cancelUrl } = CheckoutSchema.parse(request.body);

      const tenant = await prisma.tenant.findUnique({ where: { id: scopedTenantId } });
      if (!tenant) return reply.status(404).send({ error: "Tenant not found" });

      if (!email) {
        logger.error({ tenantId: scopedTenantId, tier }, "Cannot create checkout: missing user email");
        return reply.status(400).send({ error: "Your account is missing an email address. Please update your profile." });
      }

      const stripe = await StripeClient.getPlatformClient(prisma, env);
      const customerId = await getOrCreateStripeCustomer(stripe, tenant, email);

      const priceIds = await getPriceIdsFromConfig();
      const priceId = (priceIds as any)[tier];

      logger.info({ tier, priceId, customerId }, "Initiating checkout session");

      if (!priceId || priceId.includes("placeholder")) {
        logger.error({ tier, priceId }, "Invalid price ID configuration");
        return reply.status(400).send({ error: `Price ID not configured for tier: ${tier}.` });
      }

      try {
        const session = await stripe.createCheckoutSession({
          customerId,
          priceId,
          successUrl: successUrl || `${env.WEB_URL}/billing?success=true`,
          cancelUrl: cancelUrl || `${env.WEB_URL}/billing?canceled=true`,
          metadata: { tenantId: scopedTenantId, tier },
          mode: tier === "ltd" ? "payment" : "subscription",
          description: tier === "ltd" ? "Lifetime deal for AI engine. Monthly token fee applies." : undefined,
        });

        return { ok: true, url: session.url, sessionId: session.id };
      } catch (err: any) {
        logger.error({ err: err.message, tenantId: scopedTenantId, tier }, "Failed to create checkout session");
        return reply.status(500).send({ error: "Checkout session creation failed" });
      }
    }
  );

  // Cancel Subscription
  fastify.delete(
    "/billing/subscription",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const scopedTenantId = await resolveEffectiveTenantId(request);
      const tenant = await prisma.tenant.findUnique({ where: { id: scopedTenantId } });

      if (!tenant) return reply.status(404).send({ error: "Tenant not found" });

      // If they are on a paid tier but no sub ID (e.g. legacy or manual), just reset them
      if (!tenant.stripeSubscriptionId) {
        const freeUsageLimit = resolveUsageLimitForTier();
        await prisma.tenant.update({
          where: { id: scopedTenantId },
          data: {
            subscriptionStatus: "canceled",
            subscriptionTier: "free",
            usageLimit: freeUsageLimit,
          },
        });
        return { ok: true, message: "Subscription reset to free tier" };
      }

      try {
        // In this custom fetch-based StripeClient, we should add cancelSubscription
        // For now, we'll manually fetch
        const response = await fetch(
          `https://api.stripe.com/v1/subscriptions/${tenant.stripeSubscriptionId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${env.STRIPE_API_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(await response.text());
        }

        await prisma.tenant.update({
          where: { id: scopedTenantId },
          data: {
            subscriptionStatus: "canceling",
            // Note: Actual transition to 'free' should happen via webhook when period ends
          },
        });

        return { ok: true, message: "Subscription canceled successfully" };
      } catch (err) {
        logger.error({ err, tenantId: scopedTenantId }, "Failed to cancel subscription");
        return reply.status(500).send({ error: "Subscription cancellation failed" });
      }
    }
  );

  // Purchase a conversation package (one-time credit top-up)
  fastify.post(
    "/billing/purchase-package",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const scopedTenantId = await resolveEffectiveTenantId(request);
      const email = await resolveUserEmail(request, scopedTenantId);
      const { packageId } = request.body as { packageId: string };

      if (!packageId) return reply.status(400).send({ error: "packageId is required" });

      const pkg = await prisma.conversationPackage.findUnique({ where: { id: packageId } });
      if (!pkg || !pkg.active) return reply.status(404).send({ error: "Package not found" });

      const tenant = await prisma.tenant.findUnique({ where: { id: scopedTenantId } });
      if (!tenant) return reply.status(404).send({ error: "Tenant not found" });

      const stripe = await StripeClient.getPlatformClient(prisma, env);
      const customerId = await getOrCreateStripeCustomer(stripe, tenant, email || "");

      try {
        const priceInCents = Math.round(pkg.price * 100);
        const params = new URLSearchParams({
          customer: customerId,
          mode: "payment",
          success_url: `${env.WEB_URL}/billing?package_success=true`,
          cancel_url: `${env.WEB_URL}/billing?canceled=true`,
          "line_items[0][price_data][currency]": "usd",
          "line_items[0][price_data][unit_amount]": String(priceInCents),
          "line_items[0][price_data][product_data][name]": pkg.name,
          "line_items[0][price_data][product_data][description]": `${pkg.credits.toLocaleString()} credits`,
          "line_items[0][quantity]": "1",
          "metadata[tenantId]": scopedTenantId,
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

        if (!stripeRes.ok) throw new Error(await stripeRes.text());

        const session = (await stripeRes.json()) as any;
        return { ok: true, url: session.url, sessionId: session.id };
      } catch (err: any) {
        logger.error({ err: err.message, tenantId: scopedTenantId, packageId }, "Failed to create package checkout session");
        return reply.status(500).send({ error: "Checkout session creation failed" });
      }
    }
  );

  // Create Portal Session
  fastify.post(
    "/billing/portal",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const scopedTenantId = await resolveEffectiveTenantId(request);
      const { returnUrl } = request.body as { returnUrl: string };
      const stripe = await StripeClient.getPlatformClient(prisma, env);

      if (!returnUrl) return reply.status(400).send({ error: "returnUrl is required" });

      const tenant = await prisma.tenant.findUnique({ where: { id: scopedTenantId } });
      if (!tenant || !tenant.stripeCustomerId) {
        return reply.status(400).send({ error: "Active billing account not found" });
      }

      try {
        const session = await stripe.createPortalSession({ customerId: tenant.stripeCustomerId, returnUrl });
        return { ok: true, url: session.url };
      } catch (err) {
        logger.error({ err, tenantId: scopedTenantId }, "Failed to create portal session");
        return reply.status(500).send({ error: "Portal session creation failed" });
      }
    }
  );

  // Sync subscription status with Stripe
  fastify.post(
    "/billing/sync",
    { preHandler: [authenticate] },
    async (request: FastifyRequest, reply) => {
      const scopedTenantId = await resolveEffectiveTenantId(request);
      const stripe = await StripeClient.getPlatformClient(prisma, env);
      const tenant = await prisma.tenant.findUnique({ where: { id: scopedTenantId } });

      if (!tenant || !tenant.stripeCustomerId) {
        return reply.status(400).send({ error: "No billing account to sync" });
      }

      try {
        if (!stripe.stripe) {
          throw new Error("Stripe instance not properly initialized");
        }

        // 1. Check for active or trialing subscriptions
        // Sort by created descending to get the newest first
        const allSubscriptions = await stripe.stripe.subscriptions.list({
          customer: tenant.stripeCustomerId,
          status: "all",
          limit: 20,
        });

        logger.info(
          { tenantId: scopedTenantId, count: allSubscriptions.data.length },
          "Sync: Found subscriptions for customer"
        );

        const activeSubs = allSubscriptions.data
          .filter((s: any) => s.status === "active" || s.status === "trialing")
          .sort((a: any, b: any) => b.created - a.created);

        // Filter for subscriptions that specifically have a tier in metadata (either on sub or plan)
        const activeSubWithTier = activeSubs.find((s: any) => {
          const tier = s.metadata?.tier || s.plan?.metadata?.tier;
          return !!tier;
        });

        if (activeSubWithTier) {
          const sub = activeSubWithTier as any;
          const tier = (sub.metadata?.tier || sub.plan?.metadata?.tier) as string;

          if (tier) {
            logger.info(
              { tenantId: scopedTenantId, tier, subId: sub.id },
              "Sync: Found active subscription, updating tier"
            );
            await UsageService.updateSubscriptionTier(scopedTenantId, tier, sub.id, true);

            // Try to process commission if missed
            const admin = await prisma.user.findFirst({
              where: { tenantId: scopedTenantId, isAdmin: true },
            });
            if (admin) {
              const amount = sub.plan?.amount || 0;
              await referralManager.processCommission(admin.id, amount / 100, sub.id);
            }

            return { ok: true, message: `Synced ${tenant.name}: Updated to ${tier}`, tier };
          }
        }

        // 2. Fallback: Check for recent successful checkout sessions for ANY tier
        const sessions = await stripe.listCheckoutSessions(tenant.stripeCustomerId);
        const successfulSession = sessions
          .filter((s) => s.payment_status === "paid" && s.status === "complete" && s.metadata?.tier)
          .sort((a: any, b: any) => b.created - a.created)[0];

        if (successfulSession) {
          const tier = successfulSession.metadata!.tier as string;
          logger.info(
            { tenantId: scopedTenantId, tier, sessionId: successfulSession.id },
            "Sync: Found successful checkout session, updating tier"
          );
          await UsageService.updateSubscriptionTier(scopedTenantId, tier, undefined, true);

          // Try to process commission if missed
          const admin = await prisma.user.findFirst({
            where: { tenantId: scopedTenantId, isAdmin: true },
          });
          if (admin) {
            await referralManager.processCommission(
              admin.id,
              successfulSession.amount_total! / 100,
              successfulSession.id
            );
          }

          return {
            ok: true,
            message: `Synced ${tenant.name}: Updated to ${tier} from recent payment`,
            tier,
          };
        }

        return {
          ok: true,
          message: `Sync completed for ${tenant.name}: Current tier is ${tenant.subscriptionTier}`,
          tier: tenant.subscriptionTier,
        };
      } catch (err: any) {
        logger.error(
          { err: err.message, tenantId: scopedTenantId },
          "Failed to sync billing state"
        );
        return reply.status(500).send({ error: "Sync failed", details: err.message });
      }
    }
  );
}

export default billingRoutes;
