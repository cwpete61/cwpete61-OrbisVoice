"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolAuditLogger = void 0;
const db_1 = require("../db");
const logger_1 = require("../logger");
class ToolAuditLogger {
    /**
     * Log tool execution to database
     */
    async log(data) {
        try {
            const audit = await db_1.prisma.toolExecutionAudit.create({
                data: {
                    agentId: data.agentId,
                    userId: data.userId || null,
                    toolName: data.toolName,
                    toolInput: JSON.stringify(data.toolInput),
                    toolOutput: data.toolOutput ? JSON.stringify(data.toolOutput) : null,
                    status: data.status,
                    errorMessage: data.errorMessage,
                    executionTimeMs: data.executionTimeMs || 0,
                },
            });
            return audit.id;
        }
        catch (err) {
            logger_1.logger.error({ err, toolName: data.toolName }, "Failed to log tool execution");
            // Don't throw - audit logging should not block tool execution
            return "";
        }
    }
    /**
     * Get audit logs for an agent
     */
    async getAgentLogs(agentId, limit = 50) {
        try {
            const audits = await db_1.prisma.toolExecutionAudit.findMany({
                where: { agentId },
                orderBy: { createdAt: "desc" },
                take: limit,
            });
            return audits.map((audit) => ({
                ...audit,
                toolInput: JSON.parse(audit.toolInput),
                toolOutput: audit.toolOutput ? JSON.parse(audit.toolOutput) : null,
            }));
        }
        catch (err) {
            logger_1.logger.error({ err, agentId }, "Failed to retrieve audit logs");
            throw err;
        }
    }
    /**
     * Get tool execution stats
     */
    async getToolStats(agentId) {
        try {
            const [total, successful, failed, avgTime] = await Promise.all([
                db_1.prisma.toolExecutionAudit.count({
                    where: { agentId },
                }),
                db_1.prisma.toolExecutionAudit.count({
                    where: { agentId, status: "success" },
                }),
                db_1.prisma.toolExecutionAudit.count({
                    where: { agentId, status: "failed" },
                }),
                db_1.prisma.toolExecutionAudit.aggregate({
                    where: { agentId, status: "success" },
                    _avg: { executionTimeMs: true },
                }),
            ]);
            const toolBreakdown = await db_1.prisma.toolExecutionAudit.groupBy({
                by: ["toolName"],
                where: { agentId },
                _count: true,
            });
            return {
                totalExecutions: total,
                successfulExecutions: successful,
                failedExecutions: failed,
                successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : "0",
                avgExecutionTimeMs: avgTime._avg.executionTimeMs || 0,
                toolBreakdown: toolBreakdown.map((tb) => ({
                    toolName: tb.toolName,
                    count: tb._count,
                })),
            };
        }
        catch (err) {
            logger_1.logger.error({ err, agentId }, "Failed to get tool stats");
            throw err;
        }
    }
}
exports.toolAuditLogger = new ToolAuditLogger();
