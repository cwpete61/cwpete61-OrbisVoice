
import { GoogleGenAI, Modality, Type, Tool } from "@google/genai";

async function main() {
  const apiKey = "AIzaSyByYPQX4hG8RUFplZoXo6fhfO5q0ac9zXo";
  const client = new GoogleGenAI({ apiKey });
  
  const COMMERCE_TOOLS: Tool[] = [
    {
      functionDeclarations: [
        {
          name: "get_cart",
          description: "Get the current items in the user's shopping cart.",
          parameters: { type: Type.OBJECT, properties: {} },
        },
        {
          name: "add_to_cart",
          description: "Add a product to the user's shopping cart.",
          parameters: {
            type: Type.OBJECT,
            properties: {
              productId: { type: Type.STRING, description: "ID" },
              quantity: { type: Type.NUMBER, description: "Qty" },
            },
            required: ["productId"],
          },
        },
      ],
    },
  ];

  const model = "models/gemini-2.5-flash-native-audio-latest";
  console.log(`Testing ${model} with TOOLS...`);
  try {
    const session = await client.live.connect({
      model: model,
      config: {
        responseModalities: [Modality.AUDIO],
        tools: COMMERCE_TOOLS,
      },
      callbacks: {
        onopen: () => { console.log("✅ ONOPEN"); },
        onmessage: (msg: any) => { console.log("Received message:", JSON.stringify(msg)); },
        onclose: () => { console.log("❌ ONCLOSE"); process.exit(1); },
        onerror: (err) => { console.log("❌ ONERROR:", err); process.exit(1); }
      }
    });

    setTimeout(() => { console.log("STILL UP WITH TOOLS!"); process.exit(0); }, 5000);
  } catch (e: any) {
    console.log(`❌ FAILED TO CONNECT - ${e.message}`);
    process.exit(1);
  }
}

main();
