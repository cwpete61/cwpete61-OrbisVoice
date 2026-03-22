import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../apps/voice-gateway/.env") });

async function testGemini() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found");
    return;
  }

  const genAI = new GoogleGenAI({ apiKey });
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  try {
    const result = await model.generateContent("Hello!");
    console.log("Gemini API Check: OK");
    console.log("Response:", result.response.text());
  } catch (err: any) {
    console.error("Gemini API Check: FAILED");
    console.error(err.message);
  }
}

testGemini();
