"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.affiliateRoutes = affiliateRoutes;
const auth_1 = require("../middleware/auth");
const affiliate_1 = require("../services/affiliate");
const db_1 = require("../db");
const zod_1 = require("zod");
async function affiliateRoutes(fastify) {
    // Get current user's affiliate status and stats
    fastify.get("/affiliates/me", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const stats = await affiliate_1.affiliateManager.getStats(userId);
            if (!stats) {
                return reply.send({
                    ok: true,
                    data: { isAffiliate: false },
                });
            }
            return reply.send({
                ok: true,
                data: {
                    isAffiliate: true,
                    ...stats,
                },
            });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Apply for affiliate status
    fastify.post("/affiliates/apply", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const result = await affiliate_1.affiliateManager.applyForAffiliate(userId);
            if (!result.success) {
                return reply.code(400).send({ ok: false, message: result.message });
            }
            return reply.send({
                ok: true,
                message: "Application submitted successfully",
                data: result.data,
            });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: List all affiliate applications
    fastify.get("/admin/affiliates", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const affiliates = await db_1.prisma.affiliate.findMany({
                include: {
                    user: {
                        select: { name: true, email: true, username: true },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            return reply.send({ ok: true, data: affiliates });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: Update affiliate status
    const UpdateStatusSchema = zod_1.z.object({
        status: zod_1.z.enum(["PENDING", "ACTIVE", "REJECTED"]),
    });
    fastify.post("/admin/affiliates/:id/status", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { status } = UpdateStatusSchema.parse(request.body);
            const updated = await db_1.prisma.affiliate.update({
                where: { id },
                data: { status },
            });
            return reply.send({
                ok: true,
                message: `Affiliate status updated to ${status}`,
                data: updated,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ ok: false, message: "Invalid status" });
            }
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: Promote user to affiliate directly
    const PromoteSchema = zod_1.z.object({
        userId: zod_1.z.string(),
    });
    fastify.post("/admin/affiliates/promote", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { userId } = PromoteSchema.parse(request.body);
            // We pass "ACTIVE" to skip the pending state for manual admin promotion
            const result = await affiliate_1.affiliateManager.applyForAffiliate(userId, "ACTIVE");
            if (!result.success) {
                return reply.code(400).send({ ok: false, message: result.message });
            }
            return reply.send({
                ok: true,
                message: "User promoted to affiliate successfully",
                data: result.data,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ ok: false, message: "Missing userId" });
            }
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
}
