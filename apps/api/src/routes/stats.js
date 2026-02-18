"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.statsRoutes = statsRoutes;
const db_1 = require("../db");
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
async function statsRoutes(fastify) {
    // Get dashboard stats for tenant
    fastify.get("/stats/dashboard", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const tenantId = request.user.tenantId;
            // Count agents
            const agentCount = await db_1.prisma.agent.count({
                where: { tenantId },
            });
            // Count transcripts for tenant's agents
            const agents = await db_1.prisma.agent.findMany({
                where: { tenantId },
                select: { id: true },
            });
            const agentIds = agents.map((a) => a.id);
            const transcriptStats = await db_1.prisma.transcript.aggregate({
                where: { agentId: { in: agentIds } },
                _count: true,
                _avg: {
                    duration: true,
                },
                _sum: {
                    duration: true,
                },
            });
            const transcriptCount = transcriptStats._count || 0;
            const avgDuration = transcriptStats._avg?.duration
                ? Math.round(transcriptStats._avg.duration / 60)
                : 0;
            const totalDuration = transcriptStats._sum?.duration || 0;
            // Get recent activity (last 7 days)
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const recentTranscripts = await db_1.prisma.transcript.count({
                where: {
                    agentId: { in: agentIds },
                    createdAt: { gte: sevenDaysAgo },
                },
            });
            return reply.code(200).send({
                ok: true,
                message: "Dashboard stats retrieved",
                data: {
                    totalAgents: agentCount,
                    totalConversations: transcriptCount,
                    avgDurationMinutes: avgDuration,
                    totalDurationMinutes: Math.round(totalDuration / 60),
                    recentConversationsLast7Days: recentTranscripts,
                    lastUpdated: new Date().toISOString(),
                },
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get dashboard stats");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get agent-specific stats
    fastify.get("/stats/agents/:agentId", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
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
            // Get transcript stats for this agent
            const stats = await db_1.prisma.transcript.aggregate({
                where: { agentId },
                _count: true,
                _avg: { duration: true },
                _max: { createdAt: true },
                _min: { createdAt: true },
            });
            // Get conversation trends (last 30 days, grouped by day)
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const transcripts = await db_1.prisma.transcript.findMany({
                where: {
                    agentId,
                    createdAt: { gte: thirtyDaysAgo },
                },
                select: { createdAt: true },
            });
            // Group by date
            const trendsByDate = {};
            transcripts.forEach((t) => {
                const date = t.createdAt.toISOString().split("T")[0];
                trendsByDate[date] = (trendsByDate[date] || 0) + 1;
            });
            return reply.code(200).send({
                ok: true,
                message: "Agent stats retrieved",
                data: {
                    agentId,
                    agentName: agent.name,
                    totalConversations: stats._count || 0,
                    avgDurationSeconds: Math.round(stats._avg?.duration || 0),
                    firstConversation: stats._min?.createdAt || null,
                    lastConversation: stats._max?.createdAt || null,
                    last30DaysTrend: trendsByDate,
                },
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get agent stats");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
