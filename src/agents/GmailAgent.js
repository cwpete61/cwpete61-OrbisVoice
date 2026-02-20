"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GmailAgent = void 0;
class GmailAgent {
    constructor() {
        this.name = "gmail";
        this.description = "Sends, drafts, and tracks emails via Gmail.";
    }
    async run(input, context) {
        return {
            ok: true,
            message: "GmailAgent received input.",
            data: { input, requestId: context.requestId },
        };
    }
}
exports.GmailAgent = GmailAgent;
