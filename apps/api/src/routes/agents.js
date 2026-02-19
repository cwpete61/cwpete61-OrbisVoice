"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agentRoutes = agentRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
const CreateAgentSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    systemPrompt: zod_1.z.string().min(1),
    voiceModel: zod_1.z.string().optional(),
});
const UpdateAgentSchema = CreateAgentSchema.partial();
async function agentRoutes(fastify) {
    // List agents for tenant
    fastify.get("/agents", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const tenantId = request.user.tenantId;
            const agents = await db_1.prisma.agent.findMany({
                where: { tenantId },
            });
            return reply.code(200).send({
                ok: true,
                message: "Agents retrieved",
                data: agents,
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to list agents");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Create agent
    fastify.post("/agents", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const body = CreateAgentSchema.parse(request.body);
            const tenantId = request.user.tenantId;
            const userId = request.user.userId;
            const agent = await db_1.prisma.agent.create({
                data: {
                    tenantId,
                    name: body.name,
                    systemPrompt: body.systemPrompt,
                    voiceId: body.voiceModel || "default",
                },
            });
            logger_1.logger.info({ agentId: agent.id, tenantId }, "Agent created");
            return reply.code(201).send({
                ok: true,
                message: "Agent created",
                data: agent,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({
                    ok: false,
                    message: "Validation error",
                    data: err.errors,
                });
            }
            logger_1.logger.error(err, "Failed to create agent");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get agent by ID
    fastify.get("/agents/:id", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const tenantId = request.user.tenantId;
            const agent = await db_1.prisma.agent.findFirst({
                where: { id, tenantId },
            });
            if (!agent) {
                return reply.code(404).send({
                    ok: false,
                    message: "Agent not found",
                });
            }
            return reply.code(200).send({
                ok: true,
                message: "Agent retrieved",
                data: agent,
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get agent");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Update agent
    fastify.put("/agents/:id", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = UpdateAgentSchema.parse(request.body);
            const tenantId = request.user.tenantId;
            const agent = await db_1.prisma.agent.updateMany({
                where: { id, tenantId },
                data: body,
            });
            if (agent.count === 0) {
                return reply.code(404).send({
                    ok: false,
                    message: "Agent not found",
                });
            }
            const updated = await db_1.prisma.agent.findUnique({ where: { id } });
            logger_1.logger.info({ agentId: id, tenantId }, "Agent updated");
            return reply.code(200).send({
                ok: true,
                message: "Agent updated",
                data: updated,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({
                    ok: false,
                    message: "Validation error",
                    data: err.errors,
                });
            }
            logger_1.logger.error(err, "Failed to update agent");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Delete agent
    fastify.delete("/agents/:id", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const tenantId = request.user.tenantId;
            const result = await db_1.prisma.agent.deleteMany({
                where: { id, tenantId },
            });
            if (result.count === 0) {
                return reply.code(404).send({
                    ok: false,
                    message: "Agent not found",
                });
            }
            logger_1.logger.info({ agentId: id, tenantId }, "Agent deleted");
            return reply.code(200).send({
                ok: true,
                message: "Agent deleted",
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to delete agent");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
