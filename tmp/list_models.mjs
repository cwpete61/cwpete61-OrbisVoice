import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(process.cwd(), "apps/voice-gateway/.env") });

const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY || "");

async function listModels() {
  try {
    const models = await genAI.listModels();
    console.log("Available Models:");
    for (const model of models) {
      console.log(`- ${model.name}`);
    }
  } catch (err) {
    console.error("Error listing models:", err);
  }
}

listModels();
