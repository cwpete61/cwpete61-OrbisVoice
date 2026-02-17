import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import { env } from "./env";
import { logger } from "./logger";
import { authRoutes } from "./routes/auth";
import { agentRoutes } from "./routes/agents";
import { apiKeyRoutes } from "./routes/api-keys";

const fastify = Fastify({
  logger: logger.child({ context: "fastify" }),
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

// Health check endpoint
fastify.get("/health", async (request, reply) => {
  return { status: "ok", timestamp: new Date().toISOString() };
});

// Base API endpoint
fastify.get("/api", async (request, reply) => {
  return { message: "OrbisVoice API v1", version: "1.0.0" };
});

// Register route groups
fastify.register(authRoutes);
fastify.register(agentRoutes);
fastify.register(apiKeyRoutes);

// Start server
const start = async () => {
  try {
    await fastify.listen({ port: env.PORT, host: "0.0.0.0" });
    logger.info(`Server running at http://0.0.0.0:${env.PORT}`);
  } catch (err) {
    logger.error(err);
    process.exit(1);
  }
};

start();
