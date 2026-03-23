import { config } from "dotenv";
import { z } from "zod";

config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().transform(Number).default(4010),
  API_URL: z.string().url().default("http://localhost:4001"),
  COMMERCE_URL: z.string().url().default("http://localhost:4006"),
  GEMINI_API_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(1),
  APP_ENVIRONMENT: z.enum(["development", "staging", "production"]).default("development"),
  RUNTIME_POLICY_ENABLED: z.string().transform((v) => v === "true").default(false),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
