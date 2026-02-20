import { prisma } from "../db";
import { logger } from "../logger";
import { sessionManager, ConversationMessage } from "./session";

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
    const duration = session.lastActivityTime - session.startTime;

    // Create transcript record
    const transcript = await prisma.transcript.create({
      data: {
        agentId: session.agentId,
        userId: session.userId,
        content: transcriptContent,
        duration: Math.round(duration / 1000), // Convert to seconds
      },
    });

    logger.info(
      { sessionId, transcriptId: transcript.id, agentId: session.agentId },
      "Session finalized and transcript created"
    );

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
