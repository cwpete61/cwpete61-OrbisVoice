import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { AuthPayload, ApiResponse } from "../types";
import { requireNotBlocked } from "../middleware/auth";
import { resolveAdminScopedTenantId } from "../services/admin-scope";

const CreateAgentSchema = z.object({
  name: z.string().min(1),
  systemPrompt: z.string().optional().nullable(),
  voiceModel: z.string().optional().nullable(),
  type: z.enum(["WIDGET", "INBOUND_TWILIO", "OUTBOUND_TWILIO"]).optional().nullable(),
  voiceGender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  autoStart: z.boolean().optional(),
  widgetIsVisible: z.boolean().optional(),
  widgetPosition: z.string().optional(),
  widgetPrimaryColor: z.string().optional(),
  widgetDefaultOpen: z.boolean().optional(),
});

const UpdateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  systemPrompt: z.string().optional().nullable(),
  voiceModel: z.string().optional().nullable(),
  type: z.enum(["WIDGET", "INBOUND_TWILIO", "OUTBOUND_TWILIO"]).optional().nullable(),
  voiceGender: z.enum(["MALE", "FEMALE"]).optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  autoStart: z.boolean().optional(),
  isActive: z.boolean().optional(),
  widgetIsVisible: z.boolean().optional(),
  widgetPosition: z.string().optional(),
  widgetPrimaryColor: z.string().optional(),
  widgetDefaultOpen: z.boolean().optional(),
});

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
            creator: { select: { username: true } }
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
            tenantId: effectiveTenantId,
            userId,
            name: body.name,
            systemPrompt: body.systemPrompt || "",
            voiceId: body.voiceModel || "default",
            type: (body.type as any) || "WIDGET",
            voiceGender: body.voiceGender as any,
            avatarUrl: body.avatarUrl,
            autoStart: body.autoStart !== undefined ? body.autoStart : true,
            isActive: true,
            widgetIsVisible: body.widgetIsVisible ?? true,
            widgetPosition: body.widgetPosition || "bottom-right",
            widgetPrimaryColor: body.widgetPrimaryColor || "#14b8a6",
            widgetDefaultOpen: body.widgetDefaultOpen ?? false,
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
      try {
        const { id } = request.params as { id: string };
        const body = UpdateAgentSchema.parse(request.body);
        const tenantId = (request as unknown as { user: AuthPayload }).user.tenantId;
        const effectiveTenantId = await resolveAdminScopedTenantId(tenantId);

        // Explicitly build update data to avoid passing undefined properties that Prisma might reject
        const updateData: any = {};
        if (body.name !== undefined) updateData.name = body.name;
        if (body.systemPrompt !== undefined) updateData.systemPrompt = body.systemPrompt || "";
        if (body.voiceModel !== undefined) updateData.voiceId = body.voiceModel || "aoede";
        if (body.type !== undefined) updateData.type = body.type || "WIDGET";
        if (body.voiceGender !== undefined) updateData.voiceGender = body.voiceGender;
        if (body.avatarUrl !== undefined) updateData.avatarUrl = body.avatarUrl;
        if (body.autoStart !== undefined) updateData.autoStart = body.autoStart;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;
        if (body.widgetIsVisible !== undefined) updateData.widgetIsVisible = body.widgetIsVisible;
        if (body.widgetPosition !== undefined) updateData.widgetPosition = body.widgetPosition;
        if (body.widgetPrimaryColor !== undefined) updateData.widgetPrimaryColor = body.widgetPrimaryColor;
        if (body.widgetDefaultOpen !== undefined) updateData.widgetDefaultOpen = body.widgetDefaultOpen;

        logger.debug({ agentId: id, updateData, tenantId: effectiveTenantId }, "Updating agent");

        const agent = await prisma.agent.updateMany({
          where: { id, tenantId: effectiveTenantId },
          data: updateData,
        });

        if (agent.count === 0) {
          logger.warn({ agentId: id, tenantId: effectiveTenantId }, "Agent not found for update");
          return reply.code(404).send({
            ok: false,
            message: "Agent not found or unauthorized",
          } as ApiResponse);
        }

        const updated = await prisma.agent.findUnique({ where: { id } });
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
        
        // Log detailed error for server-side debugging
        logger.error({ 
          err: {
            message: err.message,
            stack: err.stack,
            code: err.code,
            meta: err.meta
          }, 
          agentId: request.params ? (request.params as any).id : "unknown" 
        }, "Failed to update agent");

        // Return error details to help understand terminal failures
        return reply.code(500).send({
          ok: false,
          message: `Internal server error: ${err.message}`,
          details: process.env.NODE_ENV === "development" ? err.stack : undefined
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
