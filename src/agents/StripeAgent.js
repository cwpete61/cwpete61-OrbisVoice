"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeAgent = void 0;
class StripeAgent {
    constructor() {
        this.name = "stripe";
        this.description = "Handles billing and payment actions through Stripe.";
    }
    async run(input, context) {
        return {
            ok: true,
            message: "StripeAgent received input.",
            data: { input, requestId: context.requestId },
        };
    }
}
exports.StripeAgent = StripeAgent;
