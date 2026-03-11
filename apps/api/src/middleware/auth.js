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
exports.authenticate = authenticate;
exports.verifyFirebaseToken = verifyFirebaseToken;
exports.requireAdmin = requireAdmin;
exports.requireSystemAdmin = requireSystemAdmin;
exports.requireNotBlocked = requireNotBlocked;
exports.decodeToken = decodeToken;
const jwt_1 = __importDefault(require("@fastify/jwt"));
const db_1 = require("../db");
async function authenticate(request, reply) {
    try {
        await request.jwtVerify();
    }
    catch (err) {
        reply.code(401).send({ ok: false, message: "Unauthorized" });
    }
}
/**
 * Firebase ID Token Verification Middleware
 */
async function verifyFirebaseToken(request, reply) {
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        reply.code(401).send({ ok: false, message: "No Firebase token provided" });
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        const { auth } = await Promise.resolve().then(() => __importStar(require("../lib/firebase")));
        const decodedToken = await auth.verifyIdToken(token);
        // Attach the decoded token to the request object
        request.firebaseUser = decodedToken;
    }
    catch (err) {
        reply.code(401).send({ ok: false, message: "Invalid or expired Firebase token" });
        return;
    }
}
async function requireAdmin(request, reply) {
    try {
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
        if (!dbUser || (!dbUser.isAdmin && dbUser.role !== "ADMIN" && dbUser.role !== "SYSTEM_ADMIN")) {
            reply.code(403).send({ ok: false, message: "Forbidden" });
            return;
        }
    }
    catch (err) {
        reply.code(500).send({ ok: false, message: "Internal server error" });
        return;
    }
}
async function requireSystemAdmin(request, reply) {
    try {
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
            select: { role: true },
        });
        if (!dbUser || dbUser.role !== "SYSTEM_ADMIN") {
            reply.code(403).send({ ok: false, message: "Forbidden: System Admin only" });
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
    // Optimization: Check JWT payload first
    if (user.isBlocked) {
        reply.code(403).send({ ok: false, message: "Account is blocked from accessing agents" });
        return;
    }
    try {
        // DB check for consistency (in case block happened after token issuance)
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
        // @ts-expect-error - jwt.verify is available at runtime
        return jwt_1.default.verify(token, secret);
    }
    catch {
        return null;
    }
}
