import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import bcrypt from "bcryptjs";
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
import { adminRoutes, subscriberAdminRoutes } from "./routes/admin";
import { notificationRoutes } from "./routes/notifications";
import { helpRoutes } from "./routes/help";
import { commerceBridgeRoutes } from "./routes/commerce-bridge";
import { publicRoutes } from "./routes/public";
import { prisma } from "./db";

const fastify = Fastify({
  loggerInstance: logger.child({ context: "fastify" }) as any,
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
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com", "https://m.stripe.network"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.stripe.com"],
      connectSrc: [
        "'self'",
        "https://*.googleapis.com",
        "https://api.stripe.com",
        "https://m.stripe.network",
      ],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
    },
  },
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
});

// Register Rate Limiting
fastify.register(rateLimit, {
  max: 1000,
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
  if (routeOptions.url === "/auth/login" || routeOptions.url === "/auth/signup") {
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
  try {
    const fs = require("fs");
    const path = require("path");
    const versionData = JSON.parse(
      fs.readFileSync(path.join(__dirname, "../../../version.json"), "utf8")
    );
    return {
      message: "OrbisVoice API v1",
      version: versionData.version,
      deployTime: versionData.deployTime,
    };
  } catch (err) {
    return { message: "OrbisVoice API v1", version: "1.0.1 (fallback)" };
  }
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
fastify.register(subscriberAdminRoutes, { prefix: "/admin" });
fastify.register(notificationRoutes);
fastify.register(helpRoutes);
fastify.register(commerceBridgeRoutes);
fastify.register(publicRoutes);

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

    // Bootstrap admin user with retries
    const maxRetries = 5;
    let retries = 0;
    let bootstrapped = false;

    while (retries < maxRetries && !bootstrapped) {
      try {
        const adminEmail = "admin@orbisvoice.app";
        const adminExist = await prisma.user.findFirst({
          where: { email: adminEmail },
        });

        if (!adminExist) {
          // Create a default tenant for the admin if none exists
          let defaultTenant = await prisma.tenant.findFirst();
          if (!defaultTenant) {
            defaultTenant = await prisma.tenant.create({
              data: { name: "System Workspace" },
            });
            logger.info("Default system tenant created");
          }

          // Create the admin user
          const salt = await bcrypt.genSalt(10);
          const passwordHash = await bcrypt.hash("admin123", salt);

          await prisma.user.create({
            data: {
              email: adminEmail,
              name: "System Admin",
              isAdmin: true,
              role: "SYSTEM_ADMIN",
              tenantId: defaultTenant.id,
              emailVerified: new Date(),
              passwordHash: passwordHash,
            },
          });
          logger.info("Admin user created");
        } else {
          // Ensure existing admin has correct roles (never reset password)
          const updateData: any = { isAdmin: true, role: "SYSTEM_ADMIN" };

          await prisma.user.update({
            where: { id: adminExist.id },
            data: updateData,
          });
          logger.info("Admin roles synchronized");
        }

        // Bootstrap global platform settings
        const settingsCount = await prisma.platformSettings.count();
        if (settingsCount === 0) {
          await prisma.platformSettings.create({
            data: {
              id: "global",
              freeTierLimit: 100,
              freeToStarterEnabled: false,
              freeToProfessionalEnabled: false,
              freeToEnterpriseEnabled: false,
              freeToLtdEnabled: false,
              freeToAiInfraEnabled: false,
              starterLimit: 1000,
              professionalLimit: 10000,
              enterpriseLimit: 100000,
              aiInfraLimit: 250000,
              ltdLimit: 1000,
            } as any,
          });
          logger.info("Platform settings bootstrapped");
        }

        logger.info("Admin bootstrap completed");
        bootstrapped = true;
      } catch (err: any) {
        retries++;
        if (err.code === "P2021" || err.message?.includes("does not exist")) {
          logger.warn(`Bootstrap tables not ready (attempt ${retries}/${maxRetries}), waiting...`);
          await new Promise((resolve) => setTimeout(resolve, 5000));
        } else {
          logger.error({ err }, "Unexpected bootstrap failure");
          break;
        }
      }
    }

    if (!bootstrapped) {
      logger.error("Bootstrap failed after all retries. The database might need manual migration.");
    }

    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info(`Server running at http://0.0.0.0:${env.PORT}`);

    // Set up background job to process commission holds (every hour)
    setInterval(
      () => {
        logger.info("Running scheduled clearPendingHolds...");
        referralManager.clearPendingHolds();
      },
      1000 * 60 * 60
    );
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
// Restart triggered for schema sync
