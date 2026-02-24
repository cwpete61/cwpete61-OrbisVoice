import { z } from "zod";
import dotenv from "dotenv";

// Load .env file
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(4001),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().default("dev-secret-change-in-prod"),
  CORS_ORIGINS: z.string().default("http://localhost:3001"),
  GEMINI_API_KEY: z.string().optional(),
  // Gmail API
  GMAIL_CLIENT_ID: z.string().optional(),
  GMAIL_CLIENT_SECRET: z.string().optional(),
  GMAIL_REDIRECT_URI: z.string().optional(),
  GMAIL_TEST_TOKEN: z.string().optional(),
  // Google Calendar API
  GOOGLE_CALENDAR_CLIENT_ID: z.string().optional(),
  GOOGLE_CALENDAR_CLIENT_SECRET: z.string().optional(),
  GOOGLE_CALENDAR_REDIRECT_URI: z.string().optional(),
  GOOGLE_CALENDAR_TEST_TOKEN: z.string().optional(),
  // Stripe API
  STRIPE_API_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  // Twilio API
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  // Google OAuth
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  WEB_URL: z.string().default("https://myorbisvoice.com"),
  // Email System
  EMAIL_PROVIDER: z.enum(["console", "sendgrid", "resend"]).default("console"),
  SENDGRID_API_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@orbisvoice.app"),
  EMAIL_FROM_NAME: z.string().default("OrbisVoice"),
  // Firebase Configuration
  FIREBASE_PROJECT_ID: z.string().optional(),
  FIREBASE_CLIENT_EMAIL: z.string().optional(),
  FIREBASE_PRIVATE_KEY: z.string().optional(),
  RECAPTCHA_SECRET_KEY: z.string().optional(),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:", result.error.format());
  // If parsing fails, we fallback to a partial/unsafe parse to avoid crashing the whole process
  // This is better than a 502 Bad Gateway during initial setup.
}

const parsed = result.success ? result.data : (process.env as any);

// Log warnings for missing critical keys in production
if (parsed.NODE_ENV === "production") {
  const missingKeys = [];
  if (!parsed.STRIPE_API_KEY) missingKeys.push("STRIPE_API_KEY");
  if (!parsed.STRIPE_WEBHOOK_SECRET) missingKeys.push("STRIPE_WEBHOOK_SECRET");
  if (!parsed.GOOGLE_CLIENT_ID) missingKeys.push("GOOGLE_CLIENT_ID");
  if (!parsed.GOOGLE_CLIENT_SECRET) missingKeys.push("GOOGLE_CLIENT_SECRET");
  if (!parsed.GEMINI_API_KEY) missingKeys.push("GEMINI_API_KEY");

  if (missingKeys.length > 0) {
    console.warn("\n⚠️  WARNING: Missing production environment variables:");
    missingKeys.forEach(key => console.warn(`   - ${key}`));
    console.warn("Some features (Payment, Login, AI) may not work correctly.\n");
  }
}

// Parse CORS_ORIGINS into an array
const corsOriginsStr = parsed.CORS_ORIGINS || "http://localhost:3000";
const corsOrigins = typeof corsOriginsStr === 'string'
  ? corsOriginsStr.split(',').map((o: string) => o.trim())
  : corsOriginsStr;

export const env = {
  ...parsed,
  PORT: Number(parsed.PORT || 4001),
  CORS_ORIGINS: corsOrigins,
};
