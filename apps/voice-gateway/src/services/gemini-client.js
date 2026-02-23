"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.geminiVoiceClient = void 0;
const env_1 = require("../env");
const logger_1 = require("../logger");
class GeminiVoiceClient {
    constructor() {
        this.model = "gemini-2.0-flash-exp";
        if (!env_1.env.GEMINI_API_KEY) {
            logger_1.logger.warn("GEMINI_API_KEY not set - Gemini Voice will default to failing if no key provided in request");
        }
    }
    getEffectiveKey(apiKey) {
        const key = apiKey || env_1.env.GEMINI_API_KEY;
        if (!key) {
            throw new Error("Gemini API key not configured");
        }
        return key;
    }
    async processAudio(apiKey, audioData, systemPrompt) {
        const key = this.getEffectiveKey(apiKey);
        try {
            logger_1.logger.debug({ audioLength: audioData.length }, "Processing audio with Gemini");
            // Call Gemini API with audio input
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
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
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Gemini API error");
                throw new Error(`Gemini API error: ${response.status}`);
            }
            const data = await response.json();
            let textContent = "";
            if (data.candidates?.[0]?.content?.parts) {
                for (const part of data.candidates[0].content.parts) {
                    if (part.text) {
                        textContent += part.text;
                    }
                }
            }
            // TODO: Implement voice synthesis for audio response
            // For now, return empty audio
            return {
                text: textContent,
                outputAudio: { data: "" },
            };
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to process audio with Gemini");
            throw err;
        }
    }
    async processText(apiKey, text, agentId) {
        const key = this.getEffectiveKey(apiKey);
        try {
            logger_1.logger.debug({ agentId }, "Processing text with Gemini");
            // Call Gemini API with text input
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${key}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: text,
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        temperature: 0.7,
                        maxOutputTokens: 1024,
                    },
                }),
            });
            if (!response.ok) {
                const error = await response.text();
                logger_1.logger.error({ status: response.status, error }, "Gemini API error");
                throw new Error(`Gemini API error: ${response.status}`);
            }
            const data = await response.json();
            let textContent = "";
            if (data.candidates?.[0]?.content?.parts) {
                for (const part of data.candidates[0].content.parts) {
                    if (part.text) {
                        textContent += part.text;
                    }
                }
            }
            return {
                text: textContent,
            };
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to process text with Gemini");
            throw err;
        }
    }
}
exports.geminiVoiceClient = new GeminiVoiceClient();
