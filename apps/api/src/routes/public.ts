import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";

export async function publicRoutes(fastify: FastifyInstance) {
  // Public agent info for the widget
  fastify.get(
    "/public/agents/:id",
    {
      config: {
        cors: {
          origin: true,
          credentials: false,
        },
      },
    },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const agent = await prisma.agent.findUnique({
          where: { id },
          select: {
            id: true,
            name: true,
            type: true,
            avatarUrl: true,
            autoStart: true,
            voiceId: true,
            widgetIsVisible: true,
            widgetPosition: true,
            widgetPrimaryColor: true,
            widgetDefaultOpen: true,
            systemPrompt: true,
            voiceGender: true,
          },
        });

        if (!agent) {
          return reply.code(404).send({ ok: false, message: "Agent not found" });
        }

        return reply.code(200).send({
          ok: true,
          data: agent,
        });
      } catch (err) {
        logger.error(err, "Failed to get public agent info");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );
  // Gateway config fetching (Internal proxy for the Voice Gateway)
  fastify.get(
    "/public/gateway/config/:agentId",
    async (request, reply) => {
      try {
        const { agentId } = request.params as { agentId: string };
        const secret = request.headers["x-gateway-secret"];
        
        // Basic security check (use env var for gateway secret)
        const expectedSecret = process.env.GATEWAY_SECRET || "orbis-voice-gateway-secret-2025";
        if (secret !== expectedSecret) {
          return reply.code(401).send({ ok: false, message: "Unauthorized gateway access" });
        }

        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          select: { tenantId: true }
        });

        if (!agent) {
          return reply.code(404).send({ ok: false, message: "Agent not found" });
        }

        const config = await prisma.tenantGoogleConfig.findUnique({
          where: { tenantId: agent.tenantId }
        });

        return reply.code(200).send({
          ok: true,
          data: {
            geminiApiKey: config?.geminiApiKey || process.env.GEMINI_API_KEY
          }
        });
      } catch (err) {
        logger.error(err, "Failed to get gateway config");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );
  // Usage check for gateway (Internal proxy)
  fastify.get(
    "/public/gateway/usage-check/:agentId",
    async (request, reply) => {
      try {
        const { agentId } = request.params as { agentId: string };
        const secret = request.headers["x-gateway-secret"];

        // Basic security check
        const expectedSecret = process.env.GATEWAY_SECRET || "orbis-voice-gateway-secret-2025";
        if (secret !== expectedSecret) {
          return reply.code(401).send({ ok: false, message: "Unauthorized gateway access" });
        }

        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          select: { tenantId: true }
        });

        if (!agent) {
          return reply.code(404).send({ ok: false, message: "Agent not found" });
        }

        const tenant = await prisma.tenant.findUnique({
          where: { id: agent.tenantId },
          select: { usageLimit: true, usageCount: true, subscriptionStatus: true }
        });

        if (!tenant) {
          return reply.code(404).send({ ok: false, message: "Tenant not found" });
        }

        // Simple credit/usage check
        const isAllowed = 
          tenant.subscriptionStatus === "active" || 
          tenant.subscriptionStatus === "trialing" ||
          tenant.usageCount < tenant.usageLimit;

        if (!isAllowed) {
          return reply.code(403).send({ 
            ok: false, 
            message: "This agent has reached its usage limit. Please upgrade or add credits." 
          });
        }

        return reply.code(200).send({
          ok: true,
          message: "Usage allowed"
        });
      } catch (err) {
        logger.error(err, "Failed to check gateway usage");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );

  // Archive transcript for gateway (Internal proxy)
  fastify.post(
    "/public/gateway/transcripts",
    async (request, reply) => {
      try {
        const secret = request.headers["x-gateway-secret"];
        const expectedSecret = process.env.GATEWAY_SECRET || "orbis-voice-gateway-secret-2025";
        
        if (secret !== expectedSecret) {
          return reply.code(401).send({ ok: false, message: "Unauthorized gateway access" });
        }

        const { agentId, content, duration, inputTokens, outputTokens, toolsCalled, userId } = request.body as any;

        const agent = await prisma.agent.findUnique({
          where: { id: agentId },
          select: { tenantId: true }
        });

        if (!agent) {
          return reply.code(404).send({ ok: false, message: "Agent not found" });
        }

        const { pricingService } = await import("../services/pricing");
        const { UsageService } = await import("../services/usage-service");

        const sessionFinance = await pricingService.calculateSessionFinance({
          inputTokens: inputTokens || 0,
          outputTokens: outputTokens || 0,
          toolsCalled: toolsCalled || 0,
          durationSeconds: duration || 0,
        });

        const transcript = await prisma.transcript.create({
          data: {
            agentId,
            tenantId: agent.tenantId,
            userId: userId || null,
            content,
            duration: duration || 0,
            inputTokens: inputTokens || 0,
            outputTokens: outputTokens || 0,
            toolsCalled: toolsCalled || 0,
            estimatedCost: sessionFinance.cost,
            revenue: sessionFinance.revenue,
            margin: sessionFinance.margin,
            isLowMargin: sessionFinance.isLowMargin,
          },
        });

        // Update Tenant Usage/Credits
        await UsageService.finalizeSessionUsage(agent.tenantId, sessionFinance.revenue);

        return reply.code(201).send({
          ok: true,
          message: "Transcript archived",
          data: transcript,
        });
      } catch (err) {
        logger.error(err, "Failed to archive gateway transcript");
        return reply.code(500).send({ ok: false, message: "Internal server error" });
      }
    }
  );
}
