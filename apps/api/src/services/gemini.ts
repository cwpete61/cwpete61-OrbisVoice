import { env } from "../env";
import { logger } from "../logger";
import { toolExecutor, ToolContext } from "../tools/executor";

export interface GeminiConfig {
  apiKey: string;
  model: string;
  voiceConfig: {
    encoding: "LINEAR16" | "MULAW";
    sampleRateHz: number;
  };
}

export interface GeminiTool {
  function_declarations: Array<{
    name: string;
    description: string;
    parameters: {
      type: "OBJECT";
      properties: Record<string, any>;
      required?: string[];
    };
  }>;
}

export interface GeminiAudioRequest {
  audio: {
    data: string; // base64-encoded audio data
  };
  mime_type?: string;
  system_instruction?: {
    parts: Array<{ text: string }>;
  };
  tools?: GeminiTool[];
  tool_config?: {
    function_calling_config: {
      mode: "MODE_UNSPECIFIED" | "AUTO" | "ANY" | "NONE";
    };
  };
}

export interface GeminiAudioResponse {
  audioContent?: string; // base64-encoded audio
  text?: string;
  usageMetadata?: {
    inputTokenCount: number;
    outputTokenCount: number;
  };
  toolUseList?: Array<{
    functionCalls: Array<{
      name: string;
      args: Record<string, any>;
    }>;
  }>;
}

class GeminiVoiceClient {
  private apiKey: string;
  private model: string = "gemini-2.0-flash-exp";
  private baseUrl: string = "https://generativelanguage.googleapis.com/v1beta/audio:transcribe";

  constructor() {
    this.apiKey = env.GEMINI_API_KEY || "";
    if (!this.apiKey) {
      logger.warn("GEMINI_API_KEY not set - Gemini Voice will not work");
    }
  }

  async processAudio(
    audioData: string,
    systemPrompt: string,
    tools?: GeminiTool[]
  ): Promise<GeminiAudioResponse> {
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
      const request: GeminiAudioRequest = {
        audio: {
          data: audioData,
        },
        mime_type: "audio/pcm",
        system_instruction: {
          parts: [
            {
              text: systemPrompt,
            },
          ],
        },
      };

      // Add tools if provided
      if (tools && tools.length > 0) {
        request.tools = tools;
        request.tool_config = {
          function_calling_config: {
            mode: "AUTO",
          },
        };
      }

      // Call Gemini API
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
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
            systemInstruction: {
              parts: [{ text: systemPrompt }],
            },
            tools: tools,
            generationConfig: tools
              ? {
                temperature: 0.7,
              }
              : undefined,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        logger.error({ status: response.status, error }, "Gemini API error");
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();
      logger.debug({ model: this.model }, "Gemini API response received");

      // Extract content from response
      let textContent = "";
      let audioContent = "";
      const toolCalls = [];

      if (data.candidates?.[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.text) {
            textContent += part.text;
          }
          if (part.inlineData?.data) {
            // This would be audio data for text-to-speech generation
            audioContent = part.inlineData.data;
          }
          if (part.functionCall) {
            toolCalls.push({
              name: part.functionCall.name,
              args: part.functionCall.args,
            });
          }
        }
      }

      return {
        text: textContent,
        audioContent: audioContent,
        usageMetadata: data.usageMetadata,
        toolUseList: toolCalls.length > 0 ? [{ functionCalls: toolCalls }] : undefined,
      };
    } catch (err) {
      logger.error({ err }, "Failed to process audio with Gemini");
      throw err;
    }
  }

  async executeToolCalls(
    toolCalls: Array<{ name: string; args: Record<string, any> }>,
    context: ToolContext
  ): Promise<
    Array<{
      name: string;
      result: any;
    }>
  > {
    const results = [];

    for (const toolCall of toolCalls) {
      logger.info({ toolName: toolCall.name, userId: context.userId }, "Executing tool call from Gemini");

      const result = await toolExecutor.execute(toolCall.name, toolCall.args, context);
      results.push({
        name: toolCall.name,
        result,
      });
    }

    return results;
  }

  async synthesizeSpeech(text: string, voiceConfig?: any): Promise<string> {
    // Use Google Text-to-Speech API or Gemini multimodal
    if (!this.apiKey) {
      throw new Error("Gemini API key not configured");
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `Generate a natural response to: ${text}`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }

      const data = await response.json();

      // For now, return empty audio data - real implementation would use TTS
      logger.debug("Text synthesized (stub)");
      return "";
    } catch (err) {
      logger.error({ err }, "Failed to synthesize speech");
      throw err;
    }
  }
}

export const geminiVoiceClient = new GeminiVoiceClient();
