import { createClient } from "redis";
import { logger } from "../logger";

export interface SessionData {
  sessionId: string;
  userId: string;
  agentId: string;
  tenantId: string;
  startTime: number;
  lastActivityTime: number;
  conversationHistory: ConversationMessage[];
  metadata: Record<string, any>;
}

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  toolCalls?: ToolCall[];
}

export interface ToolCall {
  name: string;
  input: Record<string, any>;
  output?: any;
  status: "pending" | "success" | "error";
}

class SessionManager {
  private client: ReturnType<typeof createClient> | null = null;
  private initialized = false;

  async initialize(redisUrl: string) {
    if (this.initialized) return;

    try {
      this.client = createClient({ 
        url: redisUrl,
        socket: {
          reconnectStrategy: false, // Disable auto-reconnect
        }
      });
      // Only log error once, don't spam on reconnect attempts
      this.client.on("error", (err) => {
        if (err.code === 'ECONNREFUSED') {
          // Silently ignore connection refused errors
          return;
        }
        logger.error({ err }, "Redis client error");
      });
      await this.client.connect();
      this.initialized = true;
      logger.info("Session manager initialized with Redis");
    } catch (err) {
      // Clean up client if initialization failed
      if (this.client) {
        try {
          await this.client.quit();
        } catch {
          // Ignore cleanup errors
        }
        this.client = null;
      }
      logger.warn({ err }, "Failed to initialize session manager - Redis unavailable");
      throw err;
    }
  }

  async createSession(
    sessionId: string,
    userId: string,
    agentId: string,
    tenantId: string
  ): Promise<SessionData> {
    if (!this.client) throw new Error("Session manager not initialized");

    const session: SessionData = {
      sessionId,
      userId,
      agentId,
      tenantId,
      startTime: Date.now(),
      lastActivityTime: Date.now(),
      conversationHistory: [],
      metadata: {},
    };

    const key = `session:${sessionId}`;
    await this.client.setEx(key, 24 * 60 * 60, JSON.stringify(session)); // 24hr TTL
    logger.info({ sessionId, agentId }, "Session created");

    return session;
  }

  async getSession(sessionId: string): Promise<SessionData | null> {
    if (!this.client) throw new Error("Session manager not initialized");

    const key = `session:${sessionId}`;
    const data = await this.client.get(key);

    if (!data) return null;

    return JSON.parse(data) as SessionData;
  }

  async addMessage(sessionId: string, message: ConversationMessage): Promise<void> {
    if (!this.client) throw new Error("Session manager not initialized");

    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    session.conversationHistory.push(message);
    session.lastActivityTime = Date.now();

    const key = `session:${sessionId}`;
    await this.client.setEx(key, 24 * 60 * 60, JSON.stringify(session));
  }

  async updateMetadata(sessionId: string, metadata: Record<string, any>): Promise<void> {
    if (!this.client) throw new Error("Session manager not initialized");

    const session = await this.getSession(sessionId);
    if (!session) throw new Error("Session not found");

    session.metadata = { ...session.metadata, ...metadata };
    session.lastActivityTime = Date.now();

    const key = `session:${sessionId}`;
    await this.client.setEx(key, 24 * 60 * 60, JSON.stringify(session));
  }

  async deleteSession(sessionId: string): Promise<void> {
    if (!this.client) throw new Error("Session manager not initialized");

    const key = `session:${sessionId}`;
    await this.client.del(key);
    logger.info({ sessionId }, "Session deleted");
  }
}

export const sessionManager = new SessionManager();
