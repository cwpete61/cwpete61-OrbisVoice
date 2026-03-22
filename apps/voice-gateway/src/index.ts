import * as WebSocket from "ws";
import * as jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { env } from "./env";
import { logger } from "./logger";
import { GatewayClient, AudioMessage, GeminiResponse } from "./types";
import { geminiVoiceClient } from "./services/gemini-client";
import { ALL_VOICE_TOOL_NAMES, buildToolsForNames, COMMERCE_TOOLS } from "./services/tools";
import { ToolExecutor } from "./services/tool-executor";

class VoiceGateway {
  private wss: WebSocket.Server;
  private clients: Map<string, GatewayClient> = new Map();

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port, host: "0.0.0.0" });
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

      ws.on("close", async () => {
        const client = this.clients.get(sessionId);
        if (client) {
          logger.info({ sessionId }, "Client disconnected, Cleaning up");
          if (client.liveSession) {
            try {
              client.liveSession.close();
            } catch (e) {
              logger.warn({ sessionId }, "Error closing live session");
            }
          }

          // 1. Record Transcript & Usage
          const durationLimitSeconds = 3600; // 1 hour max for safety
          const duration = Math.min(
            durationLimitSeconds,
            Math.floor((Date.now() - client.startTime) / 1000)
          );

          if (client.transcript && client.token) {
            logger.info({ sessionId, duration }, "Saving transcript to API");
            try {
              await fetch(`${env.API_URL}/transcripts`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${client.token}`,
                },
                body: JSON.stringify({
                  agentId: client.agentId,
                  content: client.transcript,
                  duration: duration,
                }),
              });
            } catch (err) {
              logger.error({ err, sessionId }, "Failed to save transcript to API");
            }
          }

          this.clients.delete(sessionId);
        }
      });

      ws.on("error", (err) => {
        logger.error({ err, sessionId }, "WebSocket error");
      });
    });
  }

  private async handleMessage(ws: WebSocket.WebSocket, message: AudioMessage, sessionId: string) {
    logger.info({ type: message.type, data: message.data?.slice(0, 100), sessionId }, "Incoming message from client");
    if (message.type === "control") {
      if (message.data.startsWith("{")) {
        // Handle init with JSON payload containing token
        try {
          const payload = JSON.parse(message.data);
          if (payload.event === "init" && payload.token) {
            const token = payload.token;

            // Fetch config from API (Google API Keys)
            let apiKey: string | undefined;
            try {
              const response = await fetch(
                `${env.API_URL}/settings/google-config?include_secrets=true`,
                {
                  headers: {
                    Authorization: `Bearer ${token}`,
                  },
                }
              );

              if (response.status === 401) {
                ws.send(JSON.stringify({ error: "Unauthorized" }));
                return;
              }

              if (response.ok) {
                const configResponse = (await response.json()) as any;
                if (configResponse.ok && configResponse.data) {
                  apiKey = configResponse.data.geminiApiKey;
                }
              }
            } catch (err) {
              logger.error({ err }, "Failed to fetch google config");
            }

            // Decode token to get userId/agentId
            const decoded = jwt.decode(token) as any;
            if (!decoded || !decoded.userId) {
              ws.send(JSON.stringify({ error: "Invalid token" }));
              return;
            }

            const agentId = payload.agentId || decoded.agentId || "default-agent";

            // Fetch Agent specific config (System Prompt, Voice)
            let systemPrompt = "You are a helpful AI assistant.";
            let voiceName = "Charon";
            try {
              const agentRes = await fetch(`${env.API_URL}/agents/${agentId}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              });
              
              const agentData = agentRes.ok ? ((await agentRes.json()) as any).data : null;
              if (agentData) {
                systemPrompt = agentData.systemPrompt || systemPrompt;
              }

              // Preference order for selection: 1. Manual payload override (frontend) 2. Database 3. Defaults
              const rawVoiceId = payload.voiceId || agentData?.voiceId || agentData?.voiceModel || "aoede";
              const voiceGender = payload.voiceGender || agentData?.voiceGender || "MALE";
                  
                  // Mapping all 13 possible UI voices to the 5 actual Gemini prebuilt voices
                  const voiceMapping: Record<string, string> = {
                    // Females -> Aoede or Kore
                    aoede: "Aoede",
                    autonoe: "Aoede",
                    callirrhoe: "Aoede",
                    kore: "Kore",
                    leda: "Kore",
                    zephyr: "Aoede",
                    
                    // Males -> Charon, Fenrir or Puck
                    charon: "Charon",
                    enceladus: "Charon",
                    fenrir: "Fenrir",
                    lapetus: "Charon",
                    orus: "Puck",
                    puck: "Puck",
                    umbriel: "Puck",
                    
                    // Old mapping support
                    default: voiceGender === "FEMALE" ? "Aoede" : "Charon",
                    professional: "Kore",
                    friendly: "Aoede",
                    concise: "Charon",
                  };
                  
                  voiceName = voiceMapping[rawVoiceId.toLowerCase()] || (voiceGender === "FEMALE" ? "Aoede" : "Charon");
            } catch (err) {
              logger.error({ err, agentId }, "Failed to fetch agent config, using defaults");
            }

            // Establish Gemini Multimodal Live Session
            let liveSession: any;
            try {
              logger.info({ 
                model: "gemini-2.5-flash-native-audio-latest", 
                apiKeySet: !!apiKey,
                voiceName,
                sessionId 
              }, "Attempting to connect to Gemini Live");
              
              liveSession = await geminiVoiceClient.connectLive(
                apiKey,
                {
                  systemPrompt: "You are a helpful assistant.", // Minimal prompt for testing
                  voiceName,
                  tools: undefined, // Disabling tools for debugging
                },
                {
                  onmessage: async (msg: any) => {
                    logger.debug({ msg }, "Raw Gemini message");
                    if (msg.setupComplete) {
                      logger.info({ sessionId }, "Gemini setup complete, signaling ready to client");
                      ws.send(JSON.stringify({ ok: true, message: "Session initialized", sessionId }));
                      return;
                    }

                    // Forward all Gemini messages to client
                    ws.send(JSON.stringify({ type: "gemini", data: msg }));

                    // Handle Transcripts
                    const modelParts = msg.serverContent?.modelTurn?.parts || [];
                    for (const part of modelParts) {
                      if (part.text) {
                        client.transcript += `AI: ${part.text}\n`;
                      }
                    }

                    // Handle User turns if transcription is present
                    const userParts = msg.serverContent?.userTurn?.parts || [];
                    for (const part of userParts) {
                      if (part.text) {
                        client.transcript += `User: ${part.text}\n`;
                      }
                    }

                    // If it's audio, also send it in a way the client-side AudioPlayer expects
                    const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (base64Audio) {
                      ws.send(
                        JSON.stringify({
                          type: "audio",
                          data: base64Audio,
                        })
                      );
                    }

                    // Handle Tool Calls
                    const toolParts = msg.serverContent?.modelTurn?.parts || [];
                    for (const part of toolParts) {
                      if (part.toolCall) {
                        const functionCalls = part.toolCall.functionCalls;
                        if (functionCalls) {
                          for (const call of functionCalls) {
                            const result = await ToolExecutor.execute(call.name, call.args, token);

                            // Send ToolResponse back to Gemini session
                            if (liveSession) {
                              liveSession.sendToolResponse({
                                functionResponses: [
                                  {
                                    name: call.name,
                                    id: call.id,
                                    response: result,
                                  },
                                ],
                              });
                            }
                          }
                        }
                      }
                    }

                    // Handle interruption signal for client to stop its player
                    if (msg.serverContent?.interrupted) {
                      ws.send(JSON.stringify({ type: "control", data: "interrupted" }));
                    }
                  },
                  onclose: (event?: any) => {
                    logger.info({ 
                      sessionId, 
                      code: event?.code, 
                      reason: event?.reason 
                    }, "Gemini session closed");
                    ws.send(JSON.stringify({ type: "control", data: "closed" }));
                  },
                  onerror: (err: any) => {
                    const errorMsg = err?.message || String(err);
                    logger.error({ 
                      err, 
                      errorMsg, 
                      sessionId,
                      code: err?.code,
                      reason: err?.reason
                    }, "Gemini session error occurred");
                    ws.send(
                      JSON.stringify({ error: "Gemini connection error", details: errorMsg })
                    );
                  },
                }
              );
            } catch (err: any) {
              logger.error({ err, message: err.message, stack: err.stack }, "Failed to connect to Gemini Live");
              ws.send(JSON.stringify({ 
                error: "Gemini connection failed", 
                details: err.message,
                stack: err.stack 
              }));
              return;
            }

            const client: GatewayClient = {
              sessionId,
              userId: decoded.userId,
              agentId,
              connectedAt: new Date(),
              startTime: Date.now(),
              transcript: "",
              apiKey,
              token,
              liveSession,
            };

            this.clients.set(sessionId, client);
            logger.info(
              { sessionId, userId: client.userId, agentId },
              "Client initialized, waiting for Gemini setupComplete"
            );
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
          startTime: Date.now(),
          transcript: "",
          token: "test-token", // Dummy token for test mode
          apiKey: "test-api-key", // Dummy API key for test mode
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
        // Forward to Gemini Multimodal Live API
        if (client.liveSession) {
          client.liveSession.sendRealtimeInput({
            media: {
              mimeType: "audio/pcm;rate=16000",
              data: message.data,
            },
          });
        }
      } catch (err) {
        logger.error({ err }, "Failed to process audio via live session");
        ws.send(JSON.stringify({ error: "Failed to process audio", details: String(err) }));
      }
    } else if (message.type === "text") {
      const client = this.clients.get(sessionId);
      if (!client) {
        ws.send(JSON.stringify({ error: "Session not initialized" }));
        return;
      }

      try {
        // Forward text to Gemini Multimodal Live API
        if (client.liveSession) {
          client.liveSession.sendRealtimeInput({
            text: message.data,
          });
        }
      } catch (err) {
        logger.error({ err }, "Failed to process text via live session");
        ws.send(JSON.stringify({ error: "Failed to process text", details: String(err) }));
      }
    }
  }

  start() {
    logger.info({ port: env.PORT }, "Voice Gateway running");
  }
}

const gateway = new VoiceGateway(env.PORT);
gateway.start();
