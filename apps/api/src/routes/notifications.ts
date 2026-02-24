import { FastifyInstance, FastifyRequest } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";
import { authenticate, requireAdmin, requireSystemAdmin } from "../middleware/auth";
import { AuthPayload, ApiResponse } from "../types";
import { createNotification, broadcastNotification, NotifType, seedDefaultTemplates } from "../services/notification";

export async function notificationRoutes(fastify: FastifyInstance) {

    // ── GET /notifications — user inbox ──────────────────────────────────────
    fastify.get("/notifications", { onRequest: [authenticate] }, async (request: FastifyRequest, reply) => {
        try {
            const userId = (request.user as AuthPayload).userId;
            const { page = "1", limit = "30", unreadOnly = "false" } = request.query as any;
            const skip = (Number(page) - 1) * Number(limit);

            const where: any = { userId };
            if (unreadOnly === "true") where.read = false;

            const [notifications, total, unreadCount] = await Promise.all([
                prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: Number(limit) }),
                prisma.notification.count({ where }),
                prisma.notification.count({ where: { userId, read: false } }),
            ]);

            return reply.code(200).send({ ok: true, data: { notifications, total, unreadCount, page: Number(page) } } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to get notifications");
            return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
        }
    });

    // ── POST /notifications/mark-read ────────────────────────────────────────
    fastify.post<{ Body: { ids?: string[]; all?: boolean } }>(
        "/notifications/mark-read",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
                const { ids, all } = request.body as { ids?: string[]; all?: boolean };

                if (all) {
                    await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
                } else if (ids?.length) {
                    await prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { read: true } });
                }

                return reply.code(200).send({ ok: true, message: "Marked as read" } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to mark notifications read");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── GET /notifications/preferences ───────────────────────────────────────
    fastify.get("/notifications/preferences", { onRequest: [authenticate] }, async (request: FastifyRequest, reply) => {
        try {
            const userId = (request.user as AuthPayload).userId;
            const [user, pref] = await Promise.all([
                prisma.user.findUnique({ where: { id: userId }, select: { emailNotifications: true } }),
                prisma.notificationPreference.findUnique({ where: { userId } }),
            ]);

            return reply.code(200).send({
                ok: true,
                data: {
                    emailNotifications: user?.emailNotifications ?? true,
                    commissions: pref?.commissions ?? true,
                    payouts: pref?.payouts ?? true,
                    leads: pref?.leads ?? true,
                    usageWarnings: pref?.usageWarnings ?? true,
                    announcements: pref?.announcements ?? true,
                },
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to get notification preferences");
            return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
        }
    });

    // ── PUT /notifications/preferences ───────────────────────────────────────
    fastify.put<{ Body: any }>(
        "/notifications/preferences",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as AuthPayload).userId;
                const { emailNotifications, commissions, payouts, leads, usageWarnings, announcements } = request.body as any;

                // Update master email toggle on User
                if (typeof emailNotifications === "boolean") {
                    await prisma.user.update({ where: { id: userId }, data: { emailNotifications } });
                }

                // Upsert per-type preferences
                await prisma.notificationPreference.upsert({
                    where: { userId },
                    create: { userId, commissions, payouts, leads, usageWarnings, announcements },
                    update: { commissions, payouts, leads, usageWarnings, announcements },
                });

                return reply.code(200).send({ ok: true, message: "Preferences updated" } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to update notification preferences");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── POST /admin/notifications/send — manual blast ─────────────────────────
    fastify.post<{ Body: any }>(
        "/admin/notifications/send",
        { onRequest: [requireSystemAdmin] },
        async (request, reply) => {
            try {
                const { userIds, all, type = NotifType.ADMIN_MANUAL, title, body, sendEmail } = request.body as any;

                if (!title || !body) return reply.code(400).send({ ok: false, message: "title and body are required" } as ApiResponse);

                if (all) {
                    await broadcastNotification({ type, title, body, sendEmail });
                    return reply.code(200).send({ ok: true, message: "Broadcast sent to all users" } as ApiResponse);
                }

                if (!userIds?.length) return reply.code(400).send({ ok: false, message: "userIds or all:true required" } as ApiResponse);

                await Promise.allSettled(
                    (userIds as string[]).map((uid) => createNotification({ userId: uid, type, title, body, sendEmail }))
                );

                return reply.code(200).send({ ok: true, message: `Notification sent to ${userIds.length} user(s)` } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to send admin notification");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );

    // ── GET /admin/notifications/templates ───────────────────────────────────
    fastify.get("/admin/notifications/templates", { onRequest: [requireAdmin] }, async (_request, reply) => {
        try {
            await seedDefaultTemplates(); // ensure defaults exist
            const templates = await prisma.notificationTemplate.findMany({ orderBy: { type: "asc" } });
            return reply.code(200).send({ ok: true, data: templates } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to get templates");
            return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
        }
    });

    // ── PUT /admin/notifications/templates/:type ──────────────────────────────
    fastify.put<{ Params: { type: string }; Body: any }>(
        "/admin/notifications/templates/:type",
        { onRequest: [requireSystemAdmin] },
        async (request, reply) => {
            try {
                const { type } = request.params;
                const { subject, bodyHtml, enabled } = request.body as any;

                const template = await prisma.notificationTemplate.upsert({
                    where: { type },
                    create: { type, subject: subject ?? type, bodyHtml: bodyHtml ?? "", enabled: enabled ?? true },
                    update: { subject, bodyHtml, enabled },
                });

                return reply.code(200).send({ ok: true, data: template } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to update template");
                return reply.code(500).send({ ok: false, message: "Internal server error" } as ApiResponse);
            }
        }
    );
}
