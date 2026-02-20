"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadQualificationAgent = void 0;
class LeadQualificationAgent {
    constructor() {
        this.name = "lead_qualification";
        this.description = "Qualifies leads and captures intent and fit signals.";
    }
    async run(input, context) {
        return {
            ok: true,
            message: "LeadQualificationAgent received input.",
            data: { input, requestId: context.requestId },
        };
    }
}
exports.LeadQualificationAgent = LeadQualificationAgent;
