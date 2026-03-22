
import { GoogleGenAI, Modality, Type, Tool } from "@google/genai";

async function main() {
  const apiKey = "AIzaSyByYPQX4hG8RUFplZoXo6fhfO5q0ac9zXo";
  const client = new GoogleGenAI({ apiKey });
  
  const COMMERCE_TOOLS: Tool[] = [
    {
      functionDeclarations: [
        { name: "get_cart", description: "Cart", parameters: { type: Type.OBJECT, properties: {} } },
        { name: "add_to_cart", description: "Add", parameters: { type: Type.OBJECT, properties: { productId: { type: Type.STRING } }, required: ["productId"] } },
        { name: "clear_cart", description: "Clear", parameters: { type: Type.OBJECT, properties: {} } },
        { name: "list_products", description: "List", parameters: { type: Type.OBJECT, properties: {} } },
        { name: "search_products", description: "Search", parameters: { type: Type.OBJECT, properties: { query: { type: Type.STRING } }, required: ["query"] } },
        { name: "remove_from_cart", description: "Remove", parameters: { type: Type.OBJECT, properties: { productId: { type: Type.STRING } }, required: ["productId"] } },
        { name: "create_checkout_session", description: "Checkout", parameters: { type: Type.OBJECT, properties: { priceId: { type: Type.STRING } } } },
        { name: "send_sms", description: "SMS", parameters: { type: Type.OBJECT, properties: { to: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["to", "message"] } },
        { name: "make_call", description: "Call", parameters: { type: Type.OBJECT, properties: { to: { type: Type.STRING }, message: { type: Type.STRING } }, required: ["to", "message"] } },
      ],
    },
  ];

  const model = "models/gemini-2.5-flash-native-audio-latest";
  console.log(`Testing ALL COMMERCE TOOLS...`);
  try {
    const session = await client.live.connect({
      model: model,
      config: {
        responseModalities: [Modality.AUDIO],
        tools: COMMERCE_TOOLS,
      },
      callbacks: {
        onopen: () => { console.log("✅ ONOPEN"); },
        onmessage: (msg) => { console.log("Received message:", JSON.stringify(msg).slice(0, 50)); },
        onclose: () => { console.log("❌ ONCLOSE"); process.exit(1); },
        onerror: (err) => { console.log("❌ ONERROR:", err); process.exit(1); }
      }
    });

    setTimeout(() => { console.log("STILL UP WITH ALL TOOLS!"); process.exit(0); }, 5000);
  } catch (e: any) {
    console.log(`❌ FAILED TO CONNECT - ${e.message}`);
    process.exit(1);
  }
}

main();
