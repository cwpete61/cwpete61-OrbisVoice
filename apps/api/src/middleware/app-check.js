"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAppCheck = verifyAppCheck;
const app_check_1 = require("firebase-admin/app-check");
const logger_1 = require("../logger");
/**
 * Fastify middleware to verify Firebase App Check tokens.
 * Verify that the request originates from a legitimate app instance.
 */
async function verifyAppCheck(request, reply) {
    const appCheckToken = request.headers["x-firebase-appcheck"];
    const hasSecret = !!process.env.RECAPTCHA_SECRET_KEY;
    // Always bypass in development — App Check tokens only work in production Firebase apps
    if (process.env.NODE_ENV !== "production") {
        logger_1.logger.warn({ path: request.url }, "App Check bypassed: development mode");
        return;
    }
    if (!appCheckToken) {
        if (hasSecret) {
            logger_1.logger.warn({ path: request.url }, "Missing App Check token");
            return reply.code(401).send({
                ok: false,
                message: "Unauthorized: Missing identity attestation",
            });
        }
        // Soft-fail: No token and no secret configured
        logger_1.logger.warn({ path: request.url }, "App Check bypassed: Token missing and no secret set");
        return;
    }
    try {
        // If ReCaptcha secret is not configured, we skip verification to prevent lockout
        if (!hasSecret && process.env.NODE_ENV === "production") {
            logger_1.logger.warn({ path: request.url }, "App Check bypassed: RECAPTCHA_SECRET_KEY not set in production");
            return;
        }
        await (0, app_check_1.getAppCheck)().verifyToken(appCheckToken);
    }
    catch (err) {
        // Only enforce if we have a secret configured
        if (hasSecret) {
            logger_1.logger.error({ err: err.message, path: request.url }, "App Check verification failed");
            return reply.code(401).send({
                ok: false,
                message: "Unauthorized: Invalid identity attestation",
            });
        }
        logger_1.logger.warn({ err: err.message, path: request.url }, "App Check verification failed but bypassed (no secret set)");
    }
}
