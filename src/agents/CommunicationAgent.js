"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationAgent = void 0;
class CommunicationAgent {
    constructor() {
        this.name = "communication";
        this.description = "Handles general user communications and messaging tasks.";
    }
    async run(input, context) {
        return {
            ok: true,
            message: "CommunicationAgent received input.",
            data: { input, requestId: context.requestId },
        };
    }
}
exports.CommunicationAgent = CommunicationAgent;
