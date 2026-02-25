/**
 * Direct Gemini call with gemini-2.5-flash (confirms model works without gateway)
 */
import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyDUA_s8zhW_xKfPA-HmSrFIo6YRgS2nbRs";

async function main() {
    const client = new GoogleGenAI({ apiKey: API_KEY });

    console.log("Testing gemini-2.5-flash directly...");
    try {
        const res = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: [{ role: "user", parts: [{ text: "Say hello!" }] }],
        });
        console.log("✅ SUCCESS:", res.text?.trim());
    } catch (e: any) {
        console.log("❌ gemini-2.5-flash failed:", e.message?.slice(0, 300));
    }

    console.log("\nTesting gemini-2.0-flash-001 directly...");
    try {
        const res = await client.models.generateContent({
            model: "gemini-2.0-flash-001",
            contents: [{ role: "user", parts: [{ text: "Say hello!" }] }],
        });
        console.log("✅ SUCCESS:", res.text?.trim());
    } catch (e: any) {
        console.log("❌ gemini-2.0-flash-001 failed:", e.message?.slice(0, 300));
    }
}

main().catch(console.error);
