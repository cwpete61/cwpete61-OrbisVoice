import { FastifyInstance } from "fastify";
import { verifyFirebaseToken } from "../middleware/auth";
import { prisma } from "../db";
import { logger } from "../logger";

export async function firebaseAuthRoutes(fastify: FastifyInstance) {
    /**
     * POST /auth/firebase-verify
     * Verifies a Firebase ID token and returns user info
     */
    fastify.post("/auth/firebase-verify", async (request, reply) => {
        try {
            const { token } = request.body as { token: string };

            if (!token) {
                return reply.code(400).send({ ok: false, message: "Token is required" });
            }

            const { auth } = await import("../lib/firebase");
            const decodedToken = await auth.verifyIdToken(token);

            // Check if user exists in our DB
            let user = await prisma.user.findUnique({
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
        } catch (err) {
            logger.error({ err }, "Firebase verification failed");
            return reply.code(401).send({ ok: false, message: "Invalid token" });
        }
    });

    /**
     * GET /auth/firebase-protected
     * A protected route that requires a valid Firebase token
     */
    fastify.get("/auth/firebase-protected", {
        preHandler: [verifyFirebaseToken]
    }, async (request, reply) => {
        const firebaseUser = (request as any).firebaseUser;
        return reply.send({
            ok: true,
            message: "Success! You are authenticated with Firebase",
            user: firebaseUser
        });
    });
}
