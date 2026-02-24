import { FastifyReply, FastifyRequest } from "fastify";
import { getAppCheck } from "firebase-admin/app-check";
import { logger } from "../logger";

/**
 * Fastify middleware to verify Firebase App Check tokens.
 * Verify that the request originates from a legitimate app instance.
 */
export async function verifyAppCheck(request: FastifyRequest, reply: FastifyReply) {
    const appCheckToken = request.headers["x-firebase-appcheck"] as string;

    if (!appCheckToken) {
        logger.warn({ path: request.url }, "Missing App Check token");
        return reply.code(401).send({
            ok: false,
            message: "Unauthorized: Missing identity attestation",
        });
    }

    try {
        await getAppCheck().verifyToken(appCheckToken);
    } catch (err: any) {
        logger.error({ err: err.message, path: request.url }, "App Check verification failed");
        return reply.code(401).send({
            ok: false,
            message: "Unauthorized: Invalid identity attestation",
        });
    }
}
