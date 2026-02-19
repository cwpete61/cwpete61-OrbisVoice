import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { authenticate } from "../middleware/auth";
import { ApiResponse } from "../types";
import { logger } from "../logger";

const GoogleConfigSchema = z.object({
    clientId: z.string().min(1),
    clientSecret: z.string().min(1),
    geminiApiKey: z.string().optional(),
});

export async function settingsRoutes(fastify: FastifyInstance) {
    // Get tenant's Google config
    fastify.get(
        "/settings/google-config",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const tenantId = (request as any).user?.tenantId;
                if (!tenantId) {
                    return reply.code(401).send({ ok: false, message: "Unauthorized" });
                }

                const config = await prisma.tenantGoogleConfig.findUnique({
                    where: { tenantId },
                });

                if (!config) {
                    return reply.send({ ok: true, data: null } as ApiResponse);
                }

                const includeSecrets = (request.query as any).include_secrets === "true";

                if (includeSecrets) {
                    return reply.send({
                        ok: true,
                        data: {
                            clientId: config.clientId,
                            clientSecret: config.clientSecret,
                            geminiApiKey: config.geminiApiKey,
                            hasConfig: true,
                        }
                    } as ApiResponse);
                }

                // Return masked config
                return reply.send({
                    ok: true,
                    data: {
                        clientId: config.clientId ? "********" + config.clientId.slice(-4) : null,
                        clientSecret: config.clientSecret ? "********" : null,
                        geminiApiKey: config.geminiApiKey ? "********" + config.geminiApiKey.slice(-4) : null,
                        hasConfig: true,
                    },
                } as ApiResponse);
            } catch (err) {
                logger.error({ err }, "Failed to fetch Google config");
                return reply.code(500).send({ ok: false, message: "Internal server error" });
            }
        }
    );

    // Update tenant's Google config
    fastify.post<{ Body: z.infer<typeof GoogleConfigSchema> }>(
        "/settings/google-config",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const tenantId = (request as any).user?.tenantId;
                if (!tenantId) {
                    return reply.code(401).send({ ok: false, message: "Unauthorized" });
                }

                const { clientId, clientSecret, geminiApiKey } = GoogleConfigSchema.parse(request.body);

                const config = await prisma.tenantGoogleConfig.upsert({
                    where: { tenantId },
                    update: {
                        clientId,
                        clientSecret,
                        geminiApiKey,
                    },
                    create: {
                        tenantId,
                        clientId,
                        clientSecret,
                        geminiApiKey,
                    },
                });

                logger.info({ tenantId }, "Updated tenant Google config");

                return reply.send({
                    ok: true,
                    message: "Configuration saved successfully",
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Validation error", data: err.errors });
                }
                logger.error({ err }, "Failed to update Google config");
                return reply.code(500).send({ ok: false, message: "Internal server error" });
            }
        }
    );

    // Delete tenant's Google config
    fastify.delete(
        "/settings/google-config",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const tenantId = (request as any).user?.tenantId;
                if (!tenantId) {
                    return reply.code(401).send({ ok: false, message: "Unauthorized" });
                }

                await prisma.tenantGoogleConfig.delete({
                    where: { tenantId },
                });

                logger.info({ tenantId }, "Deleted tenant Google config");

                return reply.send({
                    ok: true,
                    message: "Configuration removed successfully",
                } as ApiResponse);
            } catch (err) {
                if ((err as any).code === "P2025") {
                    return reply.code(404).send({ ok: false, message: "Configuration not found" });
                }
                logger.error({ err }, "Failed to delete Google config");
                return reply.code(500).send({ ok: false, message: "Internal server error" });
            }
        }
    );
}
