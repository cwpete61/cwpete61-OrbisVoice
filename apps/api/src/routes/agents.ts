import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { AuthPayload, ApiResponse } from "../types";
import { requireNotBlocked } from "../middleware/auth";

const CreateAgentSchema = z.object({
  name: z.string().min(1),
  systemPrompt: z.string().min(1),
  voiceModel: z.string().optional(),
});

const UpdateAgentSchema = CreateAgentSchema.partial();

export async function agentRoutes(fastify: FastifyInstance) {
  // List agents for tenant
  fastify.get("/agents", { onRequest: [requireNotBlocked] }, async (request: FastifyRequest, reply) => {
    try {
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;
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
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const body = CreateAgentSchema.parse(request.body);
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

        const tenant = await prisma.tenant.findUnique({
          where: { id: tenantId },
          select: {
            subscriptionStatus: true,
            usageCount: true,
            usageLimit: true,
            creditBalance: true,
          },
        }) as { subscriptionStatus: string; usageCount: number; usageLimit: number; creditBalance: number } | null;

        if (!tenant) {
          return reply.code(404).send({ ok: false, message: "Tenant not found" });
        }

        const hasActivePlan = tenant.subscriptionStatus === "active" && tenant.usageCount < tenant.usageLimit;
        const hasCredits = tenant.creditBalance > 0;

        if (!hasActivePlan && !hasCredits) {
          return reply.code(403).send({
            ok: false,
            message: "Insufficient credits or inactive plan. Please purchase a plan or conversation credits to create agents.",
          } as ApiResponse);
        }

        const agent = await prisma.agent.create({
          data: {
            tenantId,
            name: body.name,
            systemPrompt: body.systemPrompt,
            voiceId: body.voiceModel || "default",
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
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

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
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const body = UpdateAgentSchema.parse(request.body);
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

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
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

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
