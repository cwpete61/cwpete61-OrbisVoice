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
}
