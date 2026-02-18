import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { requireNotBlocked } from "../middleware/auth";
import { FastifyRequest } from "fastify";

export async function statsRoutes(fastify: FastifyInstance) {
  // Get dashboard stats for tenant
  fastify.get("/stats/dashboard", { onRequest: [requireNotBlocked] }, async (request: FastifyRequest, reply) => {
    try {
      const tenantId = (request as any).user.tenantId;

      // Count agents
      const agentCount = await prisma.agent.count({
        where: { tenantId },
      });

      // Count transcripts for tenant's agents
      const agents = await prisma.agent.findMany({
        where: { tenantId },
        select: { id: true },
      });

      const agentIds = agents.map((a) => a.id);

      const transcriptStats = await prisma.transcript.aggregate({
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
      const recentTranscripts = await prisma.transcript.count({
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
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get dashboard stats");
      return reply.code(500).send({
        ok: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  });

  // Get agent-specific stats
  fastify.get<{ Params: { agentId: string } }>(
    "/stats/agents/:agentId",
    { onRequest: [requireNotBlocked] },
    async (request: FastifyRequest, reply) => {
      try {
        const { agentId } = request.params as { agentId: string };
        const tenantId = (request as any).user.tenantId;

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

        // Get transcript stats for this agent
        const stats = await prisma.transcript.aggregate({
          where: { agentId },
          _count: true,
          _avg: { duration: true },
          _max: { createdAt: true },
          _min: { createdAt: true },
        });

        // Get conversation trends (last 30 days, grouped by day)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const transcripts = await prisma.transcript.findMany({
          where: {
            agentId,
            createdAt: { gte: thirtyDaysAgo },
          },
          select: { createdAt: true },
        });

        // Group by date
        const trendsByDate: Record<string, number> = {};
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
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to get agent stats");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );
}
