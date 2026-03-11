"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helpRoutes = helpRoutes;
const db_1 = require("../db");
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
const faq_1 = require("../services/faq");
async function helpRoutes(fastify) {
    // ── POST /help/chat — RAG bot ─────────────────────────────────────────────
    fastify.post("/help/chat", async (request, reply) => {
        try {
            const { question } = request.body;
            if (!question?.trim()) {
                return reply.code(400).send({ ok: false, message: "question is required" });
            }
            const { answer, sources } = await (0, faq_1.generateAnswer)(question.trim());
            return reply.code(200).send({ ok: true, data: { answer, sources } });
        }
        catch (err) {
            logger_1.logger.error(err, "FAQ chat failed");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── GET /help/faq — public FAQ list ──────────────────────────────────────
    fastify.get("/help/faq", async (request, reply) => {
        try {
            const { category, q } = request.query;
            const where = { published: true };
            if (category)
                where.category = category;
            if (q)
                where.question = { contains: q, mode: "insensitive" };
            const faqs = await db_1.prisma.faqEntry.findMany({
                where,
                orderBy: { helpful: "desc" },
                select: { id: true, question: true, answer: true, category: true, helpful: true, notHelpful: true },
            });
            return reply.code(200).send({ ok: true, data: faqs });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to list FAQ");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── POST /help/faq/:id/feedback ───────────────────────────────────────────
    fastify.post("/help/faq/:id/feedback", async (request, reply) => {
        try {
            const { id } = request.params;
            const { helpful } = request.body;
            if (helpful) {
                await db_1.prisma.faqEntry.update({ where: { id }, data: { helpful: { increment: 1 } } });
            }
            else {
                await db_1.prisma.faqEntry.update({ where: { id }, data: { notHelpful: { increment: 1 } } });
            }
            return reply.code(200).send({ ok: true, message: "Feedback recorded" });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to record FAQ feedback");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── GET /admin/help/questions — question review queue ─────────────────────
    fastify.get("/admin/help/questions", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { status = "pending" } = request.query;
            const questions = await db_1.prisma.faqQuestion.findMany({
                where: { status },
                orderBy: { createdAt: "desc" },
                take: 100,
            });
            return reply.code(200).send({ ok: true, data: questions });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to list FAQ questions");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── POST /admin/help/questions/:id/promote — promote to FAQ ──────────────
    fastify.post("/admin/help/questions/:id/promote", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { answer, category = "general" } = request.body;
            const q = await db_1.prisma.faqQuestion.findUnique({ where: { id } });
            if (!q)
                return reply.code(404).send({ ok: false, message: "Question not found" });
            const entry = await db_1.prisma.faqEntry.create({
                data: { question: q.question, answer, category, source: "bot_learned", published: true },
            });
            await db_1.prisma.faqQuestion.update({ where: { id }, data: { status: "answered", faqEntryId: entry.id } });
            // Async embed update
            (0, faq_1.updateFaqEmbedding)(entry.id).catch(() => { });
            return reply.code(200).send({ ok: true, data: entry });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to promote FAQ question");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── GET /admin/help/faq — full admin FAQ list ─────────────────────────────
    fastify.get("/admin/help/faq", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const faqs = await db_1.prisma.faqEntry.findMany({ orderBy: { createdAt: "desc" } });
            return reply.code(200).send({ ok: true, data: faqs });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to list admin FAQ");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── POST /admin/help/faq — create FAQ entry ───────────────────────────────
    fastify.post("/admin/help/faq", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { question, answer, category = "general", published = true } = request.body;
            if (!question || !answer) {
                return reply.code(400).send({ ok: false, message: "question and answer are required" });
            }
            const entry = await db_1.prisma.faqEntry.create({ data: { question, answer, category, published, source: "admin" } });
            (0, faq_1.updateFaqEmbedding)(entry.id).catch(() => { });
            return reply.code(201).send({ ok: true, data: entry });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to create FAQ entry");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── PUT /admin/help/faq/:id — edit FAQ entry ─────────────────────────────
    fastify.put("/admin/help/faq/:id", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const { question, answer, category, published } = request.body;
            const entry = await db_1.prisma.faqEntry.update({ where: { id }, data: { question, answer, category, published } });
            (0, faq_1.updateFaqEmbedding)(entry.id).catch(() => { });
            return reply.code(200).send({ ok: true, data: entry });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to update FAQ entry");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── DELETE /admin/help/faq/:id ────────────────────────────────────────────
    fastify.delete("/admin/help/faq/:id", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            await db_1.prisma.faqEntry.delete({ where: { id } });
            return reply.code(200).send({ ok: true, message: "FAQ entry deleted" });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to delete FAQ entry");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── GET /admin/help/subscribers/:id/overview — read-only subscriber view ──
    fastify.get("/admin/subscribers/:id/overview", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const tenant = await db_1.prisma.tenant.findUnique({
                where: { id },
                include: {
                    users: { select: { id: true, name: true, email: true, role: true, isAdmin: true, createdAt: true } },
                    agents: { select: { id: true, name: true, voiceId: true, createdAt: true, _count: { select: { transcripts: true, leads: true } } } },
                },
            });
            if (!tenant)
                return reply.code(404).send({ ok: false, message: "Subscriber not found" });
            return reply.code(200).send({ ok: true, data: tenant });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get subscriber overview");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
}
