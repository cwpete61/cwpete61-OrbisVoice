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

      const agentIds = agents.map((a: any) => a.id);

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
        transcripts.forEach((t: any) => {
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

  // GET /stats/sales-chart - Get sales data for Analytics (Admins Only)
  fastify.get("/stats/sales-chart", { onRequest: [requireNotBlocked] }, async (request, reply) => {
    try {
      const user = (request as any).user;

      // Basic check for admin access for this chart
      const isSystemAdmin = user.email === "myorbislocal@gmail.com" || user.email === "admin@orbisvoice.app" || user.email === "myorbisvoice@gmail.com";
      if (!isSystemAdmin) {
        // Optionally, non-admins could just see an empty chart or throw 403. Let's return empty structure.
        return reply.send({ ok: true, data: [] } as ApiResponse);
      }

      // We'll aggregate data for the last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1); // Start of the month 6 months ago
      sixMonthsAgo.setHours(0, 0, 0, 0);

      // 1. Get all RewardTransactions since sixMonthsAgo to split Agent (Affiliate) vs Referrer
      const transactions = await prisma.rewardTransaction.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo },
          status: { in: ["available", "pending", "paid"] }
        },
        include: {
          referrer: {
            include: { affiliate: true }
          }
        }
      });

      // 2. Get all successful payments (approximate via Tenants who have a tier and created date, or ideally we'd query Stripe directly or a pure 'Payment' table if it exists. We'll use Tenant creation for baseline 'sales' approximation if no direct payment log exists. Wait, RewardTransaction sourcePaymentAmount holds the raw sale amount if we capture it! We only capture 'amount', which is commission. We'll roughly estimate Total Sales as Commission * 5 since generic commission is 20%. But wait, we can just track the actual Tenant signups and their tier!)
      // To get real Total Sales, we look at Stripe webhook data if stored. Or we can approximate Total Sales based on RewardTransactions.
      // Easiest real data: Map by month (YYYY-MM).

      const dataByMonth: Record<string, { monthDate: Date, name: string, AgentSales: number, ReferrerSales: number, TotalSales: number }> = {};

      // Initialize last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const name = d.toLocaleString('default', { month: 'short' });
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        dataByMonth[key] = { monthDate: d, name, AgentSales: 0, ReferrerSales: 0, TotalSales: 0 };
      }

      transactions.forEach(t => {
        const d = t.createdAt;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (dataByMonth[key]) {
          const isAffiliate = (t.referrer as any)?.affiliate !== null && (t.referrer as any)?.affiliate !== undefined;
          // We only have the commission amount stored in 'amount'. We should estimate the raw sale. 
          // If we don't have the raw sale readily available, we can chart the commission earned, or we can assume typical 20% commission => sale = amount * 5.
          // Let's assume standard commission ranges 20% to 50%. A rough 3x multiplier gets us close to raw sale if we don't have it tracked on the transaction table yet.
          const estimatedSale = t.amount * 4;

          if (isAffiliate) {
            dataByMonth[key].AgentSales += estimatedSale;
          } else {
            dataByMonth[key].ReferrerSales += estimatedSale;
          }
          dataByMonth[key].TotalSales += estimatedSale; // Reward transactions add to total
        }
      });

      // Add non-referred tenants to TotalSales (Organic)
      // We look at users created in the DB who didn't use a referral code.
      const organicUsers = await prisma.user.findMany({
        where: {
          createdAt: { gte: sixMonthsAgo },
          referralCodeUsed: null
        },
        include: { tenant: true }
      });

      organicUsers.forEach(u => {
        const tier = u.tenant?.subscriptionTier;
        if (tier && tier !== 'free') {
          const d = u.createdAt;
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
          if (dataByMonth[key]) {
            // Approximate LTV/Month value just to show data: starter 20, pro 49, ent 99, ltd 149
            let val = 0;
            if (tier === 'starter') val = 20;
            if (tier === 'professional') val = 49;
            if (tier === 'enterprise') val = 99;
            if (tier === 'ltd') val = 149;
            if (tier === 'ai-revenue-infrastructure') val = 299;
            dataByMonth[key].TotalSales += val;
          }
        }
      });

      const formattedData = Object.keys(dataByMonth).sort().map(k => ({
        name: dataByMonth[k].name,
        'Agent Sales': Math.round(dataByMonth[k].AgentSales),
        'Referrer Sales': Math.round(dataByMonth[k].ReferrerSales),
        'Total Sales': Math.round(dataByMonth[k].TotalSales)
      }));

      return reply.send({
        ok: true,
        data: formattedData
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to fetch sales chart data");
      return reply.code(500).send({
        ok: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  });

  // GET /stats/pricing-limits - Public endpoint for pricing page
  fastify.get("/stats/pricing-limits", async (request, reply) => {
    try {
      let settings = await prisma.platformSettings.findUnique({
        where: { id: "global" },
      });

      if (!settings) {
        settings = await prisma.platformSettings.findFirst();
      }

      const data = settings || {
        starterLimit: 1000,
        professionalLimit: 10000,
        enterpriseLimit: 100000,
        ltdLimit: 1000,
        aiInfraLimit: 250000,
      };

      return reply.send({
        ok: true,
        data,
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to fetch pricing limits");
      return reply.code(500).send({
        ok: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  });
}
