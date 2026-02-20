"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const env_1 = require("./env");
const logger_1 = require("./logger");
const auth_1 = require("./routes/auth");
const agents_1 = require("./routes/agents");
const api_keys_1 = require("./routes/api-keys");
const transcripts_1 = require("./routes/transcripts");
const stats_1 = require("./routes/stats");
const referrals_1 = require("./routes/referrals");
const audit_1 = require("./routes/audit");
const billing_1 = __importDefault(require("./routes/billing"));
const users_1 = __importDefault(require("./routes/users"));
const twilio_1 = __importDefault(require("./routes/twilio"));
const google_auth_1 = __importDefault(require("./routes/google-auth"));
const affiliates_1 = require("./routes/affiliates");
const session_1 = require("./services/session");
const settings_1 = require("./routes/settings");
const handlers_1 = require("./tools/handlers");
const fastify = (0, fastify_1.default)({
    logger: logger_1.logger.child({ context: "fastify" }),
});
// Register CORS
fastify.register(cors_1.default, {
    origin: env_1.env.CORS_ORIGINS,
    credentials: true,
});
// Register JWT
fastify.register(jwt_1.default, {
    secret: env_1.env.JWT_SECRET,
});
// Health check endpoint
fastify.get("/health", async (request, reply) => {
    return { status: "ok", timestamp: new Date().toISOString() };
});
// Base API endpoint
fastify.get("/api", async (request, reply) => {
    return { message: "OrbisVoice API v1", version: "1.0.0" };
});
// ... imports
// Register route groups
fastify.register(auth_1.authRoutes);
fastify.register(transcripts_1.transcriptRoutes);
fastify.register(stats_1.statsRoutes);
fastify.register(referrals_1.referralRoutes);
fastify.register(audit_1.auditRoutes);
fastify.register(agents_1.agentRoutes);
fastify.register(api_keys_1.apiKeyRoutes);
fastify.register(billing_1.default);
fastify.register(users_1.default);
fastify.register(twilio_1.default);
fastify.register(google_auth_1.default);
fastify.register(settings_1.settingsRoutes);
fastify.register(affiliates_1.affiliateRoutes);
// Start server
const start = async () => {
    try {
        // Initialize session manager (optional - continue if unavailable)
        try {
            await session_1.sessionManager.initialize(env_1.env.REDIS_URL);
            logger_1.logger.info("Session manager initialized");
        }
        catch (err) {
            logger_1.logger.warn({ err }, "Session manager unavailable - continuing without Redis");
        }
        // Register tool handlers
        (0, handlers_1.registerToolHandlers)();
        logger_1.logger.info("Tool handlers registered");
        await fastify.listen({ port: env_1.env.PORT, host: "0.0.0.0" });
        logger_1.logger.info(`Server running at http://0.0.0.0:${env_1.env.PORT}`);
    }
    catch (err) {
        logger_1.logger.error(err);
        process.exit(1);
    }
};
start();
