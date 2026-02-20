"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toolExecutor = void 0;
const logger_1 = require("../logger");
const audit_1 = require("../services/audit");
class ToolExecutor {
    constructor() {
        this.handlers = new Map();
    }
    register(toolName, handler) {
        this.handlers.set(toolName, handler);
        logger_1.logger.debug({ toolName }, "Tool handler registered");
    }
    async execute(toolName, input, context) {
        const handler = this.handlers.get(toolName);
        const startTime = Date.now();
        if (!handler) {
            logger_1.logger.warn({ toolName }, "Unknown tool requested");
            await audit_1.toolAuditLogger.log({
                agentId: context.agentId,
                userId: context.userId,
                toolName,
                toolInput: input,
                status: "failed",
                errorMessage: `Unknown tool: ${toolName}`,
                executionTimeMs: Date.now() - startTime,
            });
            return {
                success: false,
                error: `Unknown tool: ${toolName}`,
            };
        }
        try {
            logger_1.logger.info({ toolName, userId: context.userId }, "Executing tool");
            const result = await handler(input, context);
            const executionTime = Date.now() - startTime;
            logger_1.logger.info({ toolName, success: result.success, executionTimeMs: executionTime }, "Tool execution completed");
            // Log to audit
            await audit_1.toolAuditLogger.log({
                agentId: context.agentId,
                userId: context.userId,
                toolName,
                toolInput: input,
                toolOutput: result.data,
                status: result.success ? "success" : "failed",
                errorMessage: result.error,
                executionTimeMs: executionTime,
            });
            return result;
        }
        catch (err) {
            const executionTime = Date.now() - startTime;
            logger_1.logger.error({ err, toolName }, "Tool execution failed");
            await audit_1.toolAuditLogger.log({
                agentId: context.agentId,
                userId: context.userId,
                toolName,
                toolInput: input,
                status: "failed",
                errorMessage: `Tool execution failed: ${String(err)}`,
                executionTimeMs: executionTime,
            });
            return {
                success: false,
                error: `Tool execution failed: ${String(err)}`,
            };
        }
    }
}
exports.toolExecutor = new ToolExecutor();
