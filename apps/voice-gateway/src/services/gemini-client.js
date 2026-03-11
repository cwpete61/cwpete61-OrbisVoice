"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiVoiceClient = void 0;
const genai_1 = require("@google/genai");
const env_1 = require("../env");
const logger_1 = require("../logger");
class GeminiVoiceClient {
    constructor() {
        this.model = "gemini-2.5-flash";
        if (!env_1.env.GEMINI_API_KEY) {
            logger_1.logger.warn("GEMINI_API_KEY not set - Gemini Voice will default to failing if no key provided in request");
        }
    }
    getClient(apiKey) {
        const key = apiKey || env_1.env.GEMINI_API_KEY;
        if (!key) {
            throw new Error("Gemini API key not configured");
        }
        return new genai_1.GoogleGenAI({ apiKey: key });
    }
    async processAudio(apiKey, audioData, systemPrompt) {
        const client = this.getClient(apiKey);
        try {
            logger_1.logger.debug({ audioLength: audioData.length }, "Processing audio with @google/genai SDK");
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
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to process audio with Gemini SDK");
            throw err;
        }
    }
    async processText(apiKey, text, agentId) {
        const client = this.getClient(apiKey);
        try {
            logger_1.logger.debug({ agentId }, "Processing text with @google/genai SDK");
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
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to process text with Gemini SDK");
            throw err;
        }
    }
}
exports.geminiVoiceClient = new GeminiVoiceClient();
