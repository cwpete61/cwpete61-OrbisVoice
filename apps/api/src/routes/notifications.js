"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRoutes = notificationRoutes;
const db_1 = require("../db");
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
const notification_1 = require("../services/notification");
async function notificationRoutes(fastify) {
    // ── GET /notifications — user inbox ──────────────────────────────────────
    fastify.get("/notifications", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { page = "1", limit = "30", unreadOnly = "false" } = request.query;
            const skip = (Number(page) - 1) * Number(limit);
            const where = { userId };
            if (unreadOnly === "true")
                where.read = false;
            const [notifications, total, unreadCount] = await Promise.all([
                db_1.prisma.notification.findMany({ where, orderBy: { createdAt: "desc" }, skip, take: Number(limit) }),
                db_1.prisma.notification.count({ where }),
                db_1.prisma.notification.count({ where: { userId, read: false } }),
            ]);
            return reply.code(200).send({ ok: true, data: { notifications, total, unreadCount, page: Number(page) } });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get notifications");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── POST /notifications/mark-read ────────────────────────────────────────
    fastify.post("/notifications/mark-read", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { ids, all } = request.body;
            if (all) {
                await db_1.prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
            }
            else if (ids?.length) {
                await db_1.prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { read: true } });
            }
            return reply.code(200).send({ ok: true, message: "Marked as read" });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to mark notifications read");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── GET /notifications/preferences ───────────────────────────────────────
    fastify.get("/notifications/preferences", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const [user, pref] = await Promise.all([
                db_1.prisma.user.findUnique({ where: { id: userId }, select: { emailNotifications: true } }),
                db_1.prisma.notificationPreference.findUnique({ where: { userId } }),
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
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get notification preferences");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── PUT /notifications/preferences ───────────────────────────────────────
    fastify.put("/notifications/preferences", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { emailNotifications, commissions, payouts, leads, usageWarnings, announcements } = request.body;
            // Update master email toggle on User
            if (typeof emailNotifications === "boolean") {
                await db_1.prisma.user.update({ where: { id: userId }, data: { emailNotifications } });
            }
            // Upsert per-type preferences
            await db_1.prisma.notificationPreference.upsert({
                where: { userId },
                create: { userId, commissions, payouts, leads, usageWarnings, announcements },
                update: { commissions, payouts, leads, usageWarnings, announcements },
            });
            return reply.code(200).send({ ok: true, message: "Preferences updated" });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to update notification preferences");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── POST /admin/notifications/send — manual blast ─────────────────────────
    fastify.post("/admin/notifications/send", { onRequest: [auth_1.requireSystemAdmin] }, async (request, reply) => {
        try {
            const { userIds, all, type = notification_1.NotifType.ADMIN_MANUAL, title, body, sendEmail } = request.body;
            if (!title || !body)
                return reply.code(400).send({ ok: false, message: "title and body are required" });
            if (all) {
                await (0, notification_1.broadcastNotification)({ type, title, body, sendEmail });
                return reply.code(200).send({ ok: true, message: "Broadcast sent to all users" });
            }
            if (!userIds?.length)
                return reply.code(400).send({ ok: false, message: "userIds or all:true required" });
            await Promise.allSettled(userIds.map((uid) => (0, notification_1.createNotification)({ userId: uid, type, title, body, sendEmail })));
            return reply.code(200).send({ ok: true, message: `Notification sent to ${userIds.length} user(s)` });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to send admin notification");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── GET /admin/notifications/templates ───────────────────────────────────
    fastify.get("/admin/notifications/templates", { onRequest: [auth_1.requireAdmin] }, async (_request, reply) => {
        try {
            await (0, notification_1.seedDefaultTemplates)(); // ensure defaults exist
            const templates = await db_1.prisma.notificationTemplate.findMany({ orderBy: { type: "asc" } });
            return reply.code(200).send({ ok: true, data: templates });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get templates");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
    // ── PUT /admin/notifications/templates/:type ──────────────────────────────
    fastify.put("/admin/notifications/templates/:type", { onRequest: [auth_1.requireSystemAdmin] }, async (request, reply) => {
        try {
            const { type } = request.params;
            const { subject, bodyHtml, enabled } = request.body;
            const template = await db_1.prisma.notificationTemplate.upsert({
                where: { type },
                create: { type, subject: subject ?? type, bodyHtml: bodyHtml ?? "", enabled: enabled ?? true },
                update: { subject, bodyHtml, enabled },
            });
            return reply.code(200).send({ ok: true, data: template });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to update template");
            return reply.code(500).send({ ok: false, message: "Internal server error" });
        }
    });
}
