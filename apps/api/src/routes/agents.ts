import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { AuthPayload, ApiResponse } from "../types";
import { requireNotBlocked } from "../middleware/auth";

const CreateAgentSchema = z.object({
  name: z.string().min(1),
  systemPrompt: z.string().optional(),
  voiceModel: z.string().optional(),
});

const UpdateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  systemPrompt: z.string().optional(),
  voiceModel: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function agentRoutes(fastify: FastifyInstance) {
  // List agents for tenant (or all for system admin)
  fastify.get("/agents", { onRequest: [requireNotBlocked] }, async (request: FastifyRequest, reply) => {
    try {
      const userId = (request as unknown as { user: AuthPayload }).user.userId;
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

      const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
      const isSystemAdmin = user?.role === "SYSTEM_ADMIN";

      const agents = await prisma.agent.findMany({
        where: isSystemAdmin ? undefined : { tenantId },
        orderBy: { createdAt: "desc" },
      });
      return reply.code(200).send({
        ok: true,
        message: "Agents retrieved",
        data: agents,
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to list agents");
      return reply.code(500).send({
        ok: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  });

  // Create agent - No credit limitations for drafts
  fastify.post<{ Body: z.infer<typeof CreateAgentSchema> }>(
    "/agents",
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const body = CreateAgentSchema.parse(request.body);
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

        // Create the agent directly without checking usage counts or limits
        // This allows all users to save drafts freely. Live usage is guarded by the Voice Gateway.
        const agent = await prisma.agent.create({
          data: {
            tenantId,
            name: body.name,
            systemPrompt: body.systemPrompt || "",
            voiceId: body.voiceModel || "default",
            isActive: true,
          },
        });

        logger.info({ agentId: agent.id, tenantId }, "Agent created");
        return reply.code(201).send({
          ok: true,
          message: "Agent created",
          data: agent,
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }
        logger.error(err, "Failed to create agent");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Get agent by ID
  fastify.get<{ Params: { id: string } }>(
    "/agents/:id",
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = (request as unknown as { user: AuthPayload }).user.userId;
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        const isSystemAdmin = user?.role === "SYSTEM_ADMIN";

        const agent = await prisma.agent.findFirst({
          where: isSystemAdmin ? { id } : { id, tenantId },
        });
        if (!agent) {
          return reply.code(404).send({
            ok: false,
            message: "Agent not found",
          } as ApiResponse);
        }

        return reply.code(200).send({
          ok: true,
          message: "Agent retrieved",
          data: agent,
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to get agent");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Update agent
  fastify.put<{ Params: { id: string }; Body: z.infer<typeof UpdateAgentSchema> }>(
    "/agents/:id",
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = UpdateAgentSchema.parse(request.body);
        const userId = (request as unknown as { user: AuthPayload }).user.userId;
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        const isSystemAdmin = user?.role === "SYSTEM_ADMIN";

        const agent = await prisma.agent.updateMany({
          where: isSystemAdmin ? { id } : { id, tenantId },
          data: {
            ...body,
            isActive: body.isActive !== undefined ? body.isActive : undefined,
          },
        });
        if (agent.count === 0) {
          return reply.code(404).send({
            ok: false,
            message: "Agent not found",
          } as ApiResponse);
        }

        const updated = await prisma.agent.findUnique({ where: { id } });
        logger.info({ agentId: id, tenantId }, "Agent updated");
        return reply.code(200).send({
          ok: true,
          message: "Agent updated",
          data: updated,
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }
        logger.error(err, "Failed to update agent");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Delete agent
  fastify.delete<{ Params: { id: string } }>(
    "/agents/:id",
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const userId = (request as unknown as { user: AuthPayload }).user.userId;
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

        const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        const isSystemAdmin = user?.role === "SYSTEM_ADMIN";

        const result = await prisma.agent.deleteMany({
          where: isSystemAdmin ? { id } : { id, tenantId },
        });
        if (result.count === 0) {
          return reply.code(404).send({
            ok: false,
            message: "Agent not found",
          } as ApiResponse);
        }

        logger.info({ agentId: id, tenantId }, "Agent deleted");
        return reply.code(200).send({
          ok: true,
          message: "Agent deleted",
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to delete agent");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );
}
