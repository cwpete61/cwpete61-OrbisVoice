import { logger } from "../logger";
import { toolAuditLogger } from "../services/audit";

export interface ToolInput {
  [key: string]: any;
}

export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
}

export type ToolHandler = (input: ToolInput, context: ToolContext) => Promise<ToolResult>;

export interface ToolContext {
  agentId: string;
  userId: string;
  tenantId: string;
  sessionId: string;
}

class ToolExecutor {
  private handlers: Map<string, ToolHandler> = new Map();

  register(toolName: string, handler: ToolHandler) {
    this.handlers.set(toolName, handler);
    logger.debug({ toolName }, "Tool handler registered");
  }

  async execute(toolName: string, input: ToolInput, context: ToolContext): Promise<ToolResult> {
    const handler = this.handlers.get(toolName);
    const startTime = Date.now();

    if (!handler) {
      logger.warn({ toolName }, "Unknown tool requested");
      await toolAuditLogger.log({
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
      logger.info({ toolName, userId: context.userId }, "Executing tool");
      const result = await handler(input, context);
      
      const executionTime = Date.now() - startTime;
      logger.info({ toolName, success: result.success, executionTimeMs: executionTime }, "Tool execution completed");
      
      // Log to audit
      await toolAuditLogger.log({
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
    } catch (err) {
      const executionTime = Date.now() - startTime;
      logger.error({ err, toolName }, "Tool execution failed");
      
      await toolAuditLogger.log({
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

export const toolExecutor = new ToolExecutor();
