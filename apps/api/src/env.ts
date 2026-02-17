import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().default("dev-secret-change-in-prod"),
  CORS_ORIGINS: z.string().default("http://localhost:3001"),
  GEMINI_API_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
