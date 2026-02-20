"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.finalizeSession = finalizeSession;
exports.cleanupStaleSessions = cleanupStaleSessions;
const db_1 = require("../db");
const logger_1 = require("../logger");
const session_1 = require("./session");
async function finalizeSession(sessionId) {
    try {
        const session = await session_1.sessionManager.getSession(sessionId);
        if (!session) {
            logger_1.logger.warn({ sessionId }, "Session not found for finalization");
            return;
        }
        // Build transcript content
        const transcriptContent = session.conversationHistory
            .map((msg) => {
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
        const transcript = await db_1.prisma.transcript.create({
            data: {
                agentId: session.agentId,
                userId: session.userId,
                content: transcriptContent,
                duration: Math.round(duration / 1000), // Convert to seconds
            },
        });
        logger_1.logger.info({ sessionId, transcriptId: transcript.id, agentId: session.agentId }, "Session finalized and transcript created");
        // Delete session from Redis
        await session_1.sessionManager.deleteSession(sessionId);
    }
    catch (err) {
        logger_1.logger.error({ err, sessionId }, "Failed to finalize session");
    }
}
// Cleanup stale sessions (run periodically)
async function cleanupStaleSessions(maxAgeMinutes = 1440) {
    // Note: Redis TTL handles this automatically, this is a utility for manual cleanup
    logger_1.logger.info({ maxAgeMinutes }, "Stale session cleanup completed (automatic via Redis TTL)");
    return 0;
}
