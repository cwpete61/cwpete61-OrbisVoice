import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../apps/voice-gateway/.env") });

async function testGeminiLive() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("No API key found");
    return;
  }

  const genAI = new GoogleGenAI({ apiKey, apiVersion: "v1beta" });
  
  try {
    console.log("Attempting to connect to Gemini Live...");
    // @ts-ignore
    const session = await genAI.live.connect({
       model: "models/gemini-2.5-flash-native-audio-latest",
       // @ts-ignore
       config: {
         responseModalities: ["audio"] as any,
         speechConfig: {
           voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
         },
       },
      callbacks: {
        onopen: () => {
          console.log("WebSocket opened successfully!");
        },
        onmessage: (msg: any) => {
          console.log("Message received:", JSON.stringify(msg));
          if (msg.setupComplete) {
            console.log("Setup complete! Sending dummy audio...");
            session.sendRealtimeInput({
              text: "Hi!",
            });
          }
          if (msg.serverContent) {
            console.log("Server content received!");
            process.exit(0);
          }
        },
        onclose: (event: any) => {
          console.log("Connection closed.", {
            code: event.code,
            reason: event.reason,
            wasClean: event.wasClean
          });
          process.exit(1);
        },
        onerror: (err: any) => {
          console.error("Error occurred:", err);
          process.exit(1);
        }
      }
    });

    console.log("Connection initiated.");
    
    // Timeout
    setTimeout(() => {
        console.error("Connection timed out.");
        process.exit(1);
    }, 15000);

  } catch (err: any) {
    console.error("Failed to connect:");
    console.error(err.message);
    process.exit(1);
  }
}

testGeminiLive();
