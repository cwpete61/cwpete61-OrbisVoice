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
}).refine((data) => {
  if (data.NODE_ENV === "production") {
    return !!data.STRIPE_API_KEY && !!data.STRIPE_WEBHOOK_SECRET &&
      !!data.GOOGLE_CLIENT_ID && !!data.GOOGLE_CLIENT_SECRET &&
      !!data.GEMINI_API_KEY;
  }
  return true;
}, {
  message: "Production environment requires STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GEMINI_API_KEY",
});

const parsed = envSchema.parse(process.env);

// Parse CORS_ORIGINS into an array
export const env = {
  ...parsed,
  CORS_ORIGINS: parsed.CORS_ORIGINS.split(',').map(o => o.trim()),
};
