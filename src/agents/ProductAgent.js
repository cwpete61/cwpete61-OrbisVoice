"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductAgent = void 0;
class ProductAgent {
    constructor() {
        this.name = "product";
        this.description = "Answers product questions and provides feature guidance.";
    }
    async run(input, context) {
        return {
            ok: true,
            message: "ProductAgent received input.",
            data: { input, requestId: context.requestId },
        };
    }
}
exports.ProductAgent = ProductAgent;
