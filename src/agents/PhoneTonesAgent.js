"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhoneTonesAgent = void 0;
class PhoneTonesAgent {
    constructor() {
        this.name = "phone_tones";
        this.description = "Handles phone tone playback cues and signaling.";
    }
    async run(input, context) {
        return {
            ok: true,
            message: "PhoneTonesAgent received input.",
            data: { input, requestId: context.requestId },
        };
    }
}
exports.PhoneTonesAgent = PhoneTonesAgent;
