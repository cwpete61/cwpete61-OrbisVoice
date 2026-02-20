"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditRoutes = auditRoutes;
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../services/audit");
const db_1 = require("../db");
async function auditRoutes(fastify) {
    // Get audit logs for an agent
    fastify.get("/agents/:agentId/audit-logs", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { agentId } = request.params;
            const tenantId = request.user.tenantId;
            const limit = Math.min(parseInt(request.query.limit || "50"), 100);
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
            const logs = await audit_1.toolAuditLogger.getAgentLogs(agentId, limit);
            return reply.code(200).send({
                ok: true,
                message: "Audit logs retrieved",
                data: {
                    agentId,
                    totalLogs: logs.length,
                    logs,
                },
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get audit logs");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get tool execution stats for an agent
    fastify.get("/agents/:agentId/tool-stats", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { agentId } = request.params;
            const tenantId = request.user.tenantId;
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
            const stats = await audit_1.toolAuditLogger.getToolStats(agentId);
            return reply.code(200).send({
                ok: true,
                message: "Tool execution stats retrieved",
                data: {
                    agentId,
                    ...stats,
                },
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get tool stats");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get a specific audit log entry
    fastify.get("/audit-logs/:logId", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const { logId } = request.params;
            const tenantId = request.user.tenantId;
            const log = await db_1.prisma.toolExecutionAudit.findFirst({
                where: {
                    id: logId,
                    agent: {
                        tenantId,
                    },
                },
                include: {
                    agent: true,
                },
            });
            if (!log) {
                return reply.code(404).send({
                    ok: false,
                    message: "Audit log not found",
                });
            }
            return reply.code(200).send({
                ok: true,
                message: "Audit log retrieved",
                data: {
                    ...log,
                    toolInput: JSON.parse(log.toolInput),
                    toolOutput: log.toolOutput ? JSON.parse(log.toolOutput) : null,
                },
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get audit log");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get tenant-wide tool execution summary
    fastify.get("/audit-summary", { onRequest: [auth_1.requireNotBlocked] }, async (request, reply) => {
        try {
            const tenantId = request.user.tenantId;
            // Get all agents for tenant
            const agents = await db_1.prisma.agent.findMany({
                where: { tenantId },
                select: { id: true, name: true },
            });
            const agentIds = agents.map((a) => a.id);
            // Get summary stats
            const [total, successful, failed] = await Promise.all([
                db_1.prisma.toolExecutionAudit.count({
                    where: { agentId: { in: agentIds } },
                }),
                db_1.prisma.toolExecutionAudit.count({
                    where: { agentId: { in: agentIds }, status: "success" },
                }),
                db_1.prisma.toolExecutionAudit.count({
                    where: { agentId: { in: agentIds }, status: "failed" },
                }),
            ]);
            return reply.code(200).send({
                ok: true,
                message: "Audit summary retrieved",
                data: {
                    totalExecutions: total,
                    successfulExecutions: successful,
                    failedExecutions: failed,
                    successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : "0",
                    numAgents: agents.length,
                },
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get audit summary");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
