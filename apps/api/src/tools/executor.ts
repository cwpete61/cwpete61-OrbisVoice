import { logger } from "../logger";

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

    if (!handler) {
      logger.warn({ toolName }, "Unknown tool requested");
      return {
        success: false,
        error: `Unknown tool: ${toolName}`,
      };
    }

    try {
      logger.info({ toolName, userId: context.userId }, "Executing tool");
      const result = await handler(input, context);
      logger.info({ toolName, success: result.success }, "Tool execution completed");
      return result;
    } catch (err) {
      logger.error({ err, toolName }, "Tool execution failed");
      return {
        success: false,
        error: `Tool execution failed: ${String(err)}`,
      };
    }
  }
}

export const toolExecutor = new ToolExecutor();
