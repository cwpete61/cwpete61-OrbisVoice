import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { authenticate } from "../middleware/auth";
import { FastifyRequest } from "fastify";
import { randomBytes } from "crypto";

const CreateApiKeySchema = z.object({
  name: z.string().min(1).max(255),
});

export async function apiKeyRoutes(fastify: FastifyInstance) {
  // List API keys for tenant
  fastify.get("/api-keys", { onRequest: [authenticate] }, async (request: FastifyRequest, reply) => {
    try {
      const tenantId = (request as any).user.tenantId;
      const keys = await prisma.apiKey.findMany({
        where: { tenantId },
        select: {
          id: true,
          name: true,
          createdAt: true,
          expiresAt: true,
          key: false, // Never return full key in list
        },
      });
      return reply.code(200).send({
        ok: true,
        message: "API keys retrieved",
        data: keys,
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to list API keys");
      return reply.code(500).send({
        ok: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  });

  // Create new API key
  fastify.post<{ Body: z.infer<typeof CreateApiKeySchema> }>(
    "/api-keys",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const body = CreateApiKeySchema.parse(request.body);
        const tenantId = (request as any).user.tenantId;

        // Generate unique API key
        const key = `orbis_${randomBytes(32).toString("hex")}`;

        const apiKey = await prisma.apiKey.create({
          data: {
            tenantId,
            name: body.name,
            key,
          },
        });

        logger.info({ apiKeyId: apiKey.id, tenantId }, "API key created");
        return reply.code(201).send({
          ok: true,
          message: "API key created",
          data: {
            id: apiKey.id,
            name: apiKey.name,
            key, // Return full key only on creation
            createdAt: apiKey.createdAt,
          },
        } as ApiResponse);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return reply.code(400).send({
            ok: false,
            message: "Validation error",
            data: err.errors,
          } as ApiResponse);
        }
        logger.error(err, "Failed to create API key");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Revoke API key
  fastify.delete<{ Params: { id: string } }>(
    "/api-keys/:id",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { id } = request.params as { id: string };
        const tenantId = (request as any).user.tenantId;

        const result = await prisma.apiKey.deleteMany({
          where: { id, tenantId },
        });
        if (result.count === 0) {
          return reply.code(404).send({
            ok: false,
            message: "API key not found",
          } as ApiResponse);
        }

        logger.info({ apiKeyId: id, tenantId }, "API key revoked");
        return reply.code(200).send({
          ok: true,
          message: "API key revoked",
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to revoke API key");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );
}
