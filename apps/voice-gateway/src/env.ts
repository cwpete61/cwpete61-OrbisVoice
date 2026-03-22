import { config } from "dotenv";

config();

export const env = {
  NODE_ENV: (process.env.NODE_ENV || "development") as "development" | "production",
  PORT: parseInt(process.env.PORT || "4010"),
  API_URL: process.env.API_URL || "http://localhost:4001",
  COMMERCE_URL: process.env.COMMERCE_URL || "http://localhost:4006",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
};
