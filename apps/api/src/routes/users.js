"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
    firstName: zod_1.z.string().optional(),
    lastName: zod_1.z.string().optional(),
    businessName: zod_1.z.string().optional(),
    phone: zod_1.z.string().optional(),
    address: zod_1.z.string().optional(),
    unit: zod_1.z.string().optional(),
    city: zod_1.z.string().optional(),
    state: zod_1.z.string().optional(),
    zip: zod_1.z.string().optional(),
    tinSsn: zod_1.z.string().optional(),
    taxFormUrl: zod_1.z.string().optional(),
});
const UpdatePasswordSchema = zod_1.z.object({
    currentPassword: zod_1.z.string(),
    newPassword: zod_1.z.string().min(8),
});
const AdminUpdateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    email: zod_1.z.string().email().optional(),
    username: zod_1.z.string().min(3).regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens").optional(),
    role: zod_1.z.enum(["ADMIN", "USER"]).optional(),
    isAdmin: zod_1.z.boolean().optional(),
    tier: zod_1.z.enum(["free", "starter", "professional", "enterprise", "ai-revenue-infrastructure", "ltd"]).optional(),
    commissionLevel: zod_1.z.enum(["LOW", "MED", "HIGH"]).optional(),
});
const AdminCreateUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    email: zod_1.z.string().email(),
    username: zod_1.z
        .string()
        .min(3)
        .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens"),
    password: zod_1.z.string().min(8),
    tier: zod_1.z.enum(["free", "starter", "professional", "enterprise", "ai-revenue-infrastructure", "ltd"]).optional(),
    commissionLevel: zod_1.z.enum(["LOW", "MED", "HIGH"]).default("LOW"),
});
const PlatformSettingsSchema = zod_1.z.object({
    lowCommission: zod_1.z.number().min(0),
    medCommission: zod_1.z.number().min(0),
    highCommission: zod_1.z.number().min(0),
    commissionDurationMonths: zod_1.z.number().int().min(0).default(0),
    defaultCommissionLevel: zod_1.z.enum(["LOW", "MED", "HIGH"]).default("LOW"),
    payoutMinimum: zod_1.z.number().min(0).default(100),
    refundHoldDays: zod_1.z.number().int().min(0).default(14),
    payoutCycleDelayMonths: zod_1.z.number().int().min(0).default(1),
    starterLimit: zod_1.z.number().int().min(0),
    professionalLimit: zod_1.z.number().int().min(0),
    enterpriseLimit: zod_1.z.number().int().min(0),
    ltdLimit: zod_1.z.number().int().min(0),
    aiInfraLimit: zod_1.z.number().int().min(0),
});
const AdminBlockUserSchema = zod_1.z.object({
    isBlocked: zod_1.z.boolean(),
});
const AdminPasswordSchema = zod_1.z.object({
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
                    username: true,
                    role: true,
                    isAdmin: true,
                    isBlocked: true,
                    avatar: true,
                    tenantId: true,
                    commissionLevel: true,
                    referralCodeUsed: true,
                    referralRewardTotal: true,
                    firstName: true,
                    lastName: true,
                    businessName: true,
                    phone: true,
                    address: true,
                    unit: true,
                    city: true,
                    state: true,
                    zip: true,
                    tinSsn: true,
                    taxFormUrl: true,
                    createdAt: true,
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            createdAt: true,
                            updatedAt: true,
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
            // Get current user to verify they exist
            const currentUser = await db_js_1.prisma.user.findUnique({
                where: { id: userId },
                select: { id: true },
            });
            if (!currentUser) {
                return reply.code(404).send({
                    ok: false,
                    message: "User not found",
                });
            }
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
            if (!user.passwordHash) {
                return reply.code(400).send({
                    ok: false,
                    message: "Account has no password set",
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
    // Upload avatar
    fastify.post("/users/me/avatar", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const body = request.body;
            if (!body || !body.avatarData) {
                return reply.code(400).send({
                    ok: false,
                    message: "No avatar data provided",
                });
            }
            const avatarData = body.avatarData;
            // Validate base64 data size (max 5MB = ~6.7MB base64)
            if (avatarData.length > 7 * 1024 * 1024) {
                return reply.code(400).send({
                    ok: false,
                    message: "Avatar data exceeds size limit",
                });
            }
            // Validate it's a data URL or base64
            if (!avatarData.startsWith("data:image/") && !avatarData.match(/^[A-Za-z0-9+/=]+$/)) {
                return reply.code(400).send({
                    ok: false,
                    message: "Invalid avatar data format",
                });
            }
            // Update user avatar
            const user = await db_js_1.prisma.user.update({
                where: { id: userId },
                data: { avatar: avatarData },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    avatar: true,
                },
            });
            return reply.send({
                ok: true,
                data: user,
                message: "Avatar updated successfully",
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to upload avatar");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: list users
    fastify.get("/admin/users", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const filter = request.query?.filter;
            const paidFilter = {
                tenant: { subscriptionStatus: "active" },
            };
            const where = filter === "paid"
                ? paidFilter
                : filter === "free"
                    ? { NOT: paidFilter }
                    : undefined;
            const users = await db_js_1.prisma.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    isAdmin: true,
                    role: true,
                    isBlocked: true,
                    tenantId: true,
                    googleId: true,
                    googleEmail: true,
                    commissionLevel: true,
                    createdAt: true,
                    updatedAt: true,
                    tenant: {
                        select: {
                            subscriptionStatus: true,
                            subscriptionTier: true,
                        },
                    },
                    affiliate: {
                        select: {
                            id: true,
                            status: true,
                            slug: true,
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            });
            return reply.send({
                ok: true,
                data: users,
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to list users");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: create user
    fastify.post("/admin/users", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const body = AdminCreateUserSchema.parse(request.body);
            const tier = body.tier || "starter";
            const existing = await db_js_1.prisma.user.findUnique({
                where: { email: body.email },
            });
            if (existing) {
                return reply.code(400).send({
                    ok: false,
                    message: "Email already in use",
                });
            }
            const existingUsername = await db_js_1.prisma.user.findUnique({
                where: { username: body.username },
            });
            if (existingUsername) {
                return reply.code(400).send({
                    ok: false,
                    message: "Username already taken",
                });
            }
            const passwordHash = await bcryptjs_1.default.hash(body.password, 10);
            const tenant = await db_js_1.prisma.tenant.create({
                data: {
                    name: `${body.name}'s Workspace`,
                    subscriptionTier: tier,
                    subscriptionStatus: "active",
                },
            });
            const user = await db_js_1.prisma.user.create({
                data: {
                    email: body.email,
                    name: body.name,
                    username: body.username,
                    passwordHash,
                    tenantId: tenant.id,
                    commissionLevel: body.commissionLevel,
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    role: true,
                    isAdmin: true,
                    isBlocked: true,
                    commissionLevel: true,
                    tenant: {
                        select: {
                            subscriptionStatus: true,
                            subscriptionTier: true,
                        },
                    },
                },
            });
            return reply.code(201).send({
                ok: true,
                data: user,
                message: "User created successfully",
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
            fastify.log.error({ err }, "Failed to create user");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: get user by id
    fastify.get("/admin/users/:id", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const userId = request.params.id;
            const user = await db_js_1.prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    isAdmin: true,
                    role: true,
                    isBlocked: true,
                    avatar: true,
                    tenantId: true,
                    googleId: true,
                    googleEmail: true,
                    googleName: true,
                    googleProfilePicture: true,
                    commissionLevel: true,
                    createdAt: true,
                    updatedAt: true,
                    tenant: {
                        select: {
                            id: true,
                            name: true,
                            createdAt: true,
                            updatedAt: true,
                            subscriptionStatus: true,
                            subscriptionTier: true,
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
            fastify.log.error({ err }, "Failed to fetch user");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: update user
    fastify.put("/admin/users/:id", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const targetId = request.params.id;
            const body = AdminUpdateUserSchema.parse(request.body);
            const targetUser = await db_js_1.prisma.user.findUnique({
                where: { id: targetId },
                select: { id: true, email: true, username: true, isAdmin: true, role: true, tenantId: true },
            });
            if (!targetUser) {
                return reply.code(404).send({
                    ok: false,
                    message: "User not found",
                });
            }
            if (targetUser.username === "Oadmin") {
                if (body.username) {
                    return reply.code(403).send({
                        ok: false,
                        message: "Admin username cannot be changed",
                    });
                }
                if (body.role && body.role !== "ADMIN") {
                    return reply.code(403).send({
                        ok: false,
                        message: "Admin role cannot be changed",
                    });
                }
                if (body.isAdmin === false) {
                    return reply.code(403).send({
                        ok: false,
                        message: "Admin privileges cannot be removed",
                    });
                }
            }
            if (body.email && body.email !== targetUser.email) {
                const existingEmail = await db_js_1.prisma.user.findUnique({
                    where: { email: body.email },
                });
                if (existingEmail) {
                    return reply.code(400).send({
                        ok: false,
                        message: "Email already in use",
                    });
                }
            }
            if (body.username && body.username !== targetUser.username) {
                const existingUsername = await db_js_1.prisma.user.findUnique({
                    where: { username: body.username },
                });
                if (existingUsername) {
                    return reply.code(400).send({
                        ok: false,
                        message: "Username already taken",
                    });
                }
            }
            const { tier, ...userData } = body;
            const userSelect = {
                id: true,
                email: true,
                name: true,
                username: true,
                isAdmin: true,
                role: true,
                isBlocked: true,
                commissionLevel: true,
                tenant: {
                    select: {
                        subscriptionStatus: true,
                        subscriptionTier: true,
                    },
                },
            };
            const operations = [];
            if (Object.keys(userData).length > 0) {
                operations.push(db_js_1.prisma.user.update({
                    where: { id: targetId },
                    data: userData,
                    select: userSelect,
                }));
            }
            else {
                operations.push(db_js_1.prisma.user.findUnique({
                    where: { id: targetId },
                    select: userSelect,
                }));
            }
            if (tier) {
                operations.push(db_js_1.prisma.tenant.update({
                    where: { id: targetUser.tenantId },
                    data: {
                        subscriptionTier: tier,
                        subscriptionStatus: "active",
                    },
                }));
            }
            const [user] = await db_js_1.prisma.$transaction(operations);
            return reply.send({
                ok: true,
                data: user,
                message: "User updated successfully",
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
            fastify.log.error({ err }, "Failed to update user");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: block or unblock user
    fastify.put("/admin/users/:id/block", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const targetId = request.params.id;
            const body = AdminBlockUserSchema.parse(request.body);
            const targetUser = await db_js_1.prisma.user.findUnique({
                where: { id: targetId },
                select: { id: true, username: true },
            });
            if (!targetUser) {
                return reply.code(404).send({
                    ok: false,
                    message: "User not found",
                });
            }
            if (targetUser.username === "Oadmin") {
                return reply.code(403).send({
                    ok: false,
                    message: "Admin account cannot be blocked",
                });
            }
            const user = await db_js_1.prisma.user.update({
                where: { id: targetId },
                data: { isBlocked: body.isBlocked },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    username: true,
                    isAdmin: true,
                    role: true,
                    isBlocked: true,
                    commissionLevel: true,
                },
            });
            return reply.send({
                ok: true,
                data: user,
                message: body.isBlocked ? "User blocked" : "User unblocked",
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
            fastify.log.error({ err }, "Failed to update user block status");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: reset user password
    fastify.put("/admin/users/:id/password", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const targetId = request.params.id;
            const body = AdminPasswordSchema.parse(request.body);
            const targetUser = await db_js_1.prisma.user.findUnique({
                where: { id: targetId },
                select: { id: true, username: true },
            });
            if (!targetUser) {
                return reply.code(404).send({
                    ok: false,
                    message: "User not found",
                });
            }
            const passwordHash = await bcryptjs_1.default.hash(body.newPassword, 10);
            await db_js_1.prisma.user.update({
                where: { id: targetId },
                data: { passwordHash },
            });
            return reply.send({
                ok: true,
                message: "Password updated successfully",
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
            fastify.log.error({ err }, "Failed to update password");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: impersonate user (support access)
    fastify.post("/admin/users/:id/impersonate", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const targetId = request.params.id;
            const user = await db_js_1.prisma.user.findUnique({
                where: { id: targetId },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    tenantId: true,
                    username: true,
                },
            });
            if (!user) {
                return reply.code(404).send({
                    ok: false,
                    message: "User not found",
                });
            }
            const token = fastify.jwt.sign({ userId: user.id, tenantId: user.tenantId, email: user.email }, { expiresIn: "1h" });
            return reply.send({
                ok: true,
                message: "Impersonation token created",
                data: { token, user },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to impersonate user");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: delete user
    fastify.delete("/admin/users/:id", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const targetId = request.params.id;
            const targetUser = await db_js_1.prisma.user.findUnique({
                where: { id: targetId },
                select: { id: true, username: true },
            });
            if (!targetUser) {
                return reply.code(404).send({
                    ok: false,
                    message: "User not found",
                });
            }
            if (targetUser.username === "Oadmin") {
                return reply.code(403).send({
                    ok: false,
                    message: "Admin account cannot be deleted",
                });
            }
            await db_js_1.prisma.user.delete({
                where: { id: targetId },
            });
            return reply.send({
                ok: true,
                message: "User deleted successfully",
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to delete user");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: get Google auth configuration
    fastify.get("/admin/google-auth/config", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const config = await db_js_1.prisma.googleAuthConfig.findUnique({
                where: { id: "google-auth-config" },
            });
            return reply.send({
                ok: true,
                data: config || {
                    id: "google-auth-config",
                    clientId: null,
                    clientSecret: null,
                    redirectUri: null,
                    enabled: false,
                },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to fetch Google auth config");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: update Google auth configuration
    fastify.put("/admin/google-auth/config", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const body = request.body || {};
            const config = await db_js_1.prisma.googleAuthConfig.upsert({
                where: { id: "google-auth-config" },
                update: {
                    clientId: body.clientId,
                    clientSecret: body.clientSecret,
                    redirectUri: body.redirectUri,
                    enabled: typeof body.enabled === "boolean" ? body.enabled : undefined,
                },
                create: {
                    id: "google-auth-config",
                    clientId: body.clientId || null,
                    clientSecret: body.clientSecret || null,
                    redirectUri: body.redirectUri || null,
                    enabled: body.enabled ?? false,
                },
            });
            return reply.send({
                ok: true,
                data: config,
                message: "Google auth configuration updated",
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to update Google auth config");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: get System Email configuration
    fastify.get("/admin/system-email", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const config = await db_js_1.prisma.systemEmailConfig.findUnique({
                where: { id: "global" },
            });
            return reply.send({
                ok: true,
                data: config || {
                    username: "",
                    password: "",
                    imapServer: "",
                    imapPort: "",
                    imapSecurity: "SSL",
                    smtpServer: "",
                    smtpPort: "",
                    smtpSecurity: "SSL",
                    pop3Server: "",
                    pop3Port: "",
                    pop3Security: "SSL",
                },
            });
        }
        catch (err) {
            console.error("Failed to fetch system email config:", err);
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: update System Email configuration
    fastify.put("/admin/system-email", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const body = (request.body || {});
            const config = await db_js_1.prisma.systemEmailConfig.upsert({
                where: { id: "global" },
                update: {
                    username: body.username,
                    password: body.password,
                    imapServer: body.imapServer,
                    imapPort: body.imapPort,
                    imapSecurity: body.imapSecurity,
                    smtpServer: body.smtpServer,
                    smtpPort: body.smtpPort,
                    smtpSecurity: body.smtpSecurity,
                    pop3Server: body.pop3Server,
                    pop3Port: body.pop3Port,
                    pop3Security: body.pop3Security,
                },
                create: {
                    id: "global",
                    username: body.username,
                    password: body.password,
                    imapServer: body.imapServer,
                    imapPort: body.imapPort,
                    imapSecurity: body.imapSecurity || "SSL",
                    smtpServer: body.smtpServer,
                    smtpPort: body.smtpPort,
                    smtpSecurity: body.smtpSecurity || "SSL",
                    pop3Server: body.pop3Server,
                    pop3Port: body.pop3Port,
                    pop3Security: body.pop3Security || "SSL",
                },
            });
            return reply.send({
                ok: true,
                data: config,
                message: "System email configuration updated",
            });
        }
        catch (err) {
            console.error("Failed to update system email config:", err);
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: get Stripe Connect configuration
    fastify.get("/admin/stripe-connect", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const config = await db_js_1.prisma.stripeConnectConfig.findUnique({
                where: { id: "global" },
            });
            return reply.send({
                ok: true,
                data: config || {
                    clientId: "",
                    enabled: false,
                    minimumPayout: 100,
                },
            });
        }
        catch (err) {
            console.error("Failed to fetch Stripe Connect config:", err);
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: update Stripe Connect configuration
    fastify.put("/admin/stripe-connect", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const body = (request.body || {});
            const config = await db_js_1.prisma.stripeConnectConfig.upsert({
                where: { id: "global" },
                update: {
                    clientId: body.clientId,
                    enabled: body.enabled,
                    minimumPayout: body.minimumPayout,
                },
                create: {
                    id: "global",
                    clientId: body.clientId,
                    enabled: body.enabled || false,
                    minimumPayout: body.minimumPayout || 100,
                },
            });
            return reply.send({
                ok: true,
                data: config,
                message: "Stripe Connect configuration updated",
            });
        }
        catch (err) {
            console.error("Failed to update Stripe Connect config:", err);
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: test Stripe Connect connection
    fastify.post("/admin/stripe-connect/test", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const stripeModule = await Promise.resolve().then(() => __importStar(require("stripe")));
            const Stripe = stripeModule.default;
            // Use the environment variable Stripe key
            const stripeKey = process.env.STRIPE_API_KEY;
            if (!stripeKey) {
                return reply.code(400).send({
                    ok: false,
                    message: "No STRIPE_API_KEY found in server environment",
                });
            }
            const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
            // Attempt to fetch the account details to verify the key works
            const account = await stripe.accounts.retrieve();
            return reply.send({
                ok: true,
                data: {
                    id: account.id,
                    name: account.settings?.dashboard?.display_name || account.business_profile?.name || "Unknown Account Name",
                    email: account.email
                },
                message: "Successfully connected to Stripe!",
            });
        }
        catch (err) {
            console.error("Failed to test Stripe Connect connection:", err);
            return reply.code(400).send({
                ok: false,
                message: err.message || "Failed to connect to Stripe",
            });
        }
    });
    // Admin: test System Email configuration
    fastify.post("/admin/system-email/test", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const { testEmail, forceDevMode } = request.body || {};
            if (!testEmail) {
                return reply.code(400).send({
                    ok: false,
                    message: "Test email address is required",
                });
            }
            const config = await db_js_1.prisma.systemEmailConfig.findUnique({
                where: { id: "global" },
            });
            const nodemailer = await Promise.resolve().then(() => __importStar(require("nodemailer")));
            let transporter;
            let isDevTest = false;
            const isDevEnv = process.env.NODE_ENV !== "production";
            const requiresDevFallback = (!config || !config.smtpServer || !config.username || !config.password);
            const shouldRunDevMode = isDevEnv && (forceDevMode || requiresDevFallback);
            if (shouldRunDevMode) {
                const testAccount = await nodemailer.createTestAccount();
                transporter = nodemailer.createTransport({
                    host: "smtp.ethereal.email",
                    port: 587,
                    secure: false, // true for 465, false for other ports
                    auth: {
                        user: testAccount.user, // generated ethereal user
                        pass: testAccount.pass, // generated ethereal password
                    },
                    tls: {
                        rejectUnauthorized: false
                    }
                });
                isDevTest = true;
            }
            else if (requiresDevFallback) {
                return reply.code(400).send({
                    ok: false,
                    message: "System email is not fully configured. Please save SMTP settings first.",
                });
            }
            else {
                // Determine secure port logic
                const port = parseInt(config.smtpPort || "587");
                const secure = port === 465 || config.smtpSecurity === "SSL";
                transporter = nodemailer.createTransport({
                    host: config.smtpServer,
                    port,
                    secure,
                    auth: {
                        user: config.username,
                        pass: config.password,
                    },
                });
                // Verify connection for real configs
                await transporter.verify();
            }
            // Send test email
            const info = await transporter.sendMail({
                from: `"OrbisVoice System" <${config?.username || "test@orbisvoice.local"}>`,
                to: testEmail,
                subject: "Test Email from OrbisVoice",
                text: "This is a test email sent from the OrbisVoice System Email configuration panel.",
                html: "<p>This is a test email sent from the <strong>OrbisVoice System Email</strong> configuration panel.</p>",
            });
            let successMessage = "Test email sent successfully! Please check your inbox.";
            if (isDevTest) {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                successMessage = `Dev mode: Email sent via Ethereal. ${previewUrl}`;
            }
            return reply.send({
                ok: true,
                message: successMessage,
            });
        }
        catch (err) {
            console.error("Test email failed:", err);
            return reply.code(500).send({
                ok: false,
                message: `Failed to send test email: ${err.message || "Unknown error"}`,
            });
        }
    });
    // Get calendar connection status for current user
    fastify.get("/users/me/calendar", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const tenantId = request.user.tenantId;
            const creds = await db_js_1.prisma.calendarCredentials.findUnique({
                where: {
                    userId_tenantId: {
                        userId,
                        tenantId,
                    },
                },
                select: {
                    id: true,
                    calendarEmail: true,
                    createdAt: true,
                    expiresAt: true,
                },
            });
            return reply.send({
                ok: true,
                data: {
                    connected: !!creds,
                    ...creds,
                },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to get calendar status");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Disconnect user's calendar
    fastify.delete("/users/me/calendar", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const tenantId = request.user.tenantId;
            await db_js_1.prisma.calendarCredentials.deleteMany({
                where: {
                    userId,
                    tenantId,
                },
            });
            return reply.send({
                ok: true,
                message: "Calendar disconnected",
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to disconnect calendar");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get Gmail connection status for current user
    fastify.get("/users/me/gmail", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const tenantId = request.user.tenantId;
            const creds = await db_js_1.prisma.gmailCredentials.findUnique({
                where: {
                    userId_tenantId: {
                        userId,
                        tenantId,
                    },
                },
                select: {
                    id: true,
                    gmailEmail: true,
                    verified: true,
                    createdAt: true,
                    expiresAt: true,
                },
            });
            return reply.send({
                ok: true,
                data: {
                    connected: !!creds,
                    ...creds,
                },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to get Gmail status");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Disconnect user's Gmail
    fastify.delete("/users/me/gmail", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const tenantId = request.user.tenantId;
            await db_js_1.prisma.gmailCredentials.deleteMany({
                where: {
                    userId,
                    tenantId,
                },
            });
            return reply.send({
                ok: true,
                message: "Gmail disconnected",
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to disconnect Gmail");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get Gmail OAuth connection URL
    fastify.get("/users/me/gmail/connect-url", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const { OAuth2Client } = await Promise.resolve().then(() => __importStar(require("google-auth-library")));
            const { env } = await Promise.resolve().then(() => __importStar(require("../env.js")));
            const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, `${env.GOOGLE_REDIRECT_URI?.replace("/auth/google/callback", "") || "http://localhost:3000"}/auth/gmail/callback`);
            const url = client.generateAuthUrl({
                access_type: "offline",
                scope: [
                    "https://www.googleapis.com/auth/userinfo.email",
                    "https://www.googleapis.com/auth/gmail.send",
                ],
                prompt: "consent",
            });
            return reply.send({
                ok: true,
                data: { url },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to generate Gmail connect URL");
            return reply.code(500).send({
                ok: false,
                message: "Failed to generate Gmail connection URL",
            });
        }
    });
    // Handle Gmail OAuth callback
    fastify.post("/users/me/gmail/connect", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const tenantId = request.user.tenantId;
            const body = request.body;
            const { code } = body;
            if (!code) {
                return reply.code(400).send({
                    ok: false,
                    message: "Authorization code is required",
                });
            }
            const { OAuth2Client } = await Promise.resolve().then(() => __importStar(require("google-auth-library")));
            const { env } = await Promise.resolve().then(() => __importStar(require("../env.js")));
            const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, `${env.GOOGLE_REDIRECT_URI?.replace("/auth/google/callback", "") || "http://localhost:3000"}/auth/gmail/callback`);
            // Exchange code for tokens
            const { tokens } = await client.getToken(code);
            if (!tokens.access_token) {
                throw new Error("No access token received");
            }
            // Get user's email from the token
            const { google } = await Promise.resolve().then(() => __importStar(require("googleapis")));
            const oauth2Api = google.oauth2({ version: "v2", auth: client });
            client.setCredentials(tokens);
            const userInfo = await oauth2Api.userinfo.get();
            // Store or update Gmail credentials
            await db_js_1.prisma.gmailCredentials.upsert({
                where: {
                    userId_tenantId: {
                        userId,
                        tenantId,
                    },
                },
                create: {
                    userId,
                    tenantId,
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || null,
                    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    gmailEmail: userInfo.data.email,
                    scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/userinfo.email",
                    verified: true,
                },
                update: {
                    accessToken: tokens.access_token,
                    refreshToken: tokens.refresh_token || null,
                    expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
                    gmailEmail: userInfo.data.email,
                    verified: true,
                },
            });
            return reply.send({
                ok: true,
                message: "Gmail connected successfully",
                data: {
                    gmailEmail: userInfo.data.email,
                },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to connect Gmail");
            return reply.code(400).send({
                ok: false,
                message: "Failed to connect Gmail account",
            });
        }
    });
    // Get Gmail credentials
    fastify.get("/users/me/gmail/credentials", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const tenantId = request.user.tenantId;
            const creds = await db_js_1.prisma.gmailCredentials.findUnique({
                where: {
                    userId_tenantId: {
                        userId,
                        tenantId,
                    },
                },
                select: {
                    gmailEmail: true,
                    verified: true,
                    expiresAt: true,
                },
            });
            return reply.send({
                ok: true,
                data: creds || { gmailEmail: null, verified: false },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to fetch Gmail credentials");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Disconnect Gmail
    fastify.delete("/users/me/gmail/disconnect", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const tenantId = request.user.tenantId;
            await db_js_1.prisma.gmailCredentials.delete({
                where: {
                    userId_tenantId: {
                        userId,
                        tenantId,
                    },
                },
            });
            return reply.send({
                ok: true,
                message: "Gmail disconnected successfully",
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to disconnect Gmail");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Verify Gmail connectivity
    fastify.post("/users/me/gmail/verify", { onRequest: [auth_js_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const tenantId = request.user.tenantId;
            const creds = await db_js_1.prisma.gmailCredentials.findUnique({
                where: {
                    userId_tenantId: {
                        userId,
                        tenantId,
                    },
                },
            });
            if (!creds) {
                return reply.code(400).send({
                    ok: false,
                    message: "Gmail not connected",
                });
            }
            try {
                // Test access by making a simple API call to Gmail
                const response = await fetch("https://www.googleapis.com/gmail/v1/users/me/profile", {
                    headers: {
                        Authorization: `Bearer ${creds.accessToken}`,
                    },
                });
                if (!response.ok) {
                    if (response.status === 401) {
                        // Token might be expired, mark as not verified
                        await db_js_1.prisma.gmailCredentials.update({
                            where: { id: creds.id },
                            data: { verified: false },
                        });
                        return reply.code(401).send({
                            ok: false,
                            message: "Gmail token expired. Please reconnect.",
                        });
                    }
                    throw new Error(`Gmail API returned ${response.status}`);
                }
                const profile = await response.json();
                // Update verified status
                await db_js_1.prisma.gmailCredentials.update({
                    where: { id: creds.id },
                    data: {
                        verified: true,
                        gmailEmail: profile.emailAddress || creds.gmailEmail,
                    },
                });
                return reply.send({
                    ok: true,
                    message: "Gmail connection verified successfully",
                    data: {
                        gmailEmail: profile.emailAddress || creds.gmailEmail,
                        verified: true,
                    },
                });
            }
            catch (err) {
                fastify.log.error({ err }, "Gmail verification failed");
                return reply.code(400).send({
                    ok: false,
                    message: "Gmail verification failed",
                });
            }
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to verify Gmail");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: Get platform settings
    fastify.get("/admin/platform-settings", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            let settings = await db_js_1.prisma.platformSettings.findUnique({
                where: { id: "global" },
            });
            if (!settings) {
                // Initialize default settings if not exists
                settings = await db_js_1.prisma.platformSettings.create({
                    data: {
                        id: "global",
                        lowCommission: 10,
                        medCommission: 20,
                        highCommission: 30,
                        commissionDurationMonths: 0,
                        defaultCommissionLevel: "LOW",
                        payoutMinimum: 100,
                        refundHoldDays: 14,
                        payoutCycleDelayMonths: 1,
                        starterLimit: 1000,
                        professionalLimit: 10000,
                        enterpriseLimit: 100000,
                        ltdLimit: 1000,
                        aiInfraLimit: 250000,
                    },
                });
            }
            return reply.send({
                ok: true,
                data: settings,
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to fetch platform settings");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: Update platform settings
    fastify.put("/admin/platform-settings", { onRequest: [auth_js_1.requireAdmin] }, async (request, reply) => {
        try {
            const body = PlatformSettingsSchema.parse(request.body);
            const settings = await db_js_1.prisma.platformSettings.upsert({
                where: { id: "global" },
                update: body,
                create: {
                    id: "global",
                    ...body,
                },
            });
            return reply.send({
                ok: true,
                data: settings,
                message: "Platform settings updated successfully",
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
            fastify.log.error({ err }, "Failed to update platform settings");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
