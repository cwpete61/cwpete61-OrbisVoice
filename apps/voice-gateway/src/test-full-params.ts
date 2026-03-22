
import { GoogleGenAI, Modality, Type, Tool } from "@google/genai";

async function main() {
  const apiKey = "AIzaSyByYPQX4hG8RUFplZoXo6fhfO5q0ac9zXo";
  const client = new GoogleGenAI({ apiKey });
  
  const systemPrompt = "You are an appointment scheduling assistant. Your goal is to help leads and customers book appointments with our team. Collect their name, contact information, preferred date and time, and the purpose of the meeting. Confirm all details before finalizing. Be professional, efficient, and friendly throughout the process.";

  const model = "models/gemini-2.5-flash-native-audio-latest";
  console.log(`Testing with FULL PROMPT and ALL TOOLS...`);
  try {
    const session = await client.live.connect({
      model: model,
      config: {
        responseModalities: [Modality.AUDIO],
        systemInstruction: { parts: [{ text: systemPrompt }] },
        tools: [ { functionDeclarations: [ { name: "get_cart", description: "Cart", parameters: { type: Type.OBJECT, properties: {} } } ] } ],
      },
      callbacks: {
        onopen: () => { console.log("✅ ONOPEN"); },
        onmessage: (msg) => { console.log("Received message:", JSON.stringify(msg).slice(0, 50)); },
        onclose: () => { console.log("❌ ONCLOSE"); process.exit(1); },
        onerror: (err) => { console.log("❌ ONERROR:", err); process.exit(1); }
      }
    });

    setTimeout(() => { console.log("STILL UP!"); process.exit(0); }, 5000);
  } catch (e: any) {
    console.log(`❌ FAILED TO CONNECT - ${e.message}`);
    process.exit(1);
  }
}

main();
