"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = userRoutes;
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_js_1 = require("../middleware/auth.js");
const db_js_1 = require("../db.js");
const UpdateProfileSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
});
const UpdatePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string(),
    newPassword: zod_1.z.string().min(8),
});
async function userRoutes(fastify) {
    // Get current user profile
    fastify.get("/users/me", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const user = await db_js_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    isAdmin: true,
                    tenantId: true,
                    referralCodeUsed: true,
                    referralRewardTotal: true,
                    createdAt: true,
                    tenant: {
                        select: {
                            name: true,
                            subscriptionTier: true,
                            subscriptionStatus: true,
                            usageLimit: true,
                            usageCount: true,
                        },
                    },
                },
            });
            if (!user) {
                return reply.code(404).send({
                    ok: false,
                    message: "User not found",
                });
            }
            return reply.send({
                ok: true,
                data: user,
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to fetch user profile");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Update user profile
    fastify.put("/users/me", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const body = UpdateProfileSchema.parse(request.body);
            // If email is being changed, check if it's already taken
            if (body.email) {
                const existing = await db_js_1.prisma.user.findUnique({
                    where: { email: body.email },
                });
                if (existing && existing.id !== userId) {
                    return reply.code(400).send({
                        ok: false,
                        message: "Email already in use",
                    });
                }
            }
            const user = await db_js_1.prisma.user.update({
                where: { id: userId },
                data: body,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    isAdmin: true,
                },
            });
            return reply.send({
                ok: true,
                data: user,
                message: "Profile updated successfully",
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to update user profile");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Update password
    fastify.put("/users/me/password", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const body = UpdatePasswordSchema.parse(request.body);
            // Get current user
            const user = await db_js_1.prisma.user.findUnique({
                where: { id: userId },
            });
            if (!user) {
                return reply.code(404).send({
                    ok: false,
                    message: "User not found",
                });
            }
            // Verify current password
            const valid = await bcryptjs_1.default.compare(body.currentPassword, user.passwordHash);
            if (!valid) {
                return reply.code(401).send({
                    ok: false,
                    message: "Current password is incorrect",
                });
            }
            // Hash new password
            const passwordHash = await bcryptjs_1.default.hash(body.newPassword, 10);
            // Update password
            await db_js_1.prisma.user.update({
                where: { id: userId },
                data: { passwordHash },
            });
            return reply.send({
                ok: true,
                message: "Password updated successfully",
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to update password");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
