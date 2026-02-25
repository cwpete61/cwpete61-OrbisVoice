import { FastifyReply, FastifyRequest } from "fastify";
import { getAppCheck } from "firebase-admin/app-check";
import { logger } from "../logger";

/**
 * Fastify middleware to verify Firebase App Check tokens.
 * Verify that the request originates from a legitimate app instance.
 */
export async function verifyAppCheck(request: FastifyRequest, reply: FastifyReply) {
    const appCheckToken = request.headers["x-firebase-appcheck"] as string;
    const hasSecret = !!process.env.RECAPTCHA_SECRET_KEY;

    // Always bypass in development — App Check tokens only work in production Firebase apps
    if (process.env.NODE_ENV !== "production") {
        logger.warn({ path: request.url }, "App Check bypassed: development mode");
        return;
    }

    if (!appCheckToken) {
        if (hasSecret) {
            logger.warn({ path: request.url }, "Missing App Check token");
            return reply.code(401).send({
                ok: false,
                message: "Unauthorized: Missing identity attestation",
            });
        }
        // Soft-fail: No token and no secret configured
        logger.warn({ path: request.url }, "App Check bypassed: Token missing and no secret set");
        return;
    }

    try {
        // If ReCaptcha secret is not configured, we skip verification to prevent lockout
        if (!hasSecret && process.env.NODE_ENV === "production") {
            logger.warn({ path: request.url }, "App Check bypassed: RECAPTCHA_SECRET_KEY not set in production");
            return;
        }

        await getAppCheck().verifyToken(appCheckToken);
    } catch (err: any) {
        // Only enforce if we have a secret configured
        if (hasSecret) {
            logger.error({ err: err.message, path: request.url }, "App Check verification failed");
            return reply.code(401).send({
                ok: false,
                message: "Unauthorized: Invalid identity attestation",
            });
        }
        logger.warn({ err: err.message, path: request.url }, "App Check verification failed but bypassed (no secret set)");
    }
}
