import * as WebSocket from "ws";
import { v4 as uuidv4 } from "uuid";
import { env } from "./env";
import { logger } from "./logger";
import { GatewayClient, AudioMessage, GeminiResponse } from "./types";

class VoiceGateway {
  private wss: WebSocket.Server;
  private clients: Map<string, GatewayClient> = new Map();

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port });
    this.setupListeners();
  }

  private setupListeners() {
    this.wss.on("connection", (ws, req) => {
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
      if (message.data === "init") {
        const client: GatewayClient = {
          sessionId,
          userId: "test-user", // TODO: extract from JWT
          agentId: "test-agent", // TODO: extract from client
          connectedAt: new Date(),
        };
        this.clients.set(sessionId, client);
        ws.send(JSON.stringify({ ok: true, message: "Session initialized" }));
      }
    } else if (message.type === "audio") {
      // Forward to Gemini API
      const response = await this.forwardToGemini(message.data);
      ws.send(JSON.stringify({ type: "audio", data: response.outputAudio?.data }));
    }
  }

  private async forwardToGemini(audioData: string): Promise<GeminiResponse> {
    // TODO: Implement actual Gemini Voice API call
    // For now, return stub response
    logger.debug("Forwarding to Gemini API");
    return {
      outputAudio: {
        data: audioData, // Echo for testing
      },
    };
  }

  start() {
    logger.info({ port: env.PORT }, "Voice Gateway running");
  }
}

const gateway = new VoiceGateway(env.PORT);
gateway.start();
