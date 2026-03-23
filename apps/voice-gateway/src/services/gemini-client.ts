import { GoogleGenAI, Modality, Tool } from "@google/genai";
import { env } from "../env";
import { logger } from "../logger";

export interface GeminiAudioResponse {
  outputAudio?: { data: string };
  text?: string;
}

class GeminiVoiceClient {
  private model: string = "gemini-2.0-flash-exp"; 
  private liveModel: string = "gemini-2.0-flash-exp";

  constructor() {
    if (!env.GEMINI_API_KEY) {
      logger.warn("GEMINI_API_KEY not set - Gemini Voice will default to failing if no key provided in request");
    }
  }

  private getClient(apiKey?: string) {
    const key = apiKey || env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("Gemini API key not configured");
    }
    return new GoogleGenAI({ apiKey: key });
  }

  async connectLive(
    apiKey: string | undefined,
    config: {
      systemPrompt: string;
      voiceName?: string;
      tools?: Tool[];
      modalities?: ("audio" | "text" | "image")[];
    },
    callbacks: {
      onmessage: (message: any) => void;
      onclose: (event?: any) => void;
      onerror: (err: any) => void;
    }
  ) {
    const client = this.getClient(apiKey);
    
    logger.info({ 
        model: this.liveModel, 
        toolsCount: config.tools?.length || 0,
        modalities: config.modalities || ["audio"] 
    }, "Connecting to Gemini Multimodal Live API");

    const session = await client.live.connect({
      model: this.liveModel,
      config: {
        responseModalities: (config.modalities || ["audio"]) as any,
        speechConfig: {
           voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voiceName || "Puck" } },
        },
        generationConfig: {
          temperature: 0.7,
        },
        systemInstruction: {
          parts: [{ text: config.systemPrompt }],
        },
        tools: config.tools,
      },
      callbacks,
    });

    return session;
  }

  async processAudio(apiKey: string | undefined, audioData: string, systemPrompt: string): Promise<GeminiAudioResponse> {
    const client = this.getClient(apiKey);

    try {
      logger.debug({ audioLength: audioData.length }, "Processing audio with @google/genai SDK");

      const response = await client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [
              {
                inlineData: {
                  mimeType: "audio/pcm",
                  data: audioData,
                },
              },
            ],
          },
        ],
        config: {
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      const text = response.text || "";

      // TODO: Implement voice synthesis for audio response
      // For now, return empty audio
      return {
        text,
        outputAudio: { data: "" },
      };
    } catch (err) {
      logger.error({ err }, "Failed to process audio with Gemini SDK");
      throw err;
    }
  }

  async processText(apiKey: string | undefined, text: string, agentId: string): Promise<{ text: string; audioData?: string }> {
    const client = this.getClient(apiKey);

    try {
      logger.debug({ agentId }, "Processing text with @google/genai SDK");

      const response = await client.models.generateContent({
        model: this.model,
        contents: [
          {
            role: "user",
            parts: [{ text }],
          },
        ],
        config: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      });

      return {
        text: response.text || "",
      };
    } catch (err) {
      logger.error({ err }, "Failed to process text with Gemini SDK");
      throw err;
    }
  }
}

export const geminiVoiceClient = new GeminiVoiceClient();
