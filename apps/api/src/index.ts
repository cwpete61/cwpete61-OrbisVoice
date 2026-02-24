import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./env";
import { logger } from "./logger";
import { authRoutes } from "./routes/auth";
import { agentRoutes } from "./routes/agents";
import { apiKeyRoutes } from "./routes/api-keys";
import { transcriptRoutes } from "./routes/transcripts";
import { statsRoutes } from "./routes/stats";
import { referralRoutes } from "./routes/referrals";
import { auditRoutes } from "./routes/audit";
import billingRoutes from "./routes/billing";
import userRoutes from "./routes/users";
import twilioRoutes from "./routes/twilio";
import googleAuthRoutes from "./routes/google-auth";
import { affiliateRoutes } from "./routes/affiliates";
import stripeWebhookRoutes from "./routes/stripe-webhooks";
import { sessionManager } from "./services/session";
import { settingsRoutes } from "./routes/settings";
import { packageRoutes } from "./routes/packages";
import { registerToolHandlers } from "./tools/handlers";
import { referralManager } from "./services/referral";
import { leadRoutes } from "./routes/leads";
import { payoutRoutes } from "./routes/payouts";
import { adminRoutes } from "./routes/admin";
import { firebaseAuthRoutes } from "./routes/firebase-auth";
import { notificationRoutes } from "./routes/notifications";
import { helpRoutes } from "./routes/help";
import { prisma } from "./db";

const fastify = Fastify({
  logger: logger.child({ context: "fastify" }) as any,
});

// Register CORS
fastify.register(cors, {
  origin: env.CORS_ORIGINS,
  credentials: true,
});

// Register JWT
fastify.register(jwt, {
  secret: env.JWT_SECRET,
});

// Register Helmet for security headers
fastify.register(helmet, {
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
fastify.register(rateLimit, {
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
  if (
    routeOptions.url === "/auth/login" ||
    routeOptions.url === "/auth/signup" ||
    routeOptions.url === "/auth/firebase-signin"
  ) {
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
fastify.register(authRoutes);
fastify.register(transcriptRoutes);
fastify.register(statsRoutes);
fastify.register(referralRoutes);
fastify.register(auditRoutes);
fastify.register(agentRoutes);
fastify.register(apiKeyRoutes);
fastify.register(billingRoutes);
fastify.register(userRoutes);
fastify.register(twilioRoutes);
fastify.register(googleAuthRoutes);
fastify.register(settingsRoutes);
fastify.register(affiliateRoutes);
fastify.register(packageRoutes);
fastify.register(stripeWebhookRoutes);
fastify.register(payoutRoutes);
fastify.register(leadRoutes, { prefix: "/api/leads" });
fastify.register(adminRoutes);
fastify.register(firebaseAuthRoutes);
fastify.register(notificationRoutes);
fastify.register(helpRoutes);

// Start server
const start = async () => {
  try {
    // Initialize session manager (optional - continue if unavailable)
    try {
      await sessionManager.initialize(env.REDIS_URL);
      logger.info("Session manager initialized");
    } catch (err) {
      logger.warn({ err }, "Session manager unavailable - continuing without Redis");
    }

    // Register tool handlers
    registerToolHandlers();
    logger.info("Tool handlers registered");

    // Bootstrap admin user
    try {
      await (prisma as any).user.updateMany({
        where: { email: "admin@orbisvoice.app" },
        data: { isAdmin: true, role: "ADMIN" }
      });
      logger.info("Admin bootstrap completed");

      // Bootstrap global platform settings
      const settingsCount = await prisma.platformSettings.count();
      if (settingsCount === 0) {
        await prisma.platformSettings.create({
          data: {
            id: "global",
            starterLimit: 1000,
            professionalLimit: 10000,
            enterpriseLimit: 100000,
            aiInfraLimit: 250000,
            ltdLimit: 1000,
          }
        });
        logger.info("Platform settings bootstrapped");
      }
    } catch (err) {
      logger.error({ err }, "Bootstrap failed");
    }

    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info(`Server running at http://0.0.0.0:${env.PORT}`);

    // Set up background job to process commission holds (every hour)
    setInterval(() => {
      logger.info("Running scheduled clearPendingHolds...");
      referralManager.clearPendingHolds();
    }, 1000 * 60 * 60);

  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
