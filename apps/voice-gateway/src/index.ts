import * as WebSocket from "ws";
// @ts-ignore - uuid types
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
          userId: "test-user", // TODO: extract from JWT header
          agentId: "test-agent", // TODO: extract from message
          connectedAt: new Date(),
        };
        this.clients.set(sessionId, client);
        logger.info({ client }, "Client initialized");
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
        const response = await this.forwardToGemini(message.data, client.agentId);
        
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
        const response = await geminiVoiceClient.processText(message.data, client.agentId);
        
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

  private async forwardToGemini(audioData: string, agentId: string): Promise<GeminiResponse> {
    // TODO: Fetch agent details from API using agentId
    // TODO: Get system prompt from agent
    // TODO: Get tool definitions from agent
    // TODO: Handle tool calls and stream results back to client
    
    const systemPrompt = "You are a helpful AI assistant with access to various tools.";
    
    try {
      // For now, process without tools. Phase 4.5 will integrate tool definitions and execution
      return await geminiVoiceClient.processAudio(audioData, systemPrompt);
      
      // Future: Tool execution flow
      // const toolDefs = await fetchToolDefinitions(agentId);
      // const geminiResponse = await geminiVoiceClient.processAudio(audioData, systemPrompt, toolDefs);
      // if (geminiResponse.toolCalls?.length > 0) {
      //   const toolResults = await geminiVoiceClient.executeToolCalls(geminiResponse.toolCalls, {
      //     agentId,
      //     userId: client.userId,
      //     tenantId: client.tenantId,
      //     sessionId: client.sessionId,
      //   });
      //   // Send tool results back to Gemini for follow-up response
      //   // return await geminiVoiceClient.processWithToolResults(toolResults, ...);
      // }
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

