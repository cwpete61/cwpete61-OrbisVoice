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
                totalLeads,
                bookedLeads,
                avgDurationRes,
                subscriptionStats,
                recentActivities,
            ] = await Promise.all([
                prisma.tenant.count(),
                prisma.user.count(),
                prisma.agent.count(),
                prisma.transcript.count(),
                prisma.lead.count(),
                prisma.lead.count({ where: { isBooked: true } }),
                prisma.transcript.aggregate({
                    _avg: { duration: true }
                }),
                prisma.tenant.groupBy({
                    by: ['subscriptionTier'],
                    _count: true,
                }),
                prisma.toolExecutionAudit.findMany({
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: { agent: { select: { name: true, tenantId: true } } }
                }).catch(() => []),
            ]);

            const avgDuration = Math.round(avgDurationRes._avg.duration || 0);
            const conversionRate = totalLeads > 0 ? (bookedLeads / totalLeads) * 100 : 0;

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
                    totalLeads,
                    avgDuration,
                    conversionRate,
                    estimatedMRR,
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
    fastify.get("/admin/settings", { onRequest: [requireAdmin] }, async (request, reply) => {
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
    fastify.patch("/admin/settings", { onRequest: [requireAdmin] }, async (request, reply) => {
        try {
            const body = request.body as any;

            const updateData: any = {};
            const allowedFields = [
                "lowCommission", "medCommission", "highCommission",
                "payoutMinimum", "refundHoldDays", "payoutCycleDelayMonths",
                "transactionFeePercent", "starterLimit", "professionalLimit",
                "enterpriseLimit", "aiInfraLimit", "ltdLimit", 
                "emailVerificationEnabled", "globalEmailEnabled"
            ];

            allowedFields.forEach(field => {
                if (body[field] !== undefined) {
                    if (field === "emailVerificationEnabled" || field === "globalEmailEnabled") {
                        updateData[field] = Boolean(body[field]);
                    } else {
                        updateData[field] = Number(body[field]);
                    }
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

/**
 * Subscriber Management Routes
 */
export async function subscriberAdminRoutes(fastify: FastifyInstance) {
    fastify.addHook("onRequest", requireAdmin);

    // GET /admin/subscribers/:id/overview
    fastify.get<{ Params: { id: string } }>(
        "/subscribers/:id/overview",
        async (request, reply) => {
            try {
                const { id } = request.params;
                const tenant = await prisma.tenant.findUnique({
                    where: { id },
                    include: {
                        users: { select: { id: true, name: true, email: true, role: true, isAdmin: true, createdAt: true, affiliate: { select: { payoutHeld: true, id: true } } } },
                        agents: { select: { id: true, name: true, voiceId: true, createdAt: true, _count: { select: { transcripts: true, leads: true } } } },
                    },
                });
                if (!tenant) return reply.code(404).send({ ok: false, message: "Subscriber not found" } as ApiResponse);

                return reply.code(200).send({ ok: true, data: tenant } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to get subscriber overview");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // GET /admin/subscribers/:id/settings
    fastify.get<{ Params: { id: string } }>(
        "/subscribers/:id/settings",
        async (request, reply) => {
            try {
                const { id } = request.params;
                const [twilio, google] = await Promise.all([
                    prisma.tenantTwilioConfig.findUnique({ where: { tenantId: id } }),
                    prisma.tenantGoogleConfig.findUnique({ where: { tenantId: id } }),
                ]);

                return reply.send({
                    ok: true,
                    data: {
                        twilio: twilio ? {
                            accountSid: twilio.accountSid,
                            authToken: "********",
                            phoneNumber: twilio.phoneNumber,
                            hasConfig: true
                        } : null,
                        google: google ? {
                            clientId: google.clientId,
                            clientSecret: "********",
                            geminiApiKey: google.geminiApiKey ? "********" : null,
                            hasConfig: true
                        } : null
                    }
                } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to get subscriber settings");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // POST /admin/subscribers/:id/settings
    fastify.post<{ Params: { id: string }; Body: any }>(
        "/subscribers/:id/settings",
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { type, config } = request.body as { type: "twilio" | "google"; config: any };

                if (type === "twilio") {
                    const { accountSid, authToken, phoneNumber } = config;
                    // If authToken is "********", don't update it if we already have a config
                    const existing = await prisma.tenantTwilioConfig.findUnique({ where: { tenantId: id } });
                    
                    await prisma.tenantTwilioConfig.upsert({
                        where: { tenantId: id },
                        create: { tenantId: id, accountSid, authToken, phoneNumber },
                        update: { 
                            accountSid, 
                            phoneNumber,
                            ...(authToken !== "********" && { authToken })
                        }
                    });
                } else if (type === "google") {
                    const { clientId, clientSecret, geminiApiKey } = config;
                    await prisma.tenantGoogleConfig.upsert({
                        where: { tenantId: id },
                        create: { tenantId: id, clientId, clientSecret, geminiApiKey },
                        update: { 
                            clientId,
                            ...(clientSecret !== "********" && { clientSecret }),
                            ...(geminiApiKey !== "********" && { geminiApiKey })
                        }
                    });
                }

                return reply.send({ ok: true, message: "Settings updated" } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to update subscriber settings");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // DELETE /admin/subscribers/:id/settings/:type
    fastify.delete<{ Params: { id: string; type: string } }>(
        "/subscribers/:id/settings/:type",
        async (request, reply) => {
            try {
                const { id, type } = request.params;
                if (type === "twilio") {
                    await prisma.tenantTwilioConfig.delete({ where: { tenantId: id } });
                } else if (type === "google") {
                    await prisma.tenantGoogleConfig.delete({ where: { tenantId: id } });
                }
                return reply.send({ ok: true, message: "Settings removed" } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to delete subscriber settings");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // GET /admin/subscribers/:id/api-keys
    fastify.get<{ Params: { id: string } }>(
        "/subscribers/:id/api-keys",
        async (request, reply) => {
            try {
                const { id } = request.params;
                const keys = await prisma.apiKey.findMany({
                    where: { tenantId: id },
                    orderBy: { createdAt: "desc" }
                });
                return reply.send({ ok: true, data: keys } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to get subscriber API keys");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // POST /admin/subscribers/:id/api-keys
    fastify.post<{ Params: { id: string }; Body: { name: string } }>(
        "/subscribers/:id/api-keys",
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { name } = request.body;
                
                const { randomBytes } = await import("node:crypto");
                const key = `ov_${randomBytes(24).toString("hex")}`;

                const apiKey = await prisma.apiKey.create({
                    data: {
                        tenantId: id,
                        name: name || "Admin Generated Key",
                        key,
                    }
                });

                return reply.code(201).send({ ok: true, data: apiKey } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to create subscriber API key");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // DELETE /admin/subscribers/:id/api-keys/:keyId
    fastify.delete<{ Params: { id: string; keyId: string } }>(
        "/subscribers/:id/api-keys/:keyId",
        async (request, reply) => {
            try {
                const { id, keyId } = request.params;
                await prisma.apiKey.delete({
                    where: { id: keyId, tenantId: id }
                });
                return reply.send({ ok: true, message: "API key revoked" } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to revoke subscriber API key");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );
    // POST /admin/subscribers/:id/billing-portal
    fastify.post<{ Params: { id: string }; Body: { returnUrl?: string } }>(
        "/subscribers/:id/billing-portal",
        async (request, reply) => {
            try {
                const { id } = request.params;
                const body = (request.body || {}) as { returnUrl?: string };
                const returnUrl = body.returnUrl;
                
                const tenant = await prisma.tenant.findUnique({
                    where: { id },
                });

                if (!tenant || !tenant.stripeCustomerId) {
                    return reply.code(400).send({ ok: false, message: "No active billing account found for this subscriber" } as ApiResponse);
                }

                const { StripeClient } = await import("../integrations/stripe");
                const { env } = await import("../env");
                const stripe = new StripeClient({ apiKey: env.STRIPE_API_KEY || "" });

                const session = await stripe.createPortalSession({
                    customerId: tenant.stripeCustomerId,
                    returnUrl: returnUrl || `${env.WEB_URL}/admin/tenants`,
                });

                return reply.send({ ok: true, url: session.url } as any);
            } catch (err) {
                logger.error(err, "Failed to create subscriber billing portal session");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );
}
