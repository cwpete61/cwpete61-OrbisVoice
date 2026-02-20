"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.settingsRoutes = settingsRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const logger_1 = require("../logger");
const GoogleConfigSchema = zod_1.z.object({
    clientId: zod_1.z.string().min(1),
    clientSecret: zod_1.z.string().min(1),
    geminiApiKey: zod_1.z.string().optional(),
});
async function settingsRoutes(fastify) {
    // Get tenant's Google config
    fastify.get("/settings/google-config", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const tenantId = request.user?.tenantId;
            if (!tenantId) {
                return reply.code(401).send({ ok: false, message: "Unauthorized" });
            }
            const config = await db_1.prisma.tenantGoogleConfig.findUnique({
                where: { tenantId },
            });
            if (!config) {
                return reply.send({ ok: true, data: null });
            }
            const includeSecrets = request.query.include_secrets === "true";
            if (includeSecrets) {
                return reply.send({
                    ok: true,
                    data: {
                        clientId: config.clientId,
                        clientSecret: config.clientSecret,
                        geminiApiKey: config.geminiApiKey,
                        hasConfig: true,
                    }
                });
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
            });
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to fetch Google config");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // Update tenant's Google config
    fastify.post("/settings/google-config", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const tenantId = request.user?.tenantId;
            if (!tenantId) {
                return reply.code(401).send({ ok: false, message: "Unauthorized" });
            }
            const { clientId, clientSecret, geminiApiKey } = GoogleConfigSchema.parse(request.body);
            const config = await db_1.prisma.tenantGoogleConfig.upsert({
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
            logger_1.logger.info({ tenantId }, "Updated tenant Google config");
            return reply.send({
                ok: true,
                message: "Configuration saved successfully",
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ ok: false, message: "Validation error", data: err.errors });
            }
            logger_1.logger.error({ err }, "Failed to update Google config");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // Delete tenant's Google config
    fastify.delete("/settings/google-config", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const tenantId = request.user?.tenantId;
            if (!tenantId) {
                return reply.code(401).send({ ok: false, message: "Unauthorized" });
            }
            await db_1.prisma.tenantGoogleConfig.delete({
                where: { tenantId },
            });
            logger_1.logger.info({ tenantId }, "Deleted tenant Google config");
            return reply.send({
                ok: true,
                message: "Configuration removed successfully",
            });
        }
        catch (err) {
            if (err.code === "P2025") {
                return reply.code(404).send({ ok: false, message: "Configuration not found" });
            }
            logger_1.logger.error({ err }, "Failed to delete Google config");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
}
