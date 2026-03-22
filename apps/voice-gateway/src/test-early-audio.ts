
import { GoogleGenAI, Modality, Type, Tool } from "@google/genai";

async function main() {
  const apiKey = "AIzaSyByYPQX4hG8RUFplZoXo6fhfO5q0ac9zXo";
  const client = new GoogleGenAI({ apiKey });
  
  const model = "models/gemini-2.5-flash-native-audio-latest";
  console.log(`Testing IMMEDIATE AUDIO SEND before setupComplete...`);
  try {
    const session = await client.live.connect({
      model: model,
      config: {
        responseModalities: [Modality.AUDIO],
      },
      callbacks: {
        onopen: () => { console.log("✅ ONOPEN"); },
        onmessage: (msg: any) => { console.log("Received message:", JSON.stringify(msg)); },
        onclose: () => { console.log("❌ ONCLOSE"); process.exit(1); },
        onerror: (err) => { console.log("❌ ONERROR:", err); }
      }
    });

    console.log("Sending audio immediately...");
    // 100ms of silence (PCM16 16khz = 1600 samples)
    const silence = Buffer.alloc(3200, 0).toString("base64");
    
    session.sendRealtimeInput({
        media: { mimeType: "audio/pcm;rate=16000", data: silence }
    });

    setTimeout(() => { console.log("STILL UP!"); process.exit(0); }, 5000);
  } catch (e: any) {
    console.log(`❌ FAILED TO CONNECT - ${e.message}`);
    process.exit(1);
  }
}

main();
