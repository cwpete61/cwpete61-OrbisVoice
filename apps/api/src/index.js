"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const cors_1 = __importDefault(require("@fastify/cors"));
const jwt_1 = __importDefault(require("@fastify/jwt"));
const helmet_1 = __importDefault(require("@fastify/helmet"));
const rate_limit_1 = __importDefault(require("@fastify/rate-limit"));
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
const stripe_webhooks_1 = __importDefault(require("./routes/stripe-webhooks"));
const session_1 = require("./services/session");
const settings_1 = require("./routes/settings");
const packages_1 = require("./routes/packages");
const handlers_1 = require("./tools/handlers");
const referral_1 = require("./services/referral");
const leads_1 = require("./routes/leads");
const payouts_1 = require("./routes/payouts");
const admin_1 = require("./routes/admin");
const firebase_auth_1 = require("./routes/firebase-auth");
const notifications_1 = require("./routes/notifications");
const help_1 = require("./routes/help");
const db_1 = require("./db");
const fastify = (0, fastify_1.default)({
    loggerInstance: logger_1.logger.child({ context: "fastify" }),
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
// Register Helmet for security headers
fastify.register(helmet_1.default, {
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://*.firebaseio.com", "https://*.googleapis.com"],
        },
    },
    crossOriginOpenerPolicy: { policy: "unsafe-none" },
});
// Register Rate Limiting
fastify.register(rate_limit_1.default, {
    max: 100,
    timeWindow: "1 minute",
    // Route-specific overrides
    addHeaders: {
        "x-ratelimit-limit": true,
        "x-ratelimit-remaining": true,
        "x-ratelimit-reset": true,
        "retry-after": true,
    },
});
// Configure stricter limits for auth routes
fastify.addHook("onRoute", (routeOptions) => {
    if (routeOptions.url === "/auth/login" ||
        routeOptions.url === "/auth/signup" ||
        routeOptions.url === "/auth/firebase-signin") {
        routeOptions.config = {
            ...routeOptions.config,
            rateLimit: {
                max: 5,
                timeWindow: "1 minute",
            },
        };
    }
});
// Health check endpoint
fastify.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
});
// Base API endpoint
fastify.get("/api", async () => {
    return { message: "OrbisVoice API v1", version: "1.0.0" };
});
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
fastify.register(packages_1.packageRoutes);
fastify.register(stripe_webhooks_1.default);
fastify.register(payouts_1.payoutRoutes);
fastify.register(leads_1.leadRoutes, { prefix: "/api/leads" });
fastify.register(admin_1.adminRoutes);
fastify.register(firebase_auth_1.firebaseAuthRoutes);
fastify.register(notifications_1.notificationRoutes);
fastify.register(help_1.helpRoutes);
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
        // Bootstrap admin user
        try {
            await db_1.prisma.user.updateMany({
                where: { email: "admin@orbisvoice.app" },
                data: { isAdmin: true, role: "ADMIN" }
            });
            logger_1.logger.info("Admin bootstrap completed");
            // Bootstrap global platform settings
            const settingsCount = await db_1.prisma.platformSettings.count();
            if (settingsCount === 0) {
                await db_1.prisma.platformSettings.create({
                    data: {
                        id: "global",
                        starterLimit: 1000,
                        professionalLimit: 10000,
                        enterpriseLimit: 100000,
                        aiInfraLimit: 250000,
                        ltdLimit: 1000,
                    }
                });
                logger_1.logger.info("Platform settings bootstrapped");
            }
        }
        catch (err) {
            logger_1.logger.error({ err }, "Bootstrap failed");
        }
        await fastify.listen({ port: env_1.env.PORT, host: "0.0.0.0" });
        logger_1.logger.info(`Server running at http://0.0.0.0:${env_1.env.PORT}`);
        // Set up background job to process commission holds (every hour)
        setInterval(() => {
            logger_1.logger.info("Running scheduled clearPendingHolds...");
            referral_1.referralManager.clearPendingHolds();
        }, 1000 * 60 * 60);
    }
    catch (err) {
        logger_1.logger.error(err);
        process.exit(1);
    }
};
start();
