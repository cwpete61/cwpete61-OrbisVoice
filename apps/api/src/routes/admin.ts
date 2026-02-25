import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { requireAdmin, requireSystemAdmin } from "../middleware/auth";

export async function adminRoutes(fastify: FastifyInstance) {
    // All routes in this group require admin privileges
    fastify.addHook("onRequest", requireAdmin);

    /**
     * GET /admin/stats
     * Aggregated platform metrics
     */
    fastify.get("/admin/stats", async (request, reply) => {
        try {
            // Check health of dependencies
            let dbHealth = "operational";
            let redisHealth = "operational";

            try {
                await prisma.$queryRaw`SELECT 1`;
            } catch (err) {
                dbHealth = "down";
                logger.error({ err }, "Database health check failed");
            }

            const [
                totalTenants,
                totalUsers,
                totalAgents,
                totalTranscripts,
                subscriptionStats,
                recentActivities,
                revenueStats
            ] = await Promise.all([
                prisma.tenant.count(),
                prisma.user.count(),
                prisma.agent.count(),
                prisma.transcript.count(),
                prisma.tenant.groupBy({
                    by: ['subscriptionTier'],
                    _count: true,
                }),
                prisma.toolExecutionAudit.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { agent: { select: { name: true, tenantId: true } } }
                }).catch(() => []),
                prisma.tenant.aggregate({
                    _count: true,
                    where: { subscriptionStatus: "active" }
                })
            ]);

            // Calculate MRR (estimated based on current pricing)
            const tiers: Record<string, number> = {
                free: 0,
                ltd: 20,
                starter: 197,
                professional: 497,
                enterprise: 997,
                "ai-revenue-infrastructure": 1997,
            };

            let estimatedMRR = 0;
            subscriptionStats.forEach((stat: { subscriptionTier: string | null; _count: number }) => {
                const tier = stat.subscriptionTier || 'free';
                const price = tiers[tier] || 0;
                estimatedMRR += price * stat._count;
            });

            return reply.code(200).send({
                ok: true,
                message: "Admin stats retrieved",
                data: {
                    totalTenants,
                    totalUsers,
                    totalAgents,
                    totalTranscripts,
                    estimatedMRR,
                    activeSubscriptions: revenueStats._count,
                    subscriptionBreakdown: subscriptionStats,
                    recentActivities,
                    systemHealth: {
                        api: "operational",
                        database: dbHealth,
                        redis: redisHealth,
                    },
                    lastUpdated: new Date().toISOString(),
                },
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to get admin stats");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });

    /**
     * GET /admin/tenants
     * List all tenants with summary info
     */
    fastify.get("/admin/tenants", async (request, reply) => {
        try {
            const tenants = await prisma.tenant.findMany({
                include: {
                    _count: {
                        select: { agents: true, users: true }
                    },
                    users: {
                        select: { email: true, name: true },
                        orderBy: { createdAt: 'asc' },
                        take: 1
                    }
                },
                orderBy: { createdAt: "desc" }
            });

            return reply.code(200).send({
                ok: true,
                message: "Tenants retrieved",
                data: tenants
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to get tenants");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });

    /**
     * GET /admin/settings
     * Get platform-wide settings
     */
    fastify.get("/admin/settings", async (request, reply) => {
        try {
            let settings = await prisma.platformSettings.findFirst();

            if (!settings) {
                settings = await prisma.platformSettings.create({
                    data: { id: "global" }
                });
            }

            return reply.code(200).send({
                ok: true,
                message: "Settings retrieved",
                data: settings
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to get platform settings");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });

    /**
     * PATCH /admin/settings
     * Update platform-wide settings
     */
    fastify.patch("/admin/settings", { onRequest: [requireSystemAdmin] }, async (request, reply) => {
        try {
            const body = request.body as any;

            const updateData: any = {};
            const allowedFields = [
                "lowCommission", "medCommission", "highCommission",
                "payoutMinimum", "refundHoldDays", "payoutCycleDelayMonths",
                "transactionFeePercent", "starterLimit", "professionalLimit",
                "enterpriseLimit", "aiInfraLimit", "ltdLimit"
            ];

            allowedFields.forEach(field => {
                if (body[field] !== undefined) {
                    updateData[field] = Number(body[field]);
                }
            });

            const settings = await prisma.platformSettings.update({
                where: { id: "global" },
                data: updateData
            });

            return reply.code(200).send({
                ok: true,
                message: "Settings updated",
                data: settings
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to update platform settings");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });

    /**
     * GET /admin/audit-logs
     * Global audit logs for tool executions
     */
    fastify.get("/admin/audit-logs", async (request, reply) => {
        try {
            const { limit = "100", skip = "0", status, toolName } = request.query as any;

            const logs = await prisma.toolExecutionAudit.findMany({
                where: {
                    ...(status && { status }),
                    ...(toolName && { toolName }),
                },
                take: parseInt(limit),
                skip: parseInt(skip),
                orderBy: { createdAt: "desc" },
                include: {
                    agent: {
                        include: { tenant: { select: { name: true } } }
                    }
                }
            });

            const total = await prisma.toolExecutionAudit.count({
                where: {
                    ...(status && { status }),
                    ...(toolName && { toolName }),
                }
            });

            return reply.code(200).send({
                ok: true,
                message: "Audit logs retrieved",
                data: { logs, total }
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to get global audit logs");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });

    /**
     * POST /admin/impersonate
     * Generate a login token for a specific user
     */
    fastify.post("/admin/impersonate", { onRequest: [requireSystemAdmin] }, async (request, reply) => {
        try {
            const { userId } = request.body as { userId: string };
            if (!userId) {
                return reply.code(400).send({ ok: false, message: "UserId is required" });
            }

            const targetUser = await prisma.user.findUnique({
                where: { id: userId },
                include: { tenant: true }
            });

            if (!targetUser) {
                return reply.code(404).send({ ok: false, message: "User not found" });
            }

            // Generate JWT for the target user (7 days like normal login)
            const token = (fastify as any).jwt.sign(
                { userId: targetUser.id, tenantId: targetUser.tenantId, email: targetUser.email },
                { expiresIn: "7d" }
            );

            logger.info({ adminId: (request as any).user.userId, targetUserId: userId }, "Admin impersonation token generated");

            return reply.code(200).send({
                ok: true,
                message: "Impersonation token generated",
                data: { token }
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to generate impersonation token");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
}
