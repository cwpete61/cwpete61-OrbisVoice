/**
 * Smoke test for the OrbisVoice voice gateway.
 * Connects via WebSocket, initializes a session, sends a text message, verifies a response.
 */
import WebSocket from "ws";

const TOKEN_URL = "http://localhost:4001/auth/login";
const WS_URL = "ws://localhost:4005";

async function getToken(): Promise<string> {
    const res = await fetch(TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "myorbislocal@gmail.com", password: "Orbis@8214@@!!" }),
    });
    const data = await res.json() as any;
    if (!res.ok) throw new Error(`Login failed: ${data.message}`);
    return data.data.token;
}

async function main() {
    console.log("🔐 Logging in to get JWT token...");
    const token = await getToken();
    console.log("✅ Got JWT token");

    return new Promise<void>((resolve, reject) => {
        const ws = new WebSocket(WS_URL);
        let initialized = false;

        ws.on("open", () => {
            console.log("🌐 Connected to Voice Gateway at", WS_URL);

            // Send init message with JWT token
            ws.send(JSON.stringify({
                type: "control",
                data: JSON.stringify({ event: "init", token }),
            }));
        });

        ws.on("message", (raw) => {
            const msg = JSON.parse(raw.toString()) as any;

            if (!initialized) {
                if (msg.ok) {
                    console.log("✅ Session initialized:", msg.message, "| Session ID:", msg.sessionId);
                    initialized = true;

                    // Send a test text message
                    console.log("💬 Sending test text to Gemini...");
                    ws.send(JSON.stringify({
                        type: "text",
                        data: "Hello! What can you do for me?",
                    }));
                } else {
                    console.error("❌ Init failed:", msg.error);
                    ws.close();
                    reject(new Error("Init failed"));
                }
                return;
            }

            // Handle Gemini text response
            if (msg.type === "text") {
                console.log("\n🤖 Gemini Response:");
                console.log("   Text:", msg.data);
                console.log("\n✅ Voice Gateway is fully operational!\n");
                ws.close();
                resolve();
            } else if (msg.error) {
                console.error("❌ Error from gateway:", msg.error, msg.details || "");
                ws.close();
                reject(new Error(msg.error));
            }
        });

        ws.on("error", (err) => {
            console.error("❌ WebSocket error:", err.message);
            reject(err);
        });

        ws.on("close", () => {
            console.log("🔌 Connection closed");
        });

        // Timeout after 30 seconds
        setTimeout(() => {
            ws.close();
            reject(new Error("Test timed out after 30s"));
        }, 30000);
    });
}

main().catch((err) => {
    console.error("Test failed:", err.message);
    process.exit(1);
});
