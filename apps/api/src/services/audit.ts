import { prisma } from "../db";
import { logger } from "../logger";

export interface AuditLogData {
  agentId: string;
  userId?: string;
  toolName: string;
  toolInput: unknown;
  toolOutput?: unknown;
  status: "pending" | "success" | "failed";
  errorMessage?: string;
  executionTimeMs?: number;
}

class ToolAuditLogger {
  /**
   * Log tool execution to database
   */
  async log(data: AuditLogData): Promise<string> {
    try {
      const audit = await prisma.toolExecutionAudit.create({
        data: {
          agentId: data.agentId,
          userId: data.userId || null,
          toolName: data.toolName,
          toolInput: JSON.stringify(data.toolInput),
          toolOutput: data.toolOutput ? JSON.stringify(data.toolOutput) : null,
          status: data.status,
          errorMessage: data.errorMessage,
          executionTimeMs: data.executionTimeMs || 0,
        },
      });

      return audit.id;
    } catch (err) {
      logger.error({ err, toolName: data.toolName }, "Failed to log tool execution");
      // Don't throw - audit logging should not block tool execution
      return "";
    }
  }

  /**
   * Get audit logs for an agent
   */
  async getAgentLogs(agentId: string, limit: number = 50): Promise<Array<Omit<AuditLogData, 'toolInput' | 'toolOutput' | 'userId' | 'errorMessage'> & { id: string; createdAt: Date; userId: string | null; errorMessage: string | null; toolInput: unknown; toolOutput: unknown | null }>> {
    try {
      const audits = await prisma.toolExecutionAudit.findMany({
        where: { agentId },
        orderBy: { createdAt: "desc" },
        take: limit,
      });

      return audits.map((audit: any) => ({
        ...audit,
        status: audit.status as "pending" | "success" | "failed",
        toolInput: JSON.parse(audit.toolInput),
        toolOutput: audit.toolOutput ? JSON.parse(audit.toolOutput) : null,
      }));
    } catch (err) {
      logger.error({ err, agentId }, "Failed to retrieve audit logs");
      throw err;
    }
  }

  /**
   * Get tool execution stats
   */
  async getToolStats(agentId: string): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: string;
    avgExecutionTimeMs: number;
    toolBreakdown: Array<{ toolName: string; count: number }>;
  }> {
    try {
      const [total, successful, failed, avgTime] = await Promise.all([
        prisma.toolExecutionAudit.count({
          where: { agentId },
        }),
        prisma.toolExecutionAudit.count({
          where: { agentId, status: "success" },
        }),
        prisma.toolExecutionAudit.count({
          where: { agentId, status: "failed" },
        }),
        prisma.toolExecutionAudit.aggregate({
          where: { agentId, status: "success" },
          _avg: { executionTimeMs: true },
        }),
      ]);

      const toolBreakdown = await prisma.toolExecutionAudit.groupBy({
        by: ["toolName"],
        where: { agentId },
        _count: true,
      });

      return {
        totalExecutions: total,
        successfulExecutions: successful,
        failedExecutions: failed,
        successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : "0",
        avgExecutionTimeMs: avgTime._avg.executionTimeMs || 0,
        toolBreakdown: toolBreakdown.map((tb: any) => ({
          toolName: tb.toolName,
          count: tb._count,
        })),
      };
    } catch (err) {
      logger.error({ err, agentId }, "Failed to get tool stats");
      throw err;
    }
  }
}

export const toolAuditLogger = new ToolAuditLogger();
