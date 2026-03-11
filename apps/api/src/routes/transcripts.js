"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transcriptRoutes = transcriptRoutes;
const db_1 = require("../db");
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
async function transcriptRoutes(fastify) {
    // Get conversation history for agent
    fastify.get("/agents/:agentId/transcripts", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { agentId } = request.params;
            const tenantId = request.user.tenantId;
            const limit = parseInt(request.query.limit || "50");
            const offset = parseInt(request.query.offset || "0");
            // Verify agent belongs to tenant
            const agent = await db_1.prisma.agent.findFirst({
                where: { id: agentId, tenantId },
            });
            if (!agent) {
                return reply.code(404).send({
                    ok: false,
                    message: "Agent not found",
                });
            }
            // Get transcripts
            const transcripts = await db_1.prisma.transcript.findMany({
                where: { agentId },
                take: limit,
                skip: offset,
                orderBy: { createdAt: "desc" },
            });
            const total = await db_1.prisma.transcript.count({
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
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get transcripts");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get transcript details
    fastify.get("/transcripts/:transcriptId", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { transcriptId } = request.params;
            const tenantId = request.user.tenantId;
            // Get transcript with agent details
            const transcript = await db_1.prisma.transcript.findFirst({
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
                });
            }
            return reply.code(200).send({
                ok: true,
                message: "Transcript retrieved",
                data: transcript,
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get transcript");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Create transcript (internal use)
    fastify.post("/transcripts", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const body = request.body;
            const tenantId = request.user.tenantId;
            const userId = request.user.userId;
            // Verify agent belongs to tenant
            const agent = await db_1.prisma.agent.findFirst({
                where: { id: body.agentId, tenantId },
            });
            if (!agent) {
                return reply.code(404).send({
                    ok: false,
                    message: "Agent not found",
                });
            }
            const transcript = await db_1.prisma.transcript.create({
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
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to create transcript");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Delete transcript
    fastify.delete("/transcripts/:transcriptId", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { transcriptId } = request.params;
            const tenantId = request.user.tenantId;
            // Verify transcript belongs to tenant
            const transcript = await db_1.prisma.transcript.findFirst({
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
                });
            }
            await db_1.prisma.transcript.delete({
                where: { id: transcriptId },
            });
            logger_1.logger.info({ transcriptId, tenantId }, "Transcript deleted");
            return reply.code(200).send({
                ok: true,
                message: "Transcript deleted",
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to delete transcript");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
