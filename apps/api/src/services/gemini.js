"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiVoiceClient = void 0;
const env_1 = require("../env");
const logger_1 = require("../logger");
const executor_1 = require("../tools/executor");
class GeminiVoiceClient {
    constructor() {
        this.model = "gemini-2.0-flash-exp";
        this.baseUrl = "https://generativelanguage.googleapis.com/v1beta/audio:transcribe";
        this.apiKey = env_1.env.GEMINI_API_KEY;
        if (!this.apiKey) {
            logger_1.logger.warn("GEMINI_API_KEY not set - Gemini Voice will not work");
        }
    }
    async processAudio(audioData, systemPrompt, tools) {
        if (!this.apiKey) {
            throw new Error("Gemini API key not configured");
        }
        try {
            const request = {
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
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
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
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Gemini API error");
                throw new Error(`Gemini API error: ${response.status}`);
            }
            const data = await response.json();
            logger_1.logger.debug({ model: this.model }, "Gemini API response received");
            // Extract content from response
            let textContent = "";
            let audioContent = "";
            let toolCalls = [];
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
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to process audio with Gemini");
            throw err;
        }
    }
    async executeToolCalls(toolCalls, context) {
        const results = [];
        for (const toolCall of toolCalls) {
            logger_1.logger.info({ toolName: toolCall.name, userId: context.userId }, "Executing tool call from Gemini");
            const result = await executor_1.toolExecutor.execute(toolCall.name, toolCall.args, context);
            results.push({
                name: toolCall.name,
                result,
            });
        }
        return results;
    }
    async synthesizeSpeech(text, voiceConfig) {
        // Use Google Text-to-Speech API or Gemini multimodal
        if (!this.apiKey) {
            throw new Error("Gemini API key not configured");
        }
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`, {
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
            });
            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }
            const data = await response.json();
            // For now, return empty audio data - real implementation would use TTS
            logger_1.logger.debug("Text synthesized (stub)");
            return "";
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to synthesize speech");
            throw err;
        }
    }
}
exports.geminiVoiceClient = new GeminiVoiceClient();
