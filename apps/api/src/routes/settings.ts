import { FastifyInstance } from "fastify";
import axios from "axios";
import { z } from "zod";
import { prisma } from "../db";
import { authenticate, requireAdmin } from "../middleware/auth";
import { ApiResponse } from "../types";
import { logger } from "../logger";

const GoogleConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  geminiApiKey: z.string().optional(),
});

const ALL_AGENT_TOOLS = [
  "get_cart",
  "add_to_cart",
  "clear_cart",
  "list_products",
  "search_products",
  "remove_from_cart",
  "create_checkout_session",
  "send_sms",
  "make_call",
] as const;

const TOOL_TIERS = ["free", "starter", "professional", "enterprise", "ltd", "aiInfra"] as const;
type ToolTier = (typeof TOOL_TIERS)[number];
type ToolName = (typeof ALL_AGENT_TOOLS)[number];

const AGENT_TOOL_FIELD_MAP: Record<(typeof ALL_AGENT_TOOLS)[number], string> = {
  get_cart: "freeToolGetCartEnabled",
  add_to_cart: "freeToolAddToCartEnabled",
  clear_cart: "freeToolClearCartEnabled",
  list_products: "freeToolListProductsEnabled",
  search_products: "freeToolSearchProductsEnabled",
  remove_from_cart: "freeToolRemoveFromCartEnabled",
  create_checkout_session: "freeToolCreateCheckoutSessionEnabled",
  send_sms: "freeToolSendSmsEnabled",
  make_call: "freeToolMakeCallEnabled",
};

const TierToolBooleansSchema = z.object({
  get_cart: z.boolean(),
  add_to_cart: z.boolean(),
  clear_cart: z.boolean(),
  list_products: z.boolean(),
  search_products: z.boolean(),
  remove_from_cart: z.boolean(),
  create_checkout_session: z.boolean(),
  send_sms: z.boolean(),
  make_call: z.boolean(),
});

const TieredAgentToolConfigSchema = z.object({
  tiers: z.object({
    free: TierToolBooleansSchema,
    starter: TierToolBooleansSchema,
    professional: TierToolBooleansSchema,
    enterprise: TierToolBooleansSchema,
    ltd: TierToolBooleansSchema,
    aiInfra: TierToolBooleansSchema,
  }),
});

const LegacyAgentToolConfigSchema = z.object({
  freeToolGetCartEnabled: z.boolean().optional(),
  freeToolAddToCartEnabled: z.boolean().optional(),
  freeToolClearCartEnabled: z.boolean().optional(),
  freeToolListProductsEnabled: z.boolean().optional(),
  freeToolSearchProductsEnabled: z.boolean().optional(),
  freeToolRemoveFromCartEnabled: z.boolean().optional(),
  freeToolCreateCheckoutSessionEnabled: z.boolean().optional(),
  freeToolSendSmsEnabled: z.boolean().optional(),
  freeToolMakeCallEnabled: z.boolean().optional(),
});

type TierToolMap = Record<ToolTier, Record<ToolName, boolean>>;

function createDefaultTierToolMap(defaultValue = true): TierToolMap {
  const tierMap = Object.fromEntries(
    TOOL_TIERS.map((tier) => [
      tier,
      Object.fromEntries(ALL_AGENT_TOOLS.map((tool) => [tool, defaultValue])) as Record<
        ToolName,
        boolean
      >,
    ])
  ) as TierToolMap;
  return tierMap;
}

function normalizeTier(rawTier: string | null | undefined): ToolTier {
  if (!rawTier) return "free";
  const tier = rawTier.toLowerCase();
  if (tier === "starter") return "starter";
  if (tier === "professional") return "professional";
  if (tier === "enterprise") return "enterprise";
  if (tier === "ltd") return "ltd";
  if (tier === "ai-revenue-infrastructure" || tier === "ai_infra" || tier === "aiinfra") {
    return "aiInfra";
  }
  if (tier === "free") return "free";
  return "free";
}

function parseTierToolMap(enabledTools: string[] | undefined): TierToolMap {
  const stored = enabledTools || ALL_AGENT_TOOLS.slice();
  if (stored.length === 0) {
    return createDefaultTierToolMap(false);
  }

  const hasTierEntries = stored.some((entry) => entry.includes(":"));
  const tierMap = createDefaultTierToolMap(false);

  if (!hasTierEntries) {
    const legacyAllowed = new Set(
      stored.filter((tool) => ALL_AGENT_TOOLS.includes(tool as ToolName))
    );
    TOOL_TIERS.forEach((tier) => {
      ALL_AGENT_TOOLS.forEach((tool) => {
        tierMap[tier][tool] = legacyAllowed.has(tool);
      });
    });
    return tierMap;
  }

  for (const entry of stored) {
    if (!entry.includes(":")) {
      if (ALL_AGENT_TOOLS.includes(entry as ToolName)) {
        TOOL_TIERS.forEach((tier) => {
          tierMap[tier][entry as ToolName] = true;
        });
      }
      continue;
    }

    const [rawTier, rawTool] = entry.split(":");
    if (!rawTier || !rawTool) continue;
    if (!ALL_AGENT_TOOLS.includes(rawTool as ToolName)) continue;
    const tier = normalizeTier(rawTier);
    tierMap[tier][rawTool as ToolName] = true;
  }

  return tierMap;
}

function encodeTierToolMap(tierMap: TierToolMap): string[] {
  const encoded: string[] = [];
  TOOL_TIERS.forEach((tier) => {
    ALL_AGENT_TOOLS.forEach((tool) => {
      if (tierMap[tier][tool]) {
        encoded.push(`${tier}:${tool}`);
      }
    });
  });
  return encoded;
}

function buildTierToolMapFromBody(body: unknown): TierToolMap {
  if (body && typeof body === "object" && "tiers" in (body as Record<string, unknown>)) {
    const tieredParsed = TieredAgentToolConfigSchema.parse(body);
    const next = createDefaultTierToolMap(false);
    TOOL_TIERS.forEach((tier) => {
      const fromBody = (tieredParsed.tiers as any)[tier];
      ALL_AGENT_TOOLS.forEach((tool) => {
        next[tier][tool] = fromBody[tool] === true;
      });
    });
    return next;
  }

  const legacyParsed = LegacyAgentToolConfigSchema.parse(body || {});
  const freeTier = {
    get_cart: legacyParsed.freeToolGetCartEnabled ?? true,
    add_to_cart: legacyParsed.freeToolAddToCartEnabled ?? true,
    clear_cart: legacyParsed.freeToolClearCartEnabled ?? true,
    list_products: legacyParsed.freeToolListProductsEnabled ?? true,
    search_products: legacyParsed.freeToolSearchProductsEnabled ?? true,
    remove_from_cart: legacyParsed.freeToolRemoveFromCartEnabled ?? true,
    create_checkout_session: legacyParsed.freeToolCreateCheckoutSessionEnabled ?? true,
    send_sms: legacyParsed.freeToolSendSmsEnabled ?? true,
    make_call: legacyParsed.freeToolMakeCallEnabled ?? true,
  };

  const next = createDefaultTierToolMap(true);
  TOOL_TIERS.forEach((tier) => {
    ALL_AGENT_TOOLS.forEach((tool) => {
      next[tier][tool] = (freeTier as any)[tool] === true;
    });
  });
  return next;
}

function serializeTieredToolConfig(enabledTools: string[] | undefined) {
  const tierMap = parseTierToolMap(enabledTools);
  const tiers = Object.fromEntries(
    TOOL_TIERS.map((tier) => [
      tier,
      Object.fromEntries(ALL_AGENT_TOOLS.map((tool) => [tool, tierMap[tier][tool]])),
    ])
  ) as Record<ToolTier, Record<ToolName, boolean>>;

  const freeEnabledTools = ALL_AGENT_TOOLS.filter((tool) => tiers.free[tool]);
  const legacyFields = Object.fromEntries(
    ALL_AGENT_TOOLS.map((tool) => [AGENT_TOOL_FIELD_MAP[tool], tiers.free[tool]])
  );

  return {
    enabledTools: freeEnabledTools,
    tiers,
    ...legacyFields,
  };
}

function serializeToolConfigForTier(enabledTools: string[] | undefined, tier: ToolTier) {
  const tierMap = parseTierToolMap(enabledTools);
  const scopedTools = ALL_AGENT_TOOLS.filter((tool) => tierMap[tier][tool]);
  const legacyFields = Object.fromEntries(
    ALL_AGENT_TOOLS.map((tool) => [AGENT_TOOL_FIELD_MAP[tool], tierMap[tier][tool]])
  );

  return {
    tier,
    enabledTools: scopedTools,
    ...legacyFields,
  };
}

export async function settingsRoutes(fastify: FastifyInstance) {
  // Get tool config for current tenant (used by Voice Gateway and Dashboard)
  fastify.get(
    "/settings/agent-tool-config",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const tenantId = (request as any).user?.tenantId;
        if (!tenantId) {
          return reply.code(401).send({ ok: false, message: "Unauthorized" });
        }

        const [config, tenant] = await Promise.all([
          prisma.agentToolConfig.findUnique({
            where: { tenantId },
          }),
          prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { subscriptionTier: true },
          }),
        ]);

        const normalizedTier = normalizeTier(tenant?.subscriptionTier);

        reply.header("Cache-Control", "no-store");

        return reply.send({
          ok: true,
          data: serializeToolConfigForTier(config?.enabledTools, normalizedTier),
        } as ApiResponse);
      } catch (err) {
        logger.error({ err }, "Failed to fetch agent tool config");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );

  // Admin GET for tool config
  fastify.get(
    "/settings/agent-tool-config/admin",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const tenantId = (request as any).user?.tenantId;
        if (!tenantId) {
          return reply.code(401).send({ ok: false, message: "Unauthorized" });
        }

        const config = await prisma.agentToolConfig.findUnique({
          where: { tenantId },
        });

        reply.header("Cache-Control", "no-store");

        return reply.send({
          ok: true,
          data: serializeTieredToolConfig(config?.enabledTools),
        } as ApiResponse);
      } catch (err) {
        console.error("GET /settings/agent-tool-config/admin failed:", err);
        logger.error({ err }, "Failed to fetch admin agent tool config");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );

  // Admin PUT for tool config
  fastify.put<{ Body: unknown }>(
    "/settings/agent-tool-config/admin",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const tenantId = (request as any).user?.tenantId;
        if (!tenantId) {
          return reply.code(401).send({ ok: false, message: "Unauthorized" });
        }

        const tierMap = buildTierToolMapFromBody(request.body || {});
        const enabledTools = encodeTierToolMap(tierMap);

        const config = await prisma.agentToolConfig.upsert({
          where: { tenantId },
          create: {
            tenantId,
            enabledTools,
          },
          update: {
            enabledTools,
          },
        });

        return reply.send({
          ok: true,
          message: "Agent tool config saved",
          data: serializeTieredToolConfig(config.enabledTools),
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ ok: false, message: "Validation error", data: err.errors });
        }
        console.error("PUT /settings/agent-tool-config/admin failed:", err);
        logger.error({ err }, "Failed to update admin agent tool config");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );

  // Get tenant's Google config
  fastify.get(
    "/settings/google-config",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const tenantId = (request as any).user?.tenantId;
        if (!tenantId) {
          return reply.code(401).send({ ok: false, message: "Unauthorized" });
        }

        const config = await prisma.tenantGoogleConfig.findUnique({
          where: { tenantId },
        });

        if (!config) {
          return reply.send({ ok: true, data: null } as ApiResponse);
        }

        const includeSecrets = (request.query as any).include_secrets === "true";

        if (includeSecrets) {
          return reply.send({
            ok: true,
            data: {
              clientId: config.clientId,
              clientSecret: config.clientSecret,
              geminiApiKey: config.geminiApiKey,
              hasConfig: true,
            },
          } as ApiResponse);
        }

        // Return masked config
        return reply.send({
          ok: true,
          data: {
            clientId: config.clientId ? "********" + config.clientId.slice(-4) : null,
            clientSecret: config.clientSecret ? "********" : null,
            geminiApiKey: config.geminiApiKey ? "********" + config.geminiApiKey.slice(-4) : null,
            hasConfig: true,
          },
        } as ApiResponse);
      } catch (err) {
        logger.error({ err }, "Failed to fetch Google config");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );

  // Update tenant's Google config
  fastify.post<{ Body: z.infer<typeof GoogleConfigSchema> }>(
    "/settings/google-config",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const tenantId = (request as any).user?.tenantId;
        if (!tenantId) {
          return reply.code(401).send({ ok: false, message: "Unauthorized" });
        }

        const { clientId, clientSecret, geminiApiKey } = GoogleConfigSchema.parse(request.body);

        await prisma.tenantGoogleConfig.upsert({
          where: { tenantId },
          update: {
            clientId,
            clientSecret,
            geminiApiKey,
          },
          create: {
            tenantId,
            clientId,
            clientSecret,
            geminiApiKey,
          },
        });

        logger.info({ tenantId }, "Updated tenant Google config");

        return reply.send({
          ok: true,
          message: "Configuration saved successfully",
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({ ok: false, message: "Validation error", data: err.errors });
        }
        logger.error({ err }, "Failed to update Google config");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );

  // Verify tenant's Gemini API key
  fastify.post<{ Body: { geminiApiKey: string } }>(
    "/settings/gemini-api/test",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const { geminiApiKey } = request.body;
        if (!geminiApiKey) {
          return reply.code(400).send({ ok: false, message: "API Key is required" });
        }

        // Test the key by calling a safe Gemini endpoint (e.g. list models or a simple generateContent)
        try {
          // Use a very simple, fast request
          const testRes = await axios.post(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
            {
              contents: [{ parts: [{ text: "ping" }] }],
              generationConfig: { maxOutputTokens: 1 }
            },
            { timeout: 10000 }
          );

          if (testRes.status === 200) {
            return reply.send({ ok: true, message: "API Key verified successfully" });
          }
        } catch (apiErr: any) {
          const errorMsg = apiErr.response?.data?.error?.message || apiErr.message || "Invalid API Key";
          return reply.code(400).send({ ok: false, message: `Verification failed: ${errorMsg}` });
        }

        return reply.code(400).send({ ok: false, message: "Verification failed" });
      } catch (err) {
        logger.error({ err }, "Failed to test Gemini API key");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );

  // Delete tenant's Google config
  fastify.delete(
    "/settings/google-config",
    { onRequest: [authenticate] },
    async (request, reply) => {
      try {
        const tenantId = (request as any).user?.tenantId;
        if (!tenantId) {
          return reply.code(401).send({ ok: false, message: "Unauthorized" });
        }

        await prisma.tenantGoogleConfig.delete({
          where: { tenantId },
        });

        logger.info({ tenantId }, "Deleted tenant Google config");

        return reply.send({
          ok: true,
          message: "Configuration removed successfully",
        } as ApiResponse);
      } catch (err) {
        if ((err as any).code === "P2025") {
          return reply.code(404).send({ ok: false, message: "Configuration not found" });
        }
        logger.error({ err }, "Failed to delete Google config");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );
}
