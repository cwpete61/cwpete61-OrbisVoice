import * as WebSocket from "ws";
import * as jwt from "jsonwebtoken";
// @ts-expect-error - uuid types
import { v4 as uuidv4 } from "uuid";
import { env } from "./env";
import { logger } from "./logger";
import { GatewayClient, AudioMessage, GeminiResponse } from "./types";
import { geminiVoiceClient } from "./services/gemini-client";

class VoiceGateway {
  private wss: WebSocket.Server;
  private clients: Map<string, GatewayClient> = new Map();

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    this.setupListeners();
  }

  private setupListeners() {
    this.wss.on("connection", (ws) => {
      const sessionId = uuidv4();
      logger.info({ sessionId }, "Client connected");

      ws.on("message", (data) => {
        try {
          const message: AudioMessage = JSON.parse(data.toString());
          this.handleMessage(ws, message, sessionId);
        } catch (err) {
          logger.error({ err }, "Failed to parse message");
          ws.send(JSON.stringify({ error: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        logger.info({ sessionId }, "Client disconnected");
        this.clients.delete(sessionId);
      });

      ws.on("error", (err) => {
        logger.error({ err, sessionId }, "WebSocket error");
      });
    });
  }

  private async handleMessage(
    ws: WebSocket.WebSocket,
    message: AudioMessage,
    sessionId: string
  ) {
    if (message.type === "control") {
      if (message.data.startsWith("{")) {
        // Handle init with JSON payload containing token
        try {
          const payload = JSON.parse(message.data);
          if (payload.event === "init" && payload.token) {
            const token = payload.token;

            // Fetch config from API
            let apiKey: string | undefined;
            try {
              const response = await fetch(`${env.API_URL}/settings/google-config?include_secrets=true`, {
                headers: {
                  Authorization: `Bearer ${token}`
                }
              });

              if (response.status === 401) {
                ws.send(JSON.stringify({ error: "Unauthorized" }));
                return;
              }

              if (response.ok) {
                const configResponse = await response.json() as any;
                if (configResponse.ok && configResponse.data) {
                  apiKey = configResponse.data.geminiApiKey;
                }
              }
            } catch (err) {
              logger.error({ err }, "Failed to fetch config");
            }

            // Decode token to get userId/agentId
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.userId) {
              ws.send(JSON.stringify({ error: "Invalid token" }));
              return;
            }

            const client: GatewayClient = {
              sessionId,
              userId: decoded.userId,
              agentId: decoded.agentId || "default-agent", // Fallback
              connectedAt: new Date(),
              apiKey: apiKey, // Will be undefined for now, using global fallback
            };

            this.clients.set(sessionId, client);
            logger.info({ sessionId, userId: client.userId }, "Client initialized");
            ws.send(JSON.stringify({ ok: true, message: "Session initialized", sessionId }));
          }
        } catch (e) {
          logger.error({ err: e }, "Failed to handle init message");
          ws.send(JSON.stringify({ error: "Initialization failed" }));
        }
      } else if (message.data === "init") {
        // Legacy/Test init
        const client: GatewayClient = {
          sessionId,
          userId: "test-user", // TODO: extract from JWT header
          agentId: "test-agent", // TODO: extract from message
          connectedAt: new Date(),
        };
        this.clients.set(sessionId, client);
        logger.info({ client }, "Client initialized (test mode)");
        ws.send(JSON.stringify({ ok: true, message: "Session initialized", sessionId }));
      }
    } else if (message.type === "audio") {
      const client = this.clients.get(sessionId);
      if (!client) {
        ws.send(JSON.stringify({ error: "Session not initialized" }));
        return;
      }

      try {
        // Forward to Gemini API
        const response = await this.forwardToGemini(message.data, client.agentId, client.apiKey);

        // Send response back to client
        ws.send(JSON.stringify({
          type: "audio",
          data: response.outputAudio?.data || "",
          text: response.text,
        }));
      } catch (err) {
        logger.error({ err }, "Failed to process audio");
        ws.send(JSON.stringify({ error: "Failed to process audio", details: String(err) }));
      }
    } else if (message.type === "text") {
      const client = this.clients.get(sessionId);
      if (!client) {
        ws.send(JSON.stringify({ error: "Session not initialized" }));
        return;
      }

      try {
        // For text input, synthesize to audio then process
        const response = await geminiVoiceClient.processText(client.apiKey, message.data, client.agentId);

        ws.send(JSON.stringify({
          type: "text",
          data: response.text,
          audioData: response.audioData,
        }));
      } catch (err) {
        logger.error({ err }, "Failed to process text");
        ws.send(JSON.stringify({ error: "Failed to process text", details: String(err) }));
      }
    }
  }

  private async forwardToGemini(audioData: string, agentId: string, apiKey?: string): Promise<GeminiResponse> {
    // TODO: Fetch agent details from API using agentId
    // TODO: Get system prompt from agent
    // TODO: Get tool definitions from agent
    // TODO: Handle tool calls and stream results back to client

    const systemPrompt = "You are a helpful AI assistant with access to various tools.";

    try {
      // For now, process without tools. Phase 4.5 will integrate tool definitions and execution
      return await geminiVoiceClient.processAudio(apiKey, audioData, systemPrompt);
    } catch (err) {
      logger.error({ err, agentId }, "Gemini processing failed");
      // Return stub response on error
      return {
        outputAudio: { data: audioData }, // Echo for testing
        text: "I encountered an error processing your message.",
      };
    }
  }

  start() {
    logger.info({ port: env.PORT }, "Voice Gateway running");
  }
}

const gateway = new VoiceGateway(env.PORT);
gateway.start();

