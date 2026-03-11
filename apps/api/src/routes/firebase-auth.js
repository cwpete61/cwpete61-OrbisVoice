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
Object.defineProperty(exports, "__esModule", { value: true });
exports.firebaseAuthRoutes = firebaseAuthRoutes;
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const logger_1 = require("../logger");
async function firebaseAuthRoutes(fastify) {
    /**
     * POST /auth/firebase-verify
     * Verifies a Firebase ID token and returns user info
     */
    fastify.post("/auth/firebase-verify", async (request, reply) => {
        try {
            const { token } = request.body;
            if (!token) {
                return reply.code(400).send({ ok: false, message: "Token is required" });
            }
            const { auth } = await Promise.resolve().then(() => __importStar(require("../lib/firebase")));
            const decodedToken = await auth.verifyIdToken(token);
            // Check if user exists in our DB
            let user = await db_1.prisma.user.findUnique({
                where: { email: decodedToken.email },
                include: { tenant: true }
            });
            return reply.send({
                ok: true,
                message: "Token verified",
                data: {
                    firebaseUser: decodedToken,
                    dbUser: user || null,
                    existsInDb: !!user
                }
            });
        }
        catch (err) {
            logger_1.logger.error({ err }, "Firebase verification failed");
            return reply.code(401).send({ ok: false, message: "Invalid token" });
        }
    });
    /**
     * GET /auth/firebase-protected
     * A protected route that requires a valid Firebase token
     */
    fastify.get("/auth/firebase-protected", {
        preHandler: [auth_1.verifyFirebaseToken]
    }, async (request, reply) => {
        const firebaseUser = request.firebaseUser;
        return reply.send({
            ok: true,
            message: "Success! You are authenticated with Firebase",
            user: firebaseUser
        });
    });
}
