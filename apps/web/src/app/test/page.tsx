"use client";

import { useState, useEffect, useRef } from "react";
import PublicNav from "../components/PublicNav";
import Footer from "../components/Footer";

export default function TestPage() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [input, setInput] = useState("");
  const wsRef = useRef<WebSocket | null>(null);

  const connectWebSocket = () => {
    const ws = new WebSocket(process.env.NEXT_PUBLIC_VOICE_GATEWAY_URL || "ws://localhost:4001");

    ws.onopen = () => {
      console.log("[WebSocket] Connected");
      setConnected(true);
      setMessages(["✓ Connected to voice gateway"]);

      // Send init message
      ws.send(JSON.stringify({ type: "control", data: "init", timestamp: Date.now(), sessionId: "test" }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("[WebSocket] Message:", message);
      setMessages((prev) => [
        ...prev,
        `← ${message.message || message.type}: ${JSON.stringify(message.data || message).substring(0, 50)}...`,
      ]);
    };

    ws.onerror = (err) => {
      console.error("[WebSocket] Error:", err);
      setMessages((prev) => [...prev, "✗ WebSocket error"]);
    };

    ws.onclose = () => {
      console.log("[WebSocket] Disconnected");
      setConnected(false);
      setMessages((prev) => [...prev, "✗ Disconnected"]);
    };

    wsRef.current = ws;
  };

  const disconnect = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || !wsRef.current) return;

    const msg = {
      type: "text",
      data: input,
      timestamp: Date.now(),
      sessionId: "test",
    };

    wsRef.current.send(JSON.stringify(msg));
    setMessages((prev) => [...prev, `→ ${input}`]);
    setInput("");
  };

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#05080f] text-[#f0f4fa]">
      <PublicNav />
      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-mist mb-6">WebSocket Test Console</h1>

        {/* Connection Status */}
        <div className="bg-slate/20 border border-slate rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                connected ? "bg-aurora-green" : "bg-plasma-orange"
              }`}
            />
            <span className="text-mist font-semibold">
              {connected ? "Connected" : "Disconnected"}
            </span>
            {process.env.NEXT_PUBLIC_VOICE_GATEWAY_URL && (
              <span className="text-slate text-sm ml-4">
                ({process.env.NEXT_PUBLIC_VOICE_GATEWAY_URL})
              </span>
            )}
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={connectWebSocket}
            disabled={connected}
            className="bg-signal-cyan text-orbit-blue px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            Connect
          </button>
          <button
            onClick={disconnect}
            disabled={!connected}
            className="bg-plasma-orange/20 text-plasma-orange px-4 py-2 rounded font-semibold disabled:opacity-50"
          >
            Disconnect
          </button>
        </div>

        {/* Message Log */}
        <div className="bg-orbit-blue/30 border border-slate rounded-lg p-4 h-64 overflow-y-auto mb-4 font-mono text-sm">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`py-1 ${msg.startsWith("→") ? "text-signal-cyan" : msg.startsWith("✓") ? "text-aurora-green" : msg.startsWith("✗") ? "text-plasma-orange" : "text-slate"}`}
            >
              {msg}
            </div>
          ))}
        </div>

        {/* Message Input */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a test message..."
            disabled={!connected}
            className="flex-1 bg-orbit-blue border border-slate px-4 py-2 rounded text-mist placeholder-slate focus:outline-none focus:border-signal-cyan disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!connected || !input}
            className="bg-signal-cyan text-orbit-blue px-6 py-2 rounded font-semibold disabled:opacity-50"
          >
            Send
          </button>
        </form>

        <p className="text-slate text-sm mt-4">
          Use this console to test WebSocket connections to the voice gateway. Messages sent here
          will be echoed back (for testing only).
        </p>
      </div>
      <Footer />
    </div>
  );
}
