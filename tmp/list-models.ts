import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../apps/voice-gateway/.env") });

async function listModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found");
    return;
  }

  console.log("Listing models for v1beta...");
  const genAI_beta = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  try {
    const models = await genAI_beta.models.list();
    console.log("Response (v1beta):", JSON.stringify(models, null, 2));
  } catch (err: any) {
    console.error("Error (v1beta):", err.message);
  }

  console.log("\nListing models for v1alpha...");
  const genAI_alpha = new GoogleGenAI({ apiKey, apiVersion: "v1alpha" });
  try {
    const models = await genAI_alpha.models.list();
    console.log("Response (v1alpha):", JSON.stringify(models, null, 2));
  } catch (err: any) {
    console.error("Error (v1alpha):", err.message);
  }
}

listModels();
