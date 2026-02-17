import { FastifyInstance } from "fastify";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { authenticate } from "../middleware/auth";
import { FastifyRequest } from "fastify";
import { toolAuditLogger } from "../services/audit";
import { prisma } from "../db";

export async function auditRoutes(fastify: FastifyInstance) {
  // Get audit logs for an agent
  fastify.get<{ Params: { agentId: string } }>(
    "/agents/:agentId/audit-logs",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { agentId } = request.params as { agentId: string };
        const tenantId = (request as any).user.tenantId;
        const limit = Math.min(parseInt((request.query as any).limit || "50"), 100);

        // Verify agent belongs to tenant
        const agent = await prisma.agent.findFirst({
          where: { id: agentId, tenantId },
        });

        if (!agent) {
          return reply.code(404).send({
            ok: false,
            message: "Agent not found",
          } as ApiResponse);
        }

        const logs = await toolAuditLogger.getAgentLogs(agentId, limit);

        return reply.code(200).send({
          ok: true,
          message: "Audit logs retrieved",
          data: {
            agentId,
            totalLogs: logs.length,
            logs,
          },
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to get audit logs");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Get tool execution stats for an agent
  fastify.get<{ Params: { agentId: string } }>(
    "/agents/:agentId/tool-stats",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { agentId } = request.params as { agentId: string };
        const tenantId = (request as any).user.tenantId;

        // Verify agent belongs to tenant
        const agent = await prisma.agent.findFirst({
          where: { id: agentId, tenantId },
        });

        if (!agent) {
          return reply.code(404).send({
            ok: false,
            message: "Agent not found",
          } as ApiResponse);
        }

        const stats = await toolAuditLogger.getToolStats(agentId);

        return reply.code(200).send({
          ok: true,
          message: "Tool execution stats retrieved",
          data: {
            agentId,
            ...stats,
          },
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to get tool stats");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Get a specific audit log entry
  fastify.get<{ Params: { logId: string } }>(
    "/audit-logs/:logId",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const { logId } = request.params as { logId: string };
        const tenantId = (request as any).user.tenantId;

        const log = await prisma.toolExecutionAudit.findFirst({
          where: {
            id: logId,
            agent: {
              tenantId,
            },
          },
          include: {
            agent: true,
          },
        });

        if (!log) {
          return reply.code(404).send({
            ok: false,
            message: "Audit log not found",
          } as ApiResponse);
        }

        return reply.code(200).send({
          ok: true,
          message: "Audit log retrieved",
          data: {
            ...log,
            toolInput: JSON.parse(log.toolInput),
            toolOutput: log.toolOutput ? JSON.parse(log.toolOutput) : null,
          },
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to get audit log");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Get tenant-wide tool execution summary
  fastify.get(
    "/audit-summary",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const tenantId = (request as any).user.tenantId;

        // Get all agents for tenant
        const agents = await prisma.agent.findMany({
          where: { tenantId },
          select: { id: true, name: true },
        });

        const agentIds = agents.map((a) => a.id);

        // Get summary stats
        const [total, successful, failed] = await Promise.all([
          prisma.toolExecutionAudit.count({
            where: { agentId: { in: agentIds } },
          }),
          prisma.toolExecutionAudit.count({
            where: { agentId: { in: agentIds }, status: "success" },
          }),
          prisma.toolExecutionAudit.count({
            where: { agentId: { in: agentIds }, status: "failed" },
          }),
        ]);

        return reply.code(200).send({
          ok: true,
          message: "Audit summary retrieved",
          data: {
            totalExecutions: total,
            successfulExecutions: successful,
            failedExecutions: failed,
            successRate: total > 0 ? ((successful / total) * 100).toFixed(2) : "0",
            numAgents: agents.length,
          },
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to get audit summary");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );
}
