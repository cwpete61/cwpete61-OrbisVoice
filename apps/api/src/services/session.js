"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sessionManager = void 0;
const redis_1 = require("redis");
const logger_1 = require("../logger");
class SessionManager {
    constructor() {
        this.client = null;
        this.initialized = false;
    }
    async initialize(redisUrl) {
        if (this.initialized)
            return;
        try {
            this.client = (0, redis_1.createClient)({ url: redisUrl });
            this.client.on("error", (err) => logger_1.logger.error({ err }, "Redis client error"));
            await this.client.connect();
            this.initialized = true;
            logger_1.logger.info("Session manager initialized with Redis");
        }
        catch (err) {
            logger_1.logger.error({ err }, "Failed to initialize session manager");
            throw err;
        }
    }
    async createSession(sessionId, userId, agentId, tenantId) {
        if (!this.client)
            throw new Error("Session manager not initialized");
        const session = {
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
        logger_1.logger.info({ sessionId, agentId }, "Session created");
        return session;
    }
    async getSession(sessionId) {
        if (!this.client)
            throw new Error("Session manager not initialized");
        const key = `session:${sessionId}`;
        const data = await this.client.get(key);
        if (!data)
            return null;
        return JSON.parse(data);
    }
    async addMessage(sessionId, message) {
        if (!this.client)
            throw new Error("Session manager not initialized");
        const session = await this.getSession(sessionId);
        if (!session)
            throw new Error("Session not found");
        session.conversationHistory.push(message);
        session.lastActivityTime = Date.now();
        const key = `session:${sessionId}`;
        await this.client.setEx(key, 24 * 60 * 60, JSON.stringify(session));
    }
    async updateMetadata(sessionId, metadata) {
        if (!this.client)
            throw new Error("Session manager not initialized");
        const session = await this.getSession(sessionId);
        if (!session)
            throw new Error("Session not found");
        session.metadata = { ...session.metadata, ...metadata };
        session.lastActivityTime = Date.now();
        const key = `session:${sessionId}`;
        await this.client.setEx(key, 24 * 60 * 60, JSON.stringify(session));
    }
    async deleteSession(sessionId) {
        if (!this.client)
            throw new Error("Session manager not initialized");
        const key = `session:${sessionId}`;
        await this.client.del(key);
        logger_1.logger.info({ sessionId }, "Session deleted");
    }
}
exports.sessionManager = new SessionManager();
