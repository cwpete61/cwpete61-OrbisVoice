import { prisma } from "../db";
import { logger } from "../logger";
import { sessionManager, ConversationMessage } from "./session";
import { UsageService } from "./usage-service";

export async function finalizeSession(sessionId: string): Promise<void> {
  try {
    const session = await sessionManager.getSession(sessionId);
    if (!session) {
      logger.warn({ sessionId }, "Session not found for finalization");
      return;
    }

    // Build transcript content
    const transcriptContent = session.conversationHistory
      .map((msg: ConversationMessage) => {
        const prefix = msg.role === "user" ? "User:" : "Agent:";
        let content = `${prefix} ${msg.content}`;

        // Add tool calls if any
        if (msg.toolCalls && msg.toolCalls.length > 0) {
          content += "\n";
          msg.toolCalls.forEach((tool) => {
            content += `[Tool: ${tool.name} → ${tool.status}]\n`;
            if (tool.output) {
              content += `Result: ${JSON.stringify(tool.output)}\n`;
            }
          });
        }

        return content;
      })
      .join("\n\n");

    // Calculate duration
    const durationSeconds = Math.round((session.lastActivityTime - session.startTime) / 1000);

    // Fetch settings to get cost per minute
    const settings = await prisma.platformSettings.findUnique({
      where: { id: "global" },
      select: { costPerMinute: true },
    });
    
    const costPerMinute = settings?.costPerMinute ?? 0.013;
    const estimatedCost = (durationSeconds / 60) * costPerMinute;

    // Create transcript record
    const transcript = await prisma.transcript.create({
      data: {
        agentId: session.agentId,
        userId: session.userId,
        content: transcriptContent,
        duration: durationSeconds,
        estimatedCost: estimatedCost,
      },
    });

    logger.info(
      { sessionId, transcriptId: transcript.id, agentId: session.agentId },
      "Session finalized and transcript created"
    );
    
    // Record usage (credits)
    await UsageService.recordUsage(session.tenantId);

    // Delete session from Redis
    await sessionManager.deleteSession(sessionId);
  } catch (err) {
    logger.error({ err, sessionId }, "Failed to finalize session");
  }
}

// Cleanup stale sessions (run periodically)
export async function cleanupStaleSessions(maxAgeMinutes: number = 1440): Promise<number> {
  // Note: Redis TTL handles this automatically, this is a utility for manual cleanup
  logger.info({ maxAgeMinutes }, "Stale session cleanup completed (automatic via Redis TTL)");
  return 0;
}
