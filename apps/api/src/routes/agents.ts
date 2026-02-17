import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { authenticate } from "../middleware/auth";
import { FastifyRequest } from "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: { userId: string; tenantId: string; email: string };
  }
}

const CreateAgentSchema = z.object({
  name: z.string().min(1),
  systemPrompt: z.string().min(1),
  voiceModel: z.string().optional(),
});

const UpdateAgentSchema = CreateAgentSchema.partial();

export async function agentRoutes(fastify: FastifyInstance) {
  // List agents for tenant
  fastify.get("/agents", { onRequest: [authenticate] }, async (request: FastifyRequest, reply) => {
    try {
      const tenantId = (request as any).user.tenantId;
      const agents = await prisma.agent.findMany({
        where: { tenantId },
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

  // Create agent
  fastify.post<{ Body: z.infer<typeof CreateAgentSchema> }>(
    "/agents",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const body = CreateAgentSchema.parse(request.body);
        const tenantId = (request as any).user.tenantId;
        const userId = (request as any).user.userId;

        const agent = await prisma.agent.create({
          data: {
            tenantId,
            createdBy: userId,
            name: body.name,
            systemPrompt: body.systemPrompt,
            voiceModel: body.voiceModel || "default",
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
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = (request as any).user.tenantId;

        const agent = await prisma.agent.findFirst({
          where: { id, tenantId },
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
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = UpdateAgentSchema.parse(request.body);
        const tenantId = (request as any).user.tenantId;

        const agent = await prisma.agent.updateMany({
          where: { id, tenantId },
          data: body,
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
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = (request as any).user.tenantId;

        const result = await prisma.agent.deleteMany({
          where: { id, tenantId },
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
