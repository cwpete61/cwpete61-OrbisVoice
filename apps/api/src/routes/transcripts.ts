import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { authenticate } from "../middleware/auth";
import { FastifyRequest } from "fastify";

export async function transcriptRoutes(fastify: FastifyInstance) {
  // Get conversation history for agent
  fastify.get<{ Params: { agentId: string }; Querystring: { limit?: string; offset?: string } }>(
    "/agents/:agentId/transcripts",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { agentId } = request.params as { agentId: string };
        const tenantId = (request as any).user.tenantId;
        const limit = parseInt((request.query as any).limit || "50");
        const offset = parseInt((request.query as any).offset || "0");

        // Verify agent belongs to tenant
        const agent = await prisma.agent.findFirst({
          where: { id: agentId, tenantId },
        });
        if (!agent) {
          return reply.code(404).send({
            ok: false,
            message: "Agent not found",
          } as ApiResponse);
        }

        // Get transcripts
        const transcripts = await prisma.transcript.findMany({
          where: { agentId },
          take: limit,
          skip: offset,
          orderBy: { createdAt: "desc" },
        });

        const total = await prisma.transcript.count({
          where: { agentId },
        });

        return reply.code(200).send({
          ok: true,
          message: "Transcripts retrieved",
          data: {
            transcripts,
            total,
            limit,
            offset,
          },
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to get transcripts");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Get transcript details
  fastify.get<{ Params: { transcriptId: string } }>(
    "/transcripts/:transcriptId",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { transcriptId } = request.params as { transcriptId: string };
        const tenantId = (request as any).user.tenantId;

        // Get transcript with agent details
        const transcript = await prisma.transcript.findFirst({
          where: { id: transcriptId },
          include: {
            agent: {
              select: {
                tenantId: true,
              },
            },
          },
        });

        if (!transcript || transcript.agent.tenantId !== tenantId) {
          return reply.code(404).send({
            ok: false,
            message: "Transcript not found",
          } as ApiResponse);
        }

        return reply.code(200).send({
          ok: true,
          message: "Transcript retrieved",
          data: transcript,
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to get transcript");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Create transcript (internal use)
  fastify.post<{ Body: { agentId: string; userId?: string; content: string; duration: number } }>(
    "/transcripts",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const body = request.body;
        const tenantId = (request as any).user.tenantId;
        const userId = (request as any).user.userId;

        // Verify agent belongs to tenant
        const agent = await prisma.agent.findFirst({
          where: { id: body.agentId, tenantId },
        });
        if (!agent) {
          return reply.code(404).send({
            ok: false,
            message: "Agent not found",
          } as ApiResponse);
        }

        const transcript = await prisma.transcript.create({
          data: {
            agentId: body.agentId,
            userId: body.userId || userId,
            content: body.content,
            duration: body.duration,
          },
        });

        return reply.code(201).send({
          ok: true,
          message: "Transcript created",
          data: transcript,
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to create transcript");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Delete transcript
  fastify.delete<{ Params: { transcriptId: string } }>(
    "/transcripts/:transcriptId",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { transcriptId } = request.params as { transcriptId: string };
        const tenantId = (request as any).user.tenantId;

        // Verify transcript belongs to tenant
        const transcript = await prisma.transcript.findFirst({
          where: { id: transcriptId },
          include: {
            agent: {
              select: {
                tenantId: true,
              },
            },
          },
        });

        if (!transcript || transcript.agent.tenantId !== tenantId) {
          return reply.code(404).send({
            ok: false,
            message: "Transcript not found",
          } as ApiResponse);
        }

        await prisma.transcript.delete({
          where: { id: transcriptId },
        });

        logger.info({ transcriptId, tenantId }, "Transcript deleted");
        return reply.code(200).send({
          ok: true,
          message: "Transcript deleted",
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to delete transcript");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );
}
