import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve("apps/voice-gateway/.env") });

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY not found in apps/voice-gateway/.env");
  process.exit(1);
}

const client = new GoogleGenAI({ apiKey });
const model = "gemini-2.0-flash";

async function run() {
  console.log(`Connecting to ${model}...`);
  try {
    const session = await client.live.connect({
       model,
       config: {
         systemInstruction: { parts: [{ text: "You are a test assistant." }] }
       }
    });
    
    console.log("Connected successfully!");
    
    session.on("message", (msg) => {
      console.log("Received:", JSON.stringify(msg, null, 2));
      if (msg.setupComplete) {
        console.log("Setup complete, closing test.");
        session.close();
        process.exit(0);
      }
    });

    session.on("error", (err) => {
      console.error("Session error:", err);
      process.exit(1);
    });

    session.on("close", (ev) => {
      console.log("Session closed:", ev);
      process.exit(0);
    });

  } catch (err) {
    console.error("Connect error:", err);
    process.exit(1);
  }
}

run();
