import { FastifyInstance, FastifyRequest } from "fastify";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { AuthPayload, ApiResponse } from "../types";
import { requireNotBlocked } from "../middleware/auth";
import { resolveAdminScopedTenantId } from "../services/admin-scope";
import { CreateAgentSchema, UpdateAgentSchema, mapAgentData } from "../services/agent-logic";

export async function agentRoutes(fastify: FastifyInstance) {
  // List agents from admin-scoped tenant for all accounts
  fastify.get(
    "/agents",
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;
        const effectiveTenantId = await resolveAdminScopedTenantId(tenantId);

        const agents = await prisma.agent.findMany({
          where: { tenantId: effectiveTenantId },
          include: {
            tenant: { select: { name: true } },
            creator: { select: { username: true } },
          },
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
    }
  );

  // Create agent - No credit limitations for drafts
  fastify.post<{ Body: z.infer<typeof CreateAgentSchema> }>(
    "/agents",
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const body = CreateAgentSchema.parse(request.body);
        const user = (request as unknown as { user: AuthPayload }).user;
        const tenantId = user.tenantId;
        const userId = user.userId;
        const effectiveTenantId = await resolveAdminScopedTenantId(tenantId);

        // Create the agent directly without checking usage counts or limits
        // This allows all users to save drafts freely. Live usage is guarded by the Voice Gateway.
        const agent = await prisma.agent.create({
          data: {
            ...mapAgentData(body),
            name: body.name!, // Guaranteed by Zod validation for CreateAgentSchema
            systemPrompt: body.systemPrompt ?? "",
            tenantId: effectiveTenantId,
            userId,
            isActive: true,
          },
        });

        logger.info({ agentId: agent.id, tenantId: effectiveTenantId }, "Agent created");
        return reply.code(201).send({
          ok: true,
          message: "Agent created",
          data: agent,
        } as ApiResponse);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          logger.warn({ body: request.body, errors: err.errors }, "Agent create validation failed");
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
        const effectiveTenantId = await resolveAdminScopedTenantId(tenantId);

        const agent = await prisma.agent.findFirst({
          where: { id, tenantId: effectiveTenantId },
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
      // Corrected scope for production stability
      const { id } = request.params as { id: string };
      const body = UpdateAgentSchema.parse(request.body);
      const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;

      let updateData: Record<string, any> | undefined;
      try {
        const effectiveTenantId = await resolveAdminScopedTenantId(tenantId);
        updateData = mapAgentData(body);

        logger.info({ agentId: id, updateData, body }, "Updating agent - DEBUG");

        const existingAgent = await prisma.agent.findFirst({
          where: { id, tenantId: effectiveTenantId },
        });
        if (!existingAgent) {
          logger.warn({ agentId: id, tenantId: effectiveTenantId }, "Agent not found for update");
          return reply.code(404).send({
            ok: false,
            message: "Agent not found or unauthorized",
          } as ApiResponse);
        }

        const updated = await prisma.agent.update({
          where: { id },
          data: updateData!,
        });

        logger.info({ agentId: id, tenantId: effectiveTenantId }, "Agent updated successfully");
        return reply.code(200).send({
          ok: true,
          message: "Agent updated",
          data: updated,
        } as ApiResponse);
      } catch (err: any) {
        if (err instanceof z.ZodError) {
          logger.warn({ body: request.body, errors: err.errors }, "Agent update validation failed");
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }

        if ((err as any).code === "P2002") {
          const metaTarget = (err.meta as any)?.target;
          const targets = Array.isArray(metaTarget) ? metaTarget : metaTarget ? [metaTarget] : [];
          if (targets.includes("phoneNumber")) {
            logger.warn(
              { agentId: id, phoneNumber: updateData?.phoneNumber },
              "Phone number conflict during agent update"
            );
            return reply.code(409).send({
              ok: false,
              message: "Phone number already in use",
            } as ApiResponse);
          }
        }

        // Log detailed error for server-side debugging
        logger.error(
          {
            err: {
              message: err.message,
              stack: err.stack,
              code: err.code,
              meta: err.meta,
            },
            agentId: id,
          },
          "Failed to update agent"
        );

        // Return error details to help understand terminal failures
        return reply.code(500).send({
          ok: false,
          message: `Internal server error: ${err.message}`,
          details: process.env.NODE_ENV === "development" ? err.stack : undefined,
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
        const effectiveTenantId = await resolveAdminScopedTenantId(tenantId);

        const result = await prisma.agent.deleteMany({
          where: { id, tenantId: effectiveTenantId },
        });
        if (result.count === 0) {
          return reply.code(404).send({
            ok: false,
            message: "Agent not found",
          } as ApiResponse);
        }

        logger.info({ agentId: id, tenantId: effectiveTenantId }, "Agent deleted");
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
