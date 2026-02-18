"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const WebSocket = __importStar(require("ws"));
const uuid_1 = require("uuid");
const env_1 = require("./env");
const logger_1 = require("./logger");
const gemini_client_1 = require("./services/gemini-client");
class VoiceGateway {
    constructor(port) {
        this.clients = new Map();
        this.wss = new WebSocket.Server({ port });
        this.setupListeners();
    }
    setupListeners() {
        this.wss.on("connection", (ws, req) => {
            const sessionId = (0, uuid_1.v4)();
            logger_1.logger.info({ sessionId }, "Client connected");
            ws.on("message", (data) => {
                try {
                    const message = JSON.parse(data.toString());
                    this.handleMessage(ws, message, sessionId);
                }
                catch (err) {
                    logger_1.logger.error({ err }, "Failed to parse message");
                    ws.send(JSON.stringify({ error: "Invalid message format" }));
                }
            });
            ws.on("close", () => {
                logger_1.logger.info({ sessionId }, "Client disconnected");
                this.clients.delete(sessionId);
            });
            ws.on("error", (err) => {
                logger_1.logger.error({ err, sessionId }, "WebSocket error");
            });
        });
    }
    async handleMessage(ws, message, sessionId) {
        if (message.type === "control") {
            if (message.data === "init") {
                const client = {
                    sessionId,
                    userId: "test-user", // TODO: extract from JWT header
                    agentId: "test-agent", // TODO: extract from message
                    connectedAt: new Date(),
                };
                this.clients.set(sessionId, client);
                logger_1.logger.info({ client }, "Client initialized");
                ws.send(JSON.stringify({ ok: true, message: "Session initialized", sessionId }));
            }
        }
        else if (message.type === "audio") {
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
            }
            catch (err) {
                logger_1.logger.error({ err }, "Failed to process audio");
                ws.send(JSON.stringify({ error: "Failed to process audio", details: String(err) }));
            }
        }
        else if (message.type === "text") {
            const client = this.clients.get(sessionId);
            if (!client) {
                ws.send(JSON.stringify({ error: "Session not initialized" }));
                return;
            }
            try {
                // For text input, synthesize to audio then process
                const response = await gemini_client_1.geminiVoiceClient.processText(message.data, client.agentId);
                ws.send(JSON.stringify({
                    type: "text",
                    data: response.text,
                    audioData: response.audioData,
                }));
            }
            catch (err) {
                logger_1.logger.error({ err }, "Failed to process text");
                ws.send(JSON.stringify({ error: "Failed to process text", details: String(err) }));
            }
        }
    }
    async forwardToGemini(audioData, agentId) {
        // TODO: Fetch agent details from API using agentId
        // TODO: Get system prompt from agent
        // TODO: Get tool definitions from agent
        // TODO: Handle tool calls and stream results back to client
        const systemPrompt = "You are a helpful AI assistant with access to various tools.";
        try {
            // For now, process without tools. Phase 4.5 will integrate tool definitions and execution
            return await gemini_client_1.geminiVoiceClient.processAudio(audioData, systemPrompt);
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
        }
        catch (err) {
            logger_1.logger.error({ err, agentId }, "Gemini processing failed");
            // Return stub response on error
            return {
                outputAudio: { data: audioData }, // Echo for testing
                text: "I encountered an error processing your message.",
            };
        }
    }
    start() {
        logger_1.logger.info({ port: env_1.env.PORT }, "Voice Gateway running");
    }
}
const gateway = new VoiceGateway(env_1.env.PORT);
gateway.start();
