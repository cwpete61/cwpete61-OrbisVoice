import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";

export async function publicRoutes(fastify: FastifyInstance) {
  // Public agent info for the widget
  fastify.get("/public/agents/:id", async (request, reply) => {
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
  });
}
