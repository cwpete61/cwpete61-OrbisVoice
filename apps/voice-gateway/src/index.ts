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
  private heartbeatInterval: NodeJS.Timeout;

  constructor(port: number) {
    this.wss = new WebSocket.Server({ port, host: "0.0.0.0" });
    this.setupListeners();
    
    // Setup Heartbeat to prevent timeouts
    this.heartbeatInterval = setInterval(() => {
      this.wss.clients.forEach((ws: any) => {
        if (ws.isAlive === false) return ws.terminate();
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private sendError(ws: WebSocket.WebSocket, error: string, details?: any, sessionId?: string) {
    const isDev = env.NODE_ENV === "development";
    const errorMsg = isDev ? (details?.message || String(details || "")) : "Something went wrong in the gateway.";
    
    logger.error({ 
      error, 
      actualDetails: details?.message || String(details || ""), 
      sessionId 
    }, "Gateway error sent to client");

    ws.send(JSON.stringify({ 
      error, 
      details: errorMsg, 
      sessionId 
    }));
  }

  private setupListeners() {
    this.wss.on("connection", (ws: any) => {
      const sessionId = uuidv4();
      ws.isAlive = true;
      ws.on("pong", () => { ws.isAlive = true; });

      logger.info({ sessionId }, "Client connected");

      ws.on("message", (data) => {
        try {
          const rawMessage = JSON.parse(data.toString());
          
          // Detect Twilio ConversationRelay Protocol
          if (rawMessage.type === "setup" || rawMessage.type === "prompt" || rawMessage.type === "interrupt") {
            this.handleTwilioEvent(ws, rawMessage, sessionId);
            return;
          }

          // Default OrbisVoice Custom Protocol
          this.handleMessage(ws, rawMessage as AudioMessage, sessionId);
        } catch (err) {
          this.sendError(ws, "Invalid message format", err, sessionId);
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

          if (client.transcript) {
            logger.info({ sessionId, duration }, "Saving transcript to API via Gateway Proxy");
            try {
              await fetch(`${env.API_URL}/public/gateway/transcripts`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "x-gateway-secret": env.GATEWAY_SECRET,
                },
                body: JSON.stringify({
                  agentId: client.agentId,
                  userId: client.userId,
                  content: client.transcript,
                  duration: duration,
                  inputTokens: client.inputTokens,
                  outputTokens: client.outputTokens,
                  toolsCalled: client.toolsCalled,
                }),
              });
            } catch (err) {
              logger.error({ err, sessionId }, "Failed to save transcript via Gateway Proxy");
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
    logger.info({ type: message.type, length: message.data?.length, sessionId }, "Incoming message from client");
    
    try {
      if (message.type === "control") {
        await this.handleControlMessage(ws, message, sessionId);
      } else if (message.type === "audio") {
        await this.handleAudioMessage(ws, message, sessionId);
      } else if (message.type === "text") {
        await this.handleTextMessage(ws, message, sessionId);
      }
    } catch (err) {
      this.sendError(ws, "Internal gateway error", err, sessionId);
    }
  }

  private async handleTwilioEvent(ws: WebSocket.WebSocket, event: any, sessionId: string) {
    const { type } = event;
    logger.debug({ type, sessionId }, "Incoming Twilio ConversationRelay event");

    try {
      switch (type) {
        case "setup":
          await this.initializeTwilioSession(ws, event, sessionId);
          break;
        case "prompt":
          await this.handleTwilioPrompt(ws, event, sessionId);
          break;
        case "interrupt":
          logger.info({ sessionId }, "Twilio interrupt event received");
          // Optionally trigger interruptions on Gemini Live session here
          break;
        default:
          logger.warn({ type, sessionId }, "Unhandled Twilio event type");
      }
    } catch (err) {
      this.sendError(ws, "Twilio event processing failed", err, sessionId);
    }
  }

  private async initializeTwilioSession(ws: WebSocket.WebSocket, setupEvent: any, sessionId: string) {
    const callSid = setupEvent.callSid;
    const customParameters = setupEvent.customParameters || {};
    const token = customParameters.token;
    const agentId = customParameters.agentId || "default-agent";

    if (!token) {
      this.sendError(ws, "Unauthorized", "No token provided in Twilio customParameters", sessionId);
      ws.close();
      return;
    }

    try {
      const decoded: any = jwt.verify(token, env.JWT_SECRET);
      const apiKey = await this.fetchGoogleConfig(agentId, token);

      // Fetch configs like in normal session
      const { systemPrompt, voiceName } = await this.fetchAgentConfig(token, agentId, customParameters);
      const enabledToolNames = await this.fetchToolConfig(token);
      const sessionTools = buildToolsForNames(enabledToolNames);

      const client: GatewayClient = {
        sessionId,
        userId: decoded.userId || "twilio-system",
        agentId,
        connectedAt: new Date(),
        startTime: Date.now(),
        transcript: "",
        apiKey,
        token,
        liveSession: null,
        inputTokens: 0,
        outputTokens: 0,
        toolsCalled: 0,
        isTwilio: true,
        streamSid: callSid,
        inbound: customParameters.inbound
      };

      const liveSession = await geminiVoiceClient.connectLive(
        apiKey,
        { systemPrompt, voiceName, tools: sessionTools, modalities: ["AUDIO", "TEXT"] },
        this.createGeminiHandlers(ws, client)
      );

      client.liveSession = liveSession;
      this.clients.set(sessionId, client);

      logger.info({ sessionId, callSid, agentId }, "Twilio ConversationRelay Session Initialized");
    } catch (err) {
      this.sendError(ws, "Twilio session initialization failed", err, sessionId);
      ws.close();
    }
  }

  private async handleTwilioPrompt(ws: WebSocket.WebSocket, promptEvent: any, sessionId: string) {
    const client = this.clients.get(sessionId);
    if (!client || !client.liveSession) return;

    // Prevent cross talk with Unique SIDs
    if (client.streamSid !== promptEvent.callSid) {
        logger.warn({ expected: client.streamSid, actual: promptEvent.callSid }, "Blocked cross-talk from mismatched callSid");
        return;
    }

    const userPrompt = promptEvent.voicePrompt;
    if (!userPrompt) return;

    logger.info({ sessionId, userPrompt }, "Twilio STT recognized user prompt");

    try {
      (client.liveSession as any).send([{ parts: [{
        text: userPrompt
      }] }]);
    } catch (err) {
      logger.error({ err, sessionId }, "Failed to send Twilio text prompt to Gemini");
    }
  }

  private async handleControlMessage(ws: WebSocket.WebSocket, message: AudioMessage, sessionId: string) {
    if (message.data.startsWith("{")) {
      await this.initializeSession(ws, message, sessionId);
    } else if (message.data === "init") {
      this.initializeTestSession(ws, sessionId);
    }
  }

  private async initializeSession(ws: WebSocket.WebSocket, message: AudioMessage, sessionId: string) {
    try {
      const payload = JSON.parse(message.data);
      if (payload.event !== "init") {
        return;
      }

      const token = payload.token || "";

      let decoded: any = null;

      // 1. Verify Identity if token is provided
      if (token) {
        try {
          decoded = jwt.verify(token, env.JWT_SECRET);
        } catch (err) {
          logger.warn({ err, sessionId }, "Incoming token verification failed");
        }
      }

      const agentId = payload.agentId || decoded?.agentId || "default-agent";
      const userId = decoded?.userId || "anonymous";

      // 2. Fetch Google Config (Secrets)
      const apiKey = await this.fetchGoogleConfig(agentId, token);

      // 3. Verify Usage Allowance
      if (token && decoded) {
        // Dashboard user with JWT
        try {
          const canStartRes = await fetch(`${env.API_URL}/billing/can-start-session`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const canStartData = await canStartRes.json() as any;
          if (!canStartRes.ok) {
            this.sendError(ws, "Usage Restricted", canStartData.message || "Insufficient Credits", sessionId);
            ws.close();
            return;
          }
        } catch (err) {
          logger.error({ err, sessionId }, "Failed to verify dashboard user usage");
        }
      } else {
        // Widget/Anonymous user
        try {
          const usageCheckRes = await fetch(`${env.API_URL}/public/gateway/usage-check/${agentId}`, {
            headers: { "x-gateway-secret": env.GATEWAY_SECRET }
          });
          const usageData = await usageCheckRes.json() as any;
          if (!usageCheckRes.ok) {
            this.sendError(ws, "Usage Restricted", usageData.message || "The agent owner has reached their limit.", sessionId);
            ws.close();
            return;
          }
        } catch (err) {
          logger.error({ err, sessionId, agentId }, "Failed to verify widget/public usage allowance");
        }
      }

      // 3. Fetch Agent Configuration
      const { systemPrompt, voiceName } = await this.fetchAgentConfig(token, agentId, payload);

      // 4. Fetch Tool Configuration
      const enabledToolNames = await this.fetchToolConfig(token);
      const sessionTools = buildToolsForNames(enabledToolNames);

      // 5. Establish Gemini Multimodal Live Session
      logger.info({ 
        model: "gemini-2.0-flash-exp", 
        apiKeySet: !!apiKey,
        voiceName,
        toolsCount: sessionTools.length,
        sessionId 
      }, "Connecting to Gemini Multimodal Live API");

      const client: GatewayClient = {
        sessionId,
        userId,
        agentId,
        connectedAt: new Date(),
        startTime: Date.now(),
        transcript: "",
        apiKey,
        token,
        liveSession: null,
        inputTokens: 0,
        outputTokens: 0,
        toolsCalled: 0,
      };

      const liveSession = await geminiVoiceClient.connectLive(
        apiKey,
        { systemPrompt, voiceName, tools: sessionTools, modalities: ["AUDIO", "TEXT"] },
        this.createGeminiHandlers(ws, client)
      );

      client.liveSession = liveSession;
      this.clients.set(sessionId, client);
      
      logger.info({ sessionId, userId: client.userId, agentId }, "Client initialized, waiting for setupComplete");
    } catch (err) {
      this.sendError(ws, "Session initialization failed", err, sessionId);
    }
  }

  private async fetchGoogleConfig(agentId: string, token?: string): Promise<string | undefined> {
    try {
      // 1. If we have a token (authenticated user), get config directly
      if (token) {
        const response = await fetch(`${env.API_URL}/settings/google-config?include_secrets=true`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const configResponse = (await response.json()) as any;
          if (configResponse.data?.geminiApiKey) {
            return configResponse.data.geminiApiKey;
          }
        }
      }

      // 2. Fallback to public/proxy route with gateway secret (for widget users)
      const response = await fetch(`${env.API_URL}/public/gateway/config/${agentId}`, {
        headers: { "x-gateway-secret": env.GATEWAY_SECRET },
      });

      if (response.ok) {
        const configResponse = (await response.json()) as any;
        if (configResponse.data?.geminiApiKey) {
          return configResponse.data.geminiApiKey;
        }
      }
    } catch (err) {
      logger.error({ err, agentId }, "Failed to fetch google config");
    }
    return env.GEMINI_API_KEY;
  }

  private async fetchAgentConfig(token: string, agentId: string, payload: any) {
    let systemPrompt = payload.systemPrompt || "You are a helpful AI assistant.";
    let voiceName = "Charon";

    try {
      // 1. Try public route first if it's a widget request (no token usually)
      let agentData = null;
      
      const publicRes = await fetch(`${env.API_URL}/public/agents/${agentId}`);
      if (publicRes.ok) {
        agentData = ((await publicRes.json()) as any).data;
      } else if (token) {
        // 2. Fallback to private route if token exists
        const agentRes = await fetch(`${env.API_URL}/agents/${agentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (agentRes.ok) {
          agentData = ((await agentRes.json()) as any).data;
        }
      }

      if (agentData) {
        systemPrompt = payload.systemPrompt || agentData.systemPrompt || systemPrompt;
      }

      const CALL_RULES = `\n\nYou are a helpful and friendly voice assistant. This conversation is happening over a phone call, so your responses will be spoken aloud.\nPlease adhere to the following rules:\n1. Provide clear, concise, and direct answers.\n2. Spell out all numbers (e.g., say 'one thousand two hundred' instead of 1200).\n3. Do not use any special characters like asterisks, bullet points, or emojis.\n4. Keep the conversation natural and engaging.`;
      systemPrompt += CALL_RULES;

      const rawVoiceId = payload.voiceId || agentData?.voiceId || agentData?.voiceModel || "aoede";
      const voiceGender = payload.voiceGender || agentData?.voiceGender || "MALE";
          
      const voiceMapping: Record<string, string> = {
        aoede: "Aoede", autonoe: "Aoede", callirrhoe: "Aoede", kore: "Kore", leda: "Kore", zephyr: "Aoede",
        charon: "Charon", enceladus: "Charon", fenrir: "Fenrir", lapetus: "Charon", orus: "Puck", puck: "Puck", umbriel: "Puck",
        default: voiceGender === "FEMALE" ? "Aoede" : "Charon",
        professional: "Kore", friendly: "Aoede", concise: "Charon",
      };
      
      voiceName = voiceMapping[rawVoiceId.toLowerCase()] || (voiceGender === "FEMALE" ? "Aoede" : "Charon");
    } catch (err) {
      logger.error({ err, agentId }, "Failed to fetch agent config, using defaults");
    }

    return { systemPrompt, voiceName };
  }

  private async fetchToolConfig(token: string): Promise<string[]> {
    try {
      const response = await fetch(`${env.API_URL}/settings/agent-tool-config`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const configResponse = (await response.json()) as any;
        return configResponse.data?.enabledTools || [];
      }
    } catch (err) {
      logger.error({ err }, "Failed to fetch tool config");
    }
    // Default to all tools enabled if fetch fails (fallback behavior)
    return ALL_VOICE_TOOL_NAMES.slice() as unknown as string[];
  }

  private createGeminiHandlers(ws: WebSocket.WebSocket, client: GatewayClient) {
    return {
      onMessage: async (msg: any) => {
        const { sessionId } = client;
        
        if (msg.setupComplete) {
          logger.info({ sessionId }, "Gemini setup complete");
          
          if (client.liveSession) {
            // Check if we need to send an initial greeting (for inbound calls or explicit config)
            // We do this AFTER setupComplete to ensure Gemini is ready to process.
            const isInbound = (client as any).inbound === true || (client as any).inbound === "true";
            
            if (isInbound) {
              logger.info({ sessionId }, "Sending initial greeting prompt to Gemini (Post-Setup)");
              try {
                // Use a simpler send format or sendRealtimeInput if needed
                (client.liveSession as any).send([{ parts: [{ 
                  text: "Please greet the caller warmly and introduce yourself as their virtual assistant." 
                }] }]);
              } catch (greetErr) {
                logger.error({ greetErr, sessionId }, "Failed to send initial greeting");
              }
            }

            if (!client.isTwilio) {
              ws.send(JSON.stringify({ ok: true, message: "Session initialized", sessionId }));
            }
          }
          return;
        }

        // Handle Tool Calls (Function Calls)
        const modelTurn = msg.serverContent?.modelTurn;
        if (modelTurn?.parts) {
          for (const part of modelTurn.parts) {
            if (part.functionCall) {
              const { name, args, id } = part.functionCall;
              logger.info({ sessionId, name, args }, "Gemini requested tool call");
              client.toolsCalled++;
              
              // 1. Send status to frontend (optional but good for UI)
              ws.send(JSON.stringify({ 
                type: "tool_call", 
                data: { name, args } 
              }));

              // 2. Execute the tool
              try {
                const response = await ToolExecutor.execute(name, args, client.token || "", { 
                  agentId: client.agentId, 
                  userId: client.userId 
                });
                logger.info({ sessionId, name, response }, "Tool execution complete, sending back to Gemini");

                // 3. Send response back to Gemini
                if (client.liveSession) {
                  client.liveSession.send([
                    {
                      functionResponse: {
                        name,
                        id,
                        response: { result: response },
                      },
                    },
                  ]);
                }
              } catch (toolErr) {
                logger.error({ toolErr, name, sessionId }, "Tool execution failed");
                if (client.liveSession) {
                  client.liveSession.send([
                    {
                      functionResponse: {
                        name,
                        id,
                        response: { error: String(toolErr) },
                      },
                    },
                  ]);
                }
              }
            }
          }
        }

        // Update Usage (Token Tracking)
        if (msg.usageMetadata) {
          client.inputTokens = msg.usageMetadata.promptTokenCount;
          client.outputTokens = msg.usageMetadata.candidatesTokenCount;
          logger.info({ sessionId, usage: msg.usageMetadata }, "Updated token usage");
        }

        // Update Transcript
        const modelParts = msg.serverContent?.modelTurn?.parts || [];
        for (const part of modelParts) {
          if (part.text) {
            logger.info({ sessionId, text: part.text }, "Received text from Gemini");
            client.transcript += `AI: ${part.text}\n`;
            
            if (client.isTwilio) {
              // For Twilio ConversationRelay, we use its built-in TTS (Google)
              // Sending raw audio from Gemini requires transcoding (MULAW 8kHz) which we avoid here
              logger.debug({ sessionId }, "Forwarding text to Twilio for TTS");
              ws.send(JSON.stringify({ type: "text", token: part.text, last: false }));
            } else {
              // For Web clients, we send text parts for transcription display in UI
              ws.send(JSON.stringify({ type: "text", token: part.text, last: false }));
            }
          }
        }

        // Trigger TTS flush on turn complete
        if (msg.serverContent?.turnComplete && client.isTwilio) {
          ws.send(JSON.stringify({ type: "text", token: " ", last: true }));
        }

        const userParts = msg.serverContent?.userTurn?.parts || [];
        for (const part of userParts) {
          if (part.text) {
            client.transcript += `User: ${part.text}\n`;
          }
        }

        // Forward Audio Parts to client correctly handled for both Web and Twilio
        if (msg.serverContent?.modelTurn?.parts) {
          for (const part of msg.serverContent.modelTurn.parts) {
            const base64Audio = part.inlineData?.data;
            if (base64Audio) {
              if (client.isTwilio) {
                // DO NOT send raw Gemini PCM audio to Twilio ConversationRelay
                // It expects MULAW 8kHz and will result in silence or distortion
                logger.debug({ sessionId }, "Skipping raw audio forwarding for Twilio (favors TTS)");
              } else {
                logger.debug({ sessionId, audioLength: base64Audio.length }, "Forwarding audio chunk to web client");
                ws.send(JSON.stringify({ type: "audio", data: base64Audio }));
              }
            }
          }
        }

        // Handle interruptions
        if (msg.serverContent?.interrupted) {
          ws.send(JSON.stringify({ type: "control", data: "interrupted" }));
        }
      },
      onClose: (event?: any) => {
        logger.info({ 
          sessionId: client.sessionId, 
          code: event?.code || "unknown", 
          reason: event?.reason || "no reason" 
        }, "Gemini session closed");
        ws.send(JSON.stringify({ type: "control", data: "closed", code: event?.code, reason: event?.reason }));
      },
      onError: (err: any) => {
        logger.error({ err, sessionId: client.sessionId }, "Gemini session error occurred");
        this.sendError(ws, "Gemini session error", err, client.sessionId);
      },
    };
  }

  private initializeTestSession(ws: WebSocket.WebSocket, sessionId: string) {
    const client: GatewayClient = {
      sessionId,
      userId: "test-user",
      agentId: "test-agent",
      connectedAt: new Date(),
      startTime: Date.now(),
      transcript: "",
      token: "test-token",
      apiKey: "test-api-key",
      liveSession: null,
      inputTokens: 0,
      outputTokens: 0,
      toolsCalled: 0,
    };
    this.clients.set(sessionId, client);
    logger.info({ sessionId }, "Client initialized (test mode)");
    ws.send(JSON.stringify({ ok: true, message: "Session initialized", sessionId }));
  }

  private async handleAudioMessage(ws: WebSocket.WebSocket, message: AudioMessage, sessionId: string) {
    const client = this.clients.get(sessionId);
    if (!client || !client.liveSession) return;

    try {
      logger.debug({ sessionId, length: message.data?.length }, "Forwarding audio to Gemini");
      client.liveSession.sendRealtimeInput({
        media: { mimeType: "audio/pcm;rate=16000", data: message.data },
      });
    } catch (err) {
      this.sendError(ws, "Failed to process audio", err, sessionId);
    }
  }

  private async handleTextMessage(ws: WebSocket.WebSocket, message: AudioMessage, sessionId: string) {
    const client = this.clients.get(sessionId);
    if (!client || !client.liveSession) return;

    try {
      client.liveSession.sendRealtimeInput({ text: message.data });
    } catch (err) {
      this.sendError(ws, "Failed to process text", err, sessionId);
    }
  }

  start() {
    logger.info({ port: env.PORT }, "Voice Gateway running");
  }
}

const gateway = new VoiceGateway(env.PORT);
gateway.start();
