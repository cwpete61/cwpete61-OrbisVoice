"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TwilioAgent = void 0;
class TwilioAgent {
    constructor() {
        this.name = "twilio";
        this.description = "Handles telephony actions and messaging through Twilio.";
    }
    async run(input, context) {
        return {
            ok: true,
            message: "TwilioAgent received input.",
            data: { input, requestId: context.requestId },
        };
    }
}
exports.TwilioAgent = TwilioAgent;
