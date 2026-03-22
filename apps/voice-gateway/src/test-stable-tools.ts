
import { GoogleGenAI, Modality, Type, Tool } from "@google/genai";

async function main() {
  const apiKey = "AIzaSyByYPQX4hG8RUFplZoXo6fhfO5q0ac9zXo";
  const client = new GoogleGenAI({ apiKey });
  
  const SINGLE_TOOL: Tool[] = [
    {
      functionDeclarations: [
        {
          name: "get_weather",
          description: "Get weather",
          parameters: { 
            type: Type.OBJECT, 
            properties: { 
                location: { type: Type.STRING, description: "City" } 
            },
            required: ["location"]
          },
        },
      ],
    },
  ];

  const model = "models/gemini-2.5-flash-native-audio-latest";
  console.log(`Testing with ONE TOOL and CALLBACKS...`);
  try {
    const session = await client.live.connect({
      model: model,
      config: {
        responseModalities: [Modality.AUDIO],
        tools: SINGLE_TOOL,
      },
      callbacks: {
        onopen: () => { console.log("✅ ONOPEN"); },
        onmessage: (msg) => { console.log("Received message:", JSON.stringify(msg)); },
        onclose: () => { console.log("❌ ONCLOSE"); process.exit(1); },
        onerror: (err) => { console.log("❌ ONERROR:", err); process.exit(1); }
      }
    });

    setTimeout(() => { console.log("STILL UP AFTER 5S"); process.exit(0); }, 5000);
  } catch (e: any) {
    console.log(`❌ FAILED TO CONNECT - ${e.message}`);
    process.exit(1);
  }
}

main();
