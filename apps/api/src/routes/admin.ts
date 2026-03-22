import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { requireAdmin, requireSystemAdmin } from "../middleware/auth";
import { sessionManager } from "../services/session";
import { pickWorkspacePrimaryUser } from "../services/workspace-management";

const toNumberOrNull = (value: unknown): number | null => {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toBooleanOrNull = (value: unknown): boolean | null => {
  if (value === undefined) return null;
  return Boolean(value);
};

async function ensureGlobalSettingsRow() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "PlatformSettings"
    ADD COLUMN IF NOT EXISTS "freeTierLimit" INTEGER NOT NULL DEFAULT 100,
    ADD COLUMN IF NOT EXISTS "freeToStarterEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "freeToProfessionalEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "freeToEnterpriseEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "freeToLtdEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "freeToAiInfraEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS "freeToolGetCartEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "freeToolAddToCartEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "freeToolClearCartEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "freeToolListProductsEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "freeToolSearchProductsEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "freeToolRemoveFromCartEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "freeToolCreateCheckoutSessionEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "freeToolSendSmsEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "freeToolMakeCallEnabled" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN IF NOT EXISTS "costPerMinute" DOUBLE PRECISION NOT NULL DEFAULT 0.013
  `);

  const existing = await prisma.platformSettings.findFirst();
  if (!existing) {
    await prisma.platformSettings.create({
      data: {
        id: "global",
        lowCommission: 10,
        medCommission: 20,
        highCommission: 30,
        commissionDurationMonths: 0,
        defaultCommissionLevel: "LOW",
        payoutMinimum: 100,
        refundHoldDays: 14,
        payoutCycleDelayMonths: 1,
        transactionFeePercent: 3.4,
        starterLimit: 1000,
        professionalLimit: 10000,
        enterpriseLimit: 100000,
        ltdLimit: 1000,
        aiInfraLimit: 250000,
        emailVerificationEnabled: false,
        globalEmailEnabled: true,
        freeTierLimit: 100,
        freeToStarterEnabled: false,
        freeToProfessionalEnabled: false,
        freeToEnterpriseEnabled: false,
        freeToLtdEnabled: false,
        freeToAiInfraEnabled: false,
        freeToolGetCartEnabled: true,
        freeToolAddToCartEnabled: true,
        freeToolClearCartEnabled: true,
        freeToolListProductsEnabled: true,
        freeToolSearchProductsEnabled: true,
        freeToolRemoveFromCartEnabled: true,
        freeToolCreateCheckoutSessionEnabled: true,
        freeToolSendSmsEnabled: true,
        freeToolMakeCallEnabled: true,
        costPerMinute: 0.013,
      } as any,
    });
  }
}

async function readGlobalSettingsRow() {
  const rows = await prisma.$queryRaw<any[]>`
    SELECT
      "id",
      "lowCommission",
      "medCommission",
      "highCommission",
      "payoutMinimum",
      "refundHoldDays",
      "payoutCycleDelayMonths",
      "transactionFeePercent",
      "freeTierLimit",
      "freeToStarterEnabled",
      "freeToProfessionalEnabled",
      "freeToEnterpriseEnabled",
      "freeToLtdEnabled",
      "freeToAiInfraEnabled",
      "freeToolGetCartEnabled",
      "freeToolAddToCartEnabled",
      "freeToolClearCartEnabled",
      "freeToolListProductsEnabled",
      "freeToolSearchProductsEnabled",
      "freeToolRemoveFromCartEnabled",
      "freeToolCreateCheckoutSessionEnabled",
      "freeToolSendSmsEnabled",
      "freeToolMakeCallEnabled",
      "starterLimit",
      "professionalLimit",
      "enterpriseLimit",
      "aiInfraLimit",
      "ltdLimit",
      "emailVerificationEnabled",
      "globalEmailEnabled",
      "costPerMinute",
      "updatedAt"
    FROM "PlatformSettings"
    WHERE "id" = 'global'
    LIMIT 1
  `;
  return rows[0] || null;
}

export async function adminRoutes(fastify: FastifyInstance) {
  // All routes in this group require admin privileges
  fastify.addHook("onRequest", requireAdmin);

  /**
   * GET /admin/stats
   * Aggregated platform metrics
   */
  fastify.get("/admin/stats", async (request, reply) => {
    try {
      // Check health of dependencies
      let dbHealth = "operational";
      let redisHealth = "operational";

      try {
        await prisma.$queryRaw`SELECT 1`;
      } catch (err) {
        dbHealth = "outage";
        logger.error({ err }, "Database health check failed");
      }

      try {
        await sessionManager.ping();
      } catch (err) {
        redisHealth = "outage";
        logger.error({ err }, "Redis health check failed");
      }

      const [
        totalTenants,
        totalUsers,
        totalAgents,
        totalTranscripts,
        totalLeads,
        bookedLeads,
        avgDurationRes,
        subscriptionStats,
        recentActivities,
        totalCostRes,
      ] = await Promise.all([
        prisma.tenant.count(),
        prisma.user.count(),
        prisma.agent.count(),
        prisma.transcript.count(),
        prisma.lead.count(),
        prisma.lead.count({ where: { isBooked: true } }),
        prisma.transcript.aggregate({
          _avg: { duration: true },
        }),
        prisma.tenant.groupBy({
          by: ["subscriptionTier"],
          _count: true,
        }),
        prisma.toolExecutionAudit
          .findMany({
            take: 5,
            orderBy: { createdAt: "desc" },
            include: { agent: { select: { name: true, tenantId: true } } },
          })
          .catch(() => []),
        prisma.transcript.aggregate({
          _sum: { estimatedCost: true },
        }),
      ]);

      const avgDuration = Math.round(avgDurationRes._avg.duration || 0);
      const totalPlatformCost = totalCostRes._sum.estimatedCost || 0;
      const conversionRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0;

      // Calculate MRR (estimated based on current pricing)
      const tiers: Record<string, number> = {
        free: 0,
        ltd: 20,
        starter: 197,
        professional: 497,
        enterprise: 997,
        "ai-revenue-infrastructure": 1997,
      };

      let estimatedMRR = 0;
      subscriptionStats.forEach((stat: { subscriptionTier: string | null; _count: number }) => {
        const tier = stat.subscriptionTier || "free";
        const price = tiers[tier] || 0;
        estimatedMRR += price * stat._count;
      });

      return reply.code(200).send({
        ok: true,
        message: "Admin stats retrieved",
        data: {
          totalTenants,
          totalUsers,
          totalAgents,
          totalTranscripts,
          totalLeads,
          avgDuration,
          conversionRate,
          estimatedMRR,
          totalPlatformCost,
          subscriptionBreakdown: subscriptionStats,
          recentActivities,
          systemHealth: {
            api: "operational",
            database: dbHealth,
            redis: redisHealth,
          },
          lastUpdated: new Date().toISOString(),
        },
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get admin stats");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });

  /**
   * GET /admin/tenants
   * List all tenants with summary info
   */
  fastify.get("/admin/tenants", async (request, reply) => {
    try {
      const tenants = await prisma.tenant.findMany({
        include: {
          _count: {
            select: { agents: true, users: true },
          },
          users: {
            select: { email: true, name: true, isAdmin: true, role: true },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const enrichedTenants = tenants.map((tenant) => {
        const primaryUser = pickWorkspacePrimaryUser(tenant.users);

        return {
          ...tenant,
          users: primaryUser ? [{ email: primaryUser.email, name: primaryUser.name }] : [],
        };
      });

      return reply.code(200).send({
        ok: true,
        message: "Tenants retrieved",
        data: enrichedTenants,
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get tenants");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });

  /**
   * GET /admin/settings
   * Get platform-wide settings
   */
  fastify.get("/admin/settings", { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      await ensureGlobalSettingsRow();
      const settings = await readGlobalSettingsRow();

      return reply.code(200).send({
        ok: true,
        message: "Settings retrieved",
        data: settings,
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get platform settings");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });

  /**
   * PATCH /admin/settings
   * Update platform-wide settings
   */
  fastify.patch("/admin/settings", { onRequest: [requireAdmin] }, async (request, reply) => {
    try {
      const body = request.body as any;

      await ensureGlobalSettingsRow();

      await prisma.$executeRaw`
        UPDATE "PlatformSettings"
        SET
          "lowCommission" = COALESCE(${toNumberOrNull(body.lowCommission)}, "lowCommission"),
          "medCommission" = COALESCE(${toNumberOrNull(body.medCommission)}, "medCommission"),
          "highCommission" = COALESCE(${toNumberOrNull(body.highCommission)}, "highCommission"),
          "payoutMinimum" = COALESCE(${toNumberOrNull(body.payoutMinimum)}, "payoutMinimum"),
          "refundHoldDays" = COALESCE(${toNumberOrNull(body.refundHoldDays)}, "refundHoldDays"),
          "payoutCycleDelayMonths" = COALESCE(${toNumberOrNull(body.payoutCycleDelayMonths)}, "payoutCycleDelayMonths"),
          "transactionFeePercent" = COALESCE(${toNumberOrNull(body.transactionFeePercent)}, "transactionFeePercent"),
          "freeTierLimit" = COALESCE(${toNumberOrNull(body.freeTierLimit)}, "freeTierLimit"),
          "freeToStarterEnabled" = COALESCE(${toBooleanOrNull(body.freeToStarterEnabled)}, "freeToStarterEnabled"),
          "freeToProfessionalEnabled" = COALESCE(${toBooleanOrNull(body.freeToProfessionalEnabled)}, "freeToProfessionalEnabled"),
          "freeToEnterpriseEnabled" = COALESCE(${toBooleanOrNull(body.freeToEnterpriseEnabled)}, "freeToEnterpriseEnabled"),
          "freeToLtdEnabled" = COALESCE(${toBooleanOrNull(body.freeToLtdEnabled)}, "freeToLtdEnabled"),
          "freeToAiInfraEnabled" = COALESCE(${toBooleanOrNull(body.freeToAiInfraEnabled)}, "freeToAiInfraEnabled"),
          "freeToolGetCartEnabled" = COALESCE(${toBooleanOrNull(body.freeToolGetCartEnabled)}, "freeToolGetCartEnabled"),
          "freeToolAddToCartEnabled" = COALESCE(${toBooleanOrNull(body.freeToolAddToCartEnabled)}, "freeToolAddToCartEnabled"),
          "freeToolClearCartEnabled" = COALESCE(${toBooleanOrNull(body.freeToolClearCartEnabled)}, "freeToolClearCartEnabled"),
          "freeToolListProductsEnabled" = COALESCE(${toBooleanOrNull(body.freeToolListProductsEnabled)}, "freeToolListProductsEnabled"),
          "freeToolSearchProductsEnabled" = COALESCE(${toBooleanOrNull(body.freeToolSearchProductsEnabled)}, "freeToolSearchProductsEnabled"),
          "freeToolRemoveFromCartEnabled" = COALESCE(${toBooleanOrNull(body.freeToolRemoveFromCartEnabled)}, "freeToolRemoveFromCartEnabled"),
          "freeToolCreateCheckoutSessionEnabled" = COALESCE(${toBooleanOrNull(body.freeToolCreateCheckoutSessionEnabled)}, "freeToolCreateCheckoutSessionEnabled"),
          "freeToolSendSmsEnabled" = COALESCE(${toBooleanOrNull(body.freeToolSendSmsEnabled)}, "freeToolSendSmsEnabled"),
          "freeToolMakeCallEnabled" = COALESCE(${toBooleanOrNull(body.freeToolMakeCallEnabled)}, "freeToolMakeCallEnabled"),
          "starterLimit" = COALESCE(${toNumberOrNull(body.starterLimit)}, "starterLimit"),
          "professionalLimit" = COALESCE(${toNumberOrNull(body.professionalLimit)}, "professionalLimit"),
          "enterpriseLimit" = COALESCE(${toNumberOrNull(body.enterpriseLimit)}, "enterpriseLimit"),
          "aiInfraLimit" = COALESCE(${toNumberOrNull(body.aiInfraLimit)}, "aiInfraLimit"),
          "ltdLimit" = COALESCE(${toNumberOrNull(body.ltdLimit)}, "ltdLimit"),
          "costPerMinute" = COALESCE(${toNumberOrNull(body.costPerMinute)}, "costPerMinute"),
          "emailVerificationEnabled" = COALESCE(${toBooleanOrNull(body.emailVerificationEnabled)}, "emailVerificationEnabled"),
          "globalEmailEnabled" = COALESCE(${toBooleanOrNull(body.globalEmailEnabled)}, "globalEmailEnabled")
        WHERE "id" = 'global'
      `;

      const settings = await readGlobalSettingsRow();

      return reply.code(200).send({
        ok: true,
        message: "Settings updated",
        data: settings,
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to update platform settings");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });

  /**
   * GET /admin/audit-logs
   * Global audit logs for tool executions
   */
  fastify.get("/admin/audit-logs", async (request, reply) => {
    try {
      const { limit = "100", skip = "0", status, toolName } = request.query as any;

      const logs = await prisma.toolExecutionAudit.findMany({
        where: {
          ...(status && { status }),
          ...(toolName && { toolName }),
        },
        take: parseInt(limit),
        skip: parseInt(skip),
        orderBy: { createdAt: "desc" },
        include: {
          agent: {
            include: { tenant: { select: { name: true } } },
          },
        },
      });

      const total = await prisma.toolExecutionAudit.count({
        where: {
          ...(status && { status }),
          ...(toolName && { toolName }),
        },
      });

      return reply.code(200).send({
        ok: true,
        message: "Audit logs retrieved",
        data: { logs, total },
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get global audit logs");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });

  /**
   * POST /admin/impersonate
   * Generate a login token for a specific user
   */
  fastify.post(
    "/admin/impersonate",
    { onRequest: [requireSystemAdmin] },
    async (request, reply) => {
      try {
        const { userId } = request.body as { userId: string };
        if (!userId) {
          return reply.code(400).send({ ok: false, message: "UserId is required" });
        }

        const targetUser = await prisma.user.findUnique({
          where: { id: userId },
          include: { tenant: true },
        });

        if (!targetUser) {
          return reply.code(404).send({ ok: false, message: "User not found" });
        }

        // Generate JWT for the target user (7 days like normal login)
        const token = (fastify as any).jwt.sign(
          { userId: targetUser.id, tenantId: targetUser.tenantId, email: targetUser.email },
          { expiresIn: "7d" }
        );

        logger.info(
          { adminId: (request as any).user.userId, targetUserId: userId },
          "Admin impersonation token generated"
        );

        return reply.code(200).send({
          ok: true,
          message: "Impersonation token generated",
          data: { token },
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to generate impersonation token");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );

  /**
   * POST /admin/billing/sync-all
   * Force sync all tenants with Stripe
   */
  fastify.post("/admin/billing/sync-all", async (request, reply) => {
    try {
      const tenants = await prisma.tenant.findMany({
        where: { stripeCustomerId: { not: null } },
        select: { id: true, name: true, stripeCustomerId: true },
      });

      logger.info({ count: tenants.length }, "Starting global billing sync");

      const results = [];
      const { StripeClient } = await import("../integrations/stripe");
      const { env } = await import("../env");
      const { UsageService } = await import("../services/usage-service");
      const { referralManager } = await import("../services/referral");

      const stripe = await StripeClient.getPlatformClient(prisma, env);

      for (const tenant of tenants) {
        try {
          // Check for active or trialing subscriptions
          if (!stripe.stripe) continue;

          const allSubscriptions = await stripe.stripe.subscriptions.list({
            customer: tenant.stripeCustomerId!,
            status: "active",
            limit: 3,
          });

          if (allSubscriptions.data.length > 0) {
            const sub = allSubscriptions.data[0] as any;
            const tier = sub.metadata?.tier || sub.plan?.metadata?.tier;
            if (tier) {
              await UsageService.updateSubscriptionTier(tenant.id, tier, sub.id, true);
              results.push({ name: tenant.name, status: "success", tier });
              continue;
            }
          }

          // Fallback to checkout sessions
          const sessions = await stripe.listCheckoutSessions(tenant.stripeCustomerId!);
          const lastPaid = sessions.find(
            (s) => s.payment_status === "paid" && s.status === "complete" && s.metadata?.tier
          );

          if (lastPaid) {
            const tier = lastPaid.metadata!.tier as string;
            await UsageService.updateSubscriptionTier(tenant.id, tier, undefined, true);
            results.push({ name: tenant.name, status: "success", tier, type: "one-time" });
          } else {
            results.push({ name: tenant.name, status: "no_data" });
          }
        } catch (err: any) {
          logger.error(
            { tenantId: tenant.id, err: err.message },
            "Error syncing individual tenant"
          );
          results.push({ name: tenant.name, status: "error", message: err.message });
        }
      }

      return reply.send({
        ok: true,
        message: `Sync completed for ${tenants.length} workspaces`,
        data: results,
      });
    } catch (err) {
      logger.error(err, "Failed to sync all billing");
      return reply.code(500).send({ ok: false, message: "Internal server error" });
    }
  });
}

/**
 * Subscriber Management Routes
 */
export async function subscriberAdminRoutes(fastify: FastifyInstance) {
  fastify.addHook("onRequest", requireAdmin);

  // GET /admin/subscribers/:id/overview
  fastify.get<{ Params: { id: string } }>("/subscribers/:id/overview", async (request, reply) => {
    try {
      const { id } = request.params;
      const tenant = await prisma.tenant.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isAdmin: true,
              createdAt: true,
              affiliate: { select: { payoutHeld: true, id: true } },
            },
          },
          agents: {
            select: {
              id: true,
              name: true,
              voiceId: true,
              createdAt: true,
              _count: { select: { transcripts: true, leads: true } },
            },
          },
        },
      });
      if (!tenant)
        return reply.code(404).send({ ok: false, message: "Subscriber not found" } as ApiResponse);

      return reply.code(200).send({ ok: true, data: tenant } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get subscriber overview");
      return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
    }
  });

  // GET /admin/subscribers/:id/settings
  fastify.get<{ Params: { id: string } }>("/subscribers/:id/settings", async (request, reply) => {
    try {
      const { id } = request.params;
      const [twilio, google] = await Promise.all([
        prisma.tenantTwilioConfig.findUnique({ where: { tenantId: id } }),
        prisma.tenantGoogleConfig.findUnique({ where: { tenantId: id } }),
      ]);

      return reply.send({
        ok: true,
        data: {
          twilio: twilio
            ? {
                accountSid: twilio.accountSid,
                authToken: "********",
                phoneNumber: twilio.phoneNumber,
                hasConfig: true,
              }
            : null,
          google: google
            ? {
                clientId: google.clientId,
                clientSecret: "********",
                geminiApiKey: google.geminiApiKey ? "********" : null,
                hasConfig: true,
              }
            : null,
        },
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get subscriber settings");
      return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
    }
  });

  // POST /admin/subscribers/:id/settings
  fastify.post<{ Params: { id: string }; Body: any }>(
    "/subscribers/:id/settings",
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { type, config } = request.body as { type: "twilio" | "google"; config: any };

        if (type === "twilio") {
          const { accountSid, authToken, phoneNumber } = config;
          // If authToken is "********", don't update it if we already have a config
          const existing = await prisma.tenantTwilioConfig.findUnique({ where: { tenantId: id } });

          await prisma.tenantTwilioConfig.upsert({
            where: { tenantId: id },
            create: { tenantId: id, accountSid, authToken, phoneNumber },
            update: {
              accountSid,
              phoneNumber,
              ...(authToken !== "********" && { authToken }),
            },
          });
        } else if (type === "google") {
          const { clientId, clientSecret, geminiApiKey } = config;
          await prisma.tenantGoogleConfig.upsert({
            where: { tenantId: id },
            create: { tenantId: id, clientId, clientSecret, geminiApiKey },
            update: {
              clientId,
              ...(clientSecret !== "********" && { clientSecret }),
              ...(geminiApiKey !== "********" && { geminiApiKey }),
            },
          });
        }

        return reply.send({ ok: true, message: "Settings updated" } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to update subscriber settings");
        return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
      }
    }
  );

  // DELETE /admin/subscribers/:id/settings/:type
  fastify.delete<{ Params: { id: string; type: string } }>(
    "/subscribers/:id/settings/:type",
    async (request, reply) => {
      try {
        const { id, type } = request.params;
        if (type === "twilio") {
          await prisma.tenantTwilioConfig.delete({ where: { tenantId: id } });
        } else if (type === "google") {
          await prisma.tenantGoogleConfig.delete({ where: { tenantId: id } });
        }
        return reply.send({ ok: true, message: "Settings removed" } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to delete subscriber settings");
        return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
      }
    }
  );

  // GET /admin/subscribers/:id/api-keys
  fastify.get<{ Params: { id: string } }>("/subscribers/:id/api-keys", async (request, reply) => {
    try {
      const { id } = request.params;
      const keys = await prisma.apiKey.findMany({
        where: { tenantId: id },
        orderBy: { createdAt: "desc" },
      });
      return reply.send({ ok: true, data: keys } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get subscriber API keys");
      return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
    }
  });

  // POST /admin/subscribers/:id/api-keys
  fastify.post<{ Params: { id: string }; Body: { name: string } }>(
    "/subscribers/:id/api-keys",
    async (request, reply) => {
      try {
        const { id } = request.params;
        const { name } = request.body;

        const { randomBytes } = await import("node:crypto");
        const key = `ov_${randomBytes(24).toString("hex")}`;

        const apiKey = await prisma.apiKey.create({
          data: {
            tenantId: id,
            name: name || "Admin Generated Key",
            key,
          },
        });

        return reply.code(201).send({ ok: true, data: apiKey } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to create subscriber API key");
        return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
      }
    }
  );

  // DELETE /admin/subscribers/:id/api-keys/:keyId
  fastify.delete<{ Params: { id: string; keyId: string } }>(
    "/subscribers/:id/api-keys/:keyId",
    async (request, reply) => {
      try {
        const { id, keyId } = request.params;
        await prisma.apiKey.delete({
          where: { id: keyId, tenantId: id },
        });
        return reply.send({ ok: true, message: "API key revoked" } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to revoke subscriber API key");
        return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
      }
    }
  );
  // POST /admin/subscribers/:id/billing-portal
  fastify.post<{ Params: { id: string }; Body: { returnUrl?: string } }>(
    "/subscribers/:id/billing-portal",
    async (request, reply) => {
      try {
        const { id } = request.params;
        const body = (request.body || {}) as { returnUrl?: string };
        const returnUrl = body.returnUrl;

        const tenant = await prisma.tenant.findUnique({
          where: { id },
        });

        if (!tenant || !tenant.stripeCustomerId) {
          return reply.code(400).send({
            ok: false,
            message: "No active billing account found for this subscriber",
          } as ApiResponse);
        }

        const { StripeClient } = await import("../integrations/stripe");
        const { env } = await import("../env");
        const stripe = new StripeClient({ apiKey: env.STRIPE_API_KEY || "" });

        const session = await stripe.createPortalSession({
          customerId: tenant.stripeCustomerId,
          returnUrl: returnUrl || `${env.WEB_URL}/admin/tenants`,
        });

        return reply.send({ ok: true, url: session.url } as any);
      } catch (err) {
        logger.error(err, "Failed to create subscriber billing portal session");
        return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
      }
    }
  );
}
