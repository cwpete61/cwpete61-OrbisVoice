"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiKeyRoutes = apiKeyRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
const crypto_1 = require("crypto");
const CreateApiKeySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(255),
});
async function apiKeyRoutes(fastify) {
    // List API keys for tenant
    fastify.get("/api-keys", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const tenantId = request.user.tenantId;
            const keys = await db_1.prisma.apiKey.findMany({
                where: { tenantId },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    expiresAt: true,
                    key: false, // Never return full key in list
                },
            });
            return reply.code(200).send({
                ok: true,
                message: "API keys retrieved",
                data: keys,
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to list API keys");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Create new API key
    fastify.post("/api-keys", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const body = CreateApiKeySchema.parse(request.body);
            const tenantId = request.user.tenantId;
            // Generate unique API key
            const key = `orbis_${(0, crypto_1.randomBytes)(32).toString("hex")}`;
            const apiKey = await db_1.prisma.apiKey.create({
                data: {
                    tenantId,
                    name: body.name,
                    key,
                },
            });
            logger_1.logger.info({ apiKeyId: apiKey.id, tenantId }, "API key created");
            return reply.code(201).send({
                ok: true,
                message: "API key created",
                data: {
                    id: apiKey.id,
                    name: apiKey.name,
                    key, // Return full key only on creation
                    createdAt: apiKey.createdAt,
                },
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
            logger_1.logger.error(err, "Failed to create API key");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Revoke API key
    fastify.delete("/api-keys/:id", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const tenantId = request.user.tenantId;
            const result = await db_1.prisma.apiKey.deleteMany({
                where: { id, tenantId },
            });
            if (result.count === 0) {
                return reply.code(404).send({
                    ok: false,
                    message: "API key not found",
                });
            }
            logger_1.logger.info({ apiKeyId: id, tenantId }, "API key revoked");
            return reply.code(200).send({
                ok: true,
                message: "API key revoked",
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to revoke API key");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
