import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";
import { authenticate, requireAdmin } from "../middleware/auth";
import { AuthPayload, ApiResponse } from "../types";
import { generateAnswer, updateFaqEmbedding } from "../services/faq";

export async function helpRoutes(fastify: FastifyInstance) {

    // ── POST /help/chat — RAG bot ─────────────────────────────────────────────
    fastify.post<{ Body: { question: string } }>(
        "/help/chat",
        async (request, reply) => {
            try {
                const { question } = request.body as { question: string };
                if (!question?.trim()) {
                    return reply.code(400).send({ ok: false, message: "question is required" } as ApiResponse);
                }

                const { answer, sources } = await generateAnswer(question.trim());
                return reply.code(200).send({ ok: true, data: { answer, sources } } as ApiResponse);
            } catch (err) {
                logger.error(err, "FAQ chat failed");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── GET /help/faq — public FAQ list ──────────────────────────────────────
    fastify.get("/help/faq", async (request, reply) => {
        try {
            const { category, q } = request.query as any;
            const where: any = { published: true };
            if (category) where.category = category;
            if (q) where.question = { contains: q, mode: "insensitive" };

            const faqs = await prisma.faqEntry.findMany({
                where,
                orderBy: { helpful: "desc" },
                select: { id: true, question: true, answer: true, category: true, helpful: true, notHelpful: true },
            });

            return reply.code(200).send({ ok: true, data: faqs } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to list FAQ");
            return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
        }
    });

    // ── POST /help/faq/:id/feedback ───────────────────────────────────────────
    fastify.post<{ Params: { id: string }; Body: { helpful: boolean } }>(
        "/help/faq/:id/feedback",
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { helpful } = request.body as { helpful: boolean };

                if (helpful) {
                    await prisma.faqEntry.update({ where: { id }, data: { helpful: { increment: 1 } } });
                } else {
                    await prisma.faqEntry.update({ where: { id }, data: { notHelpful: { increment: 1 } } });
                }

                return reply.code(200).send({ ok: true, message: "Feedback recorded" } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to record FAQ feedback");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── GET /admin/help/questions — question review queue ─────────────────────
    fastify.get("/admin/help/questions", { onRequest: [requireAdmin] }, async (request, reply) => {
        try {
            const { status = "pending" } = request.query as any;
            const questions = await prisma.faqQuestion.findMany({
                where: { status },
                orderBy: { createdAt: "desc" },
                take: 100,
            });
            return reply.code(200).send({ ok: true, data: questions } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to list FAQ questions");
            return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
        }
    });

    // ── POST /admin/help/questions/:id/promote — promote to FAQ ──────────────
    fastify.post<{ Params: { id: string }; Body: { answer: string; category?: string } }>(
        "/admin/help/questions/:id/promote",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { answer, category = "general" } = request.body as { answer: string; category?: string };

                const q = await prisma.faqQuestion.findUnique({ where: { id } });
                if (!q) return reply.code(404).send({ ok: false, message: "Question not found" } as ApiResponse);

                const entry = await prisma.faqEntry.create({
                    data: { question: q.question, answer, category, source: "bot_learned", published: true },
                });

                await prisma.faqQuestion.update({ where: { id }, data: { status: "answered", faqEntryId: entry.id } });

                // Async embed update
                updateFaqEmbedding(entry.id).catch(() => { });

                return reply.code(200).send({ ok: true, data: entry } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to promote FAQ question");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── GET /admin/help/faq — full admin FAQ list ─────────────────────────────
    fastify.get("/admin/help/faq", { onRequest: [requireAdmin] }, async (request, reply) => {
        try {
            const faqs = await prisma.faqEntry.findMany({ orderBy: { createdAt: "desc" } });
            return reply.code(200).send({ ok: true, data: faqs } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to list admin FAQ");
            return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
        }
    });

    // ── POST /admin/help/faq — create FAQ entry ───────────────────────────────
    fastify.post<{ Body: any }>(
        "/admin/help/faq",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { question, answer, category = "general", published = true } = request.body as any;
                if (!question || !answer) {
                    return reply.code(400).send({ ok: false, message: "question and answer are required" } as ApiResponse);
                }

                const entry = await prisma.faqEntry.create({ data: { question, answer, category, published, source: "admin" } });
                updateFaqEmbedding(entry.id).catch(() => { });

                return reply.code(201).send({ ok: true, data: entry } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to create FAQ entry");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── PUT /admin/help/faq/:id — edit FAQ entry ─────────────────────────────
    fastify.put<{ Params: { id: string }; Body: any }>(
        "/admin/help/faq/:id",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { question, answer, category, published } = request.body as any;
                const entry = await prisma.faqEntry.update({ where: { id }, data: { question, answer, category, published } });
                updateFaqEmbedding(entry.id).catch(() => { });
                return reply.code(200).send({ ok: true, data: entry } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to update FAQ entry");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── DELETE /admin/help/faq/:id ────────────────────────────────────────────
    fastify.delete<{ Params: { id: string } }>(
        "/admin/help/faq/:id",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;
                await prisma.faqEntry.delete({ where: { id } });
                return reply.code(200).send({ ok: true, message: "FAQ entry deleted" } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to delete FAQ entry");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── GET /admin/help/subscribers/:id/overview — read-only subscriber view ──
    fastify.get<{ Params: { id: string } }>(
        "/admin/subscribers/:id/overview",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;
                const tenant = await prisma.tenant.findUnique({
                    where: { id },
                    include: {
                        users: { select: { id: true, name: true, email: true, role: true, isAdmin: true, createdAt: true } },
                        agents: { select: { id: true, name: true, voiceId: true, createdAt: true, _count: { select: { transcripts: true, leads: true } } } },
                    },
                });
                if (!tenant) return reply.code(404).send({ ok: false, message: "Subscriber not found" } as ApiResponse);

                return reply.code(200).send({ ok: true, data: tenant } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to get subscriber overview");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );
}
