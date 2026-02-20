"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireAdmin = requireAdmin;
exports.requireNotBlocked = requireNotBlocked;
exports.decodeToken = decodeToken;
const jwt_1 = __importDefault(require("@fastify/jwt"));
const db_1 = require("../db");
async function authenticate(request, reply) {
    try {
        // @ts-ignore - jwtVerify is added by @fastify/jwt plugin
        await request.jwtVerify();
    }
    catch (err) {
        reply.code(401).send({ ok: false, message: "Unauthorized" });
    }
}
async function requireAdmin(request, reply) {
    try {
        // @ts-ignore - jwtVerify is added by @fastify/jwt plugin
        await request.jwtVerify();
    }
    catch (err) {
        reply.code(401).send({ ok: false, message: "Unauthorized" });
        return;
    }
    const user = request.user;
    if (!user?.userId) {
        reply.code(401).send({ ok: false, message: "Unauthorized" });
        return;
    }
    try {
        const dbUser = await db_1.prisma.user.findUnique({
            where: { id: user.userId },
            select: { isAdmin: true, role: true },
        });
        if (!dbUser || (!dbUser.isAdmin && dbUser.role !== "ADMIN")) {
            reply.code(403).send({ ok: false, message: "Forbidden" });
            return;
        }
    }
    catch (err) {
        reply.code(500).send({ ok: false, message: "Internal server error" });
        return;
    }
}
async function requireNotBlocked(request, reply) {
    try {
        // @ts-ignore - jwtVerify is added by @fastify/jwt plugin
        await request.jwtVerify();
    }
    catch (err) {
        reply.code(401).send({ ok: false, message: "Unauthorized" });
        return;
    }
    const user = request.user;
    if (!user?.userId) {
        reply.code(401).send({ ok: false, message: "Unauthorized" });
        return;
    }
    try {
        const dbUser = await db_1.prisma.user.findUnique({
            where: { id: user.userId },
            select: { isBlocked: true },
        });
        if (dbUser?.isBlocked) {
            reply.code(403).send({ ok: false, message: "Account is blocked from accessing agents" });
            return;
        }
    }
    catch (err) {
        reply.code(500).send({ ok: false, message: "Internal server error" });
        return;
    }
}
function decodeToken(token, secret) {
    try {
        // @ts-ignore - jwt.verify is available at runtime
        return jwt_1.default.verify(token, secret);
    }
    catch {
        return null;
    }
}
