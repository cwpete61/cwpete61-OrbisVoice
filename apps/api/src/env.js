"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load .env file
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(["development", "production", "test"]).default("development"),
    PORT: zod_1.z.coerce.number().default(3000),
    DATABASE_URL: zod_1.z.string(),
    REDIS_URL: zod_1.z.string(),
    JWT_SECRET: zod_1.z.string().default("dev-secret-change-in-prod"),
    CORS_ORIGINS: zod_1.z.string().default("http://localhost:3001"),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    // Gmail API
    GMAIL_CLIENT_ID: zod_1.z.string().optional(),
    GMAIL_CLIENT_SECRET: zod_1.z.string().optional(),
    GMAIL_REDIRECT_URI: zod_1.z.string().optional(),
    GMAIL_TEST_TOKEN: zod_1.z.string().optional(),
    // Google Calendar API
    GOOGLE_CALENDAR_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CALENDAR_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_CALENDAR_REDIRECT_URI: zod_1.z.string().optional(),
    GOOGLE_CALENDAR_TEST_TOKEN: zod_1.z.string().optional(),
    // Stripe API
    STRIPE_API_KEY: zod_1.z.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.z.string().optional(),
    // Twilio API
    TWILIO_ACCOUNT_SID: zod_1.z.string().optional(),
    TWILIO_AUTH_TOKEN: zod_1.z.string().optional(),
    TWILIO_PHONE_NUMBER: zod_1.z.string().optional(),
    // Google OAuth
    GOOGLE_CLIENT_ID: zod_1.z.string().optional(),
    GOOGLE_CLIENT_SECRET: zod_1.z.string().optional(),
    GOOGLE_REDIRECT_URI: zod_1.z.string().optional(),
    WEB_URL: zod_1.z.string().default("https://myorbisvoice.com"),
});
const parsed = envSchema.parse(process.env);
// Parse CORS_ORIGINS into an array
exports.env = {
    ...parsed,
    CORS_ORIGINS: parsed.CORS_ORIGINS.split(',').map(o => o.trim()),
};
