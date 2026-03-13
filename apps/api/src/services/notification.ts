import { prisma } from "../db";
import { logger } from "../logger";
import { env } from "../env";
import nodemailer from "nodemailer";

// ─── Event type constants ─────────────────────────────────────────────────────
export const NotifType = {
    COMMISSION_EARNED: "COMMISSION_EARNED",
    PAYOUT_PROCESSED: "PAYOUT_PROCESSED",
    PAYOUT_SCHEDULED: "PAYOUT_SCHEDULED",
    TAX_HOLD_TRIGGERED: "TAX_HOLD_TRIGGERED",
    TAX_HOLD_LIFTED: "TAX_HOLD_LIFTED",
    LEAD_CAPTURED: "LEAD_CAPTURED",
    REFERRAL_CONVERTED: "REFERRAL_CONVERTED",
    USAGE_WARNING: "USAGE_WARNING",
    SUBSCRIPTION_EXPIRING: "SUBSCRIPTION_EXPIRING",
    SYSTEM_ANNOUNCEMENT: "SYSTEM_ANNOUNCEMENT",
    ADMIN_MANUAL: "ADMIN_MANUAL",
    EMAIL_VERIFICATION: "EMAIL_VERIFICATION",
} as const;

export type NotifTypeKey = (typeof NotifType)[keyof typeof NotifType];

interface CreateNotifOptions {
    userId: string;
    type: NotifTypeKey;
    title: string;
    body: string;
    data?: Record<string, any>;
    sendEmail?: boolean; // override; if undefined, uses user prefs
}

// ─── Get SMTP transporter from SystemEmailConfig ──────────────────────────────
async function getTransporter() {
    try {
        const cfg = await prisma.systemEmailConfig.findUnique({ where: { id: "global" } });
        if (!cfg?.smtpServer || !cfg?.username || !cfg?.password) return null;

        const port = Number(cfg.smtpPort || 587);
        const secure = port === 465 || cfg.smtpSecurity === "SSL";

        return nodemailer.createTransport({
            host: cfg.smtpServer,
            port,
            secure,
            auth: { user: cfg.username, pass: cfg.password },
        });
    } catch {
        return null;
    }
}

// ─── Core function ────────────────────────────────────────────────────────────
export async function createNotification(opts: CreateNotifOptions) {
    try {
        const { userId, type, title, body, data, sendEmail } = opts;

        // Look up user email prefs
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, emailNotifications: true },
        });
        if (!user) return;

        const pref = await prisma.notificationPreference.findUnique({ where: { userId } });

        // Save in-app notification
        const notif = await prisma.notification.create({
            data: { userId, type, title, body, data: data ?? undefined },
        });

        // Determine if email should be sent
        const settings = await prisma.platformSettings.findFirst({ where: { id: "global" } });
        const globalEmail = settings?.globalEmailEnabled ?? true;
        
        const masterEmail = user.emailNotifications ?? true;
        const typeEnabled = getTypeEnabled(type, pref);
        const shouldEmail = globalEmail && (sendEmail !== undefined ? sendEmail : (masterEmail && typeEnabled));

        if (shouldEmail) {
            const emailSent = await sendEmailNotification({
                to: user.email,
                name: user.name,
                type,
                title,
                body,
            });
            if (emailSent) {
                await prisma.notification.update({ where: { id: notif.id }, data: { emailSent: true } });
            }
        }

        return notif;
    } catch (err) {
        logger.error(err, "Failed to create notification");
    }
}

// Determine if a specific event type is enabled in the user's prefs
function getTypeEnabled(type: NotifTypeKey, pref: any): boolean {
    if (!pref) return true; // default all on
    switch (type) {
        case NotifType.COMMISSION_EARNED: return pref.commissions ?? true;
        case NotifType.PAYOUT_PROCESSED:
        case NotifType.PAYOUT_SCHEDULED:
        case NotifType.TAX_HOLD_TRIGGERED:
        case NotifType.TAX_HOLD_LIFTED: return pref.payouts ?? true;
        case NotifType.LEAD_CAPTURED: return pref.leads ?? true;
        case NotifType.USAGE_WARNING:
        case NotifType.SUBSCRIPTION_EXPIRING: return pref.usageWarnings ?? true;
        case NotifType.SYSTEM_ANNOUNCEMENT:
        case NotifType.ADMIN_MANUAL: return pref.announcements ?? true;
        default: return true;
    }
}

// ─── Email sender ─────────────────────────────────────────────────────────────
async function sendEmailNotification({
    to, name, type, title, body,
}: { to: string; name: string; type: string; title: string; body: string }) {
    try {
        const transport = await getTransporter();
        
        // Look up custom template if exists
        const template = await prisma.notificationTemplate.findUnique({ where: { type } });
        const subject = template?.subject ?? title;
        const html = template?.bodyHtml
            ? template.bodyHtml
                .replace("{{name}}", name)
                .replace("{{title}}", title)
                .replace("{{body}}", body)
            : `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;">
           <h2 style="color:#14b8a6;">${title}</h2>
           <p style="color:#555;">Hi ${name},</p>
           <p style="color:#333;">${body}</p>
           <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
           <p style="color:#999;font-size:12px;">OrbisVoice · You can manage email notifications in Settings.</p>
         </div>`;

        if (!transport) {
            if (env.EMAIL_PROVIDER === "console" || process.env.NODE_ENV !== "production") {
                logger.info({ to, subject, body }, "📧 [EMAIL CONSOLE FALLBACK]");
                console.log("\n--- EMAIL EMULATION ---");
                console.log(`To: ${to}`);
                console.log(`Subject: ${subject}`);
                console.log(`Body: ${body}`);
                console.log("-----------------------\n");
                return true;
            }
            return false;
        }

        const config = await prisma.systemEmailConfig.findUnique({ where: { id: "global" } });
        
        await transport.sendMail({
            from: `"OrbisVoice App" <${config?.username || "noreply@orbisvoice.app"}>`,
            to,
            subject,
            html,
        });
        return true;
    } catch (err) {
        logger.error(err, "Failed to send email notification");
        return false;
    }
}

// ─── Broadcast to all users ───────────────────────────────────────────────────
export async function broadcastNotification(opts: Omit<CreateNotifOptions, "userId">) {
    try {
        const users = await prisma.user.findMany({ select: { id: true } });
        await Promise.allSettled(users.map((u: any) => createNotification({ ...opts, userId: u.id })));
    } catch (err) {
        logger.error(err, "Failed to broadcast notification");
    }
}

// ─── Seed default templates ───────────────────────────────────────────────────
export async function seedDefaultTemplates() {
    const defaults = [
        {
            type: NotifType.COMMISSION_EARNED,
            subject: "🎉 Commission Earned — {{title}}",
            bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;"><h2 style="color:#14b8a6;">{{title}}</h2><p>Hi {{name}},</p><p>{{body}}</p><p style="color:#999;font-size:12px;">OrbisVoice</p></div>`,
        },
        {
            type: NotifType.PAYOUT_PROCESSED,
            subject: "✅ Payout Processed — {{title}}",
            bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;"><h2 style="color:#10b981;">{{title}}</h2><p>Hi {{name}},</p><p>{{body}}</p><p style="color:#999;font-size:12px;">OrbisVoice</p></div>`,
        },
        {
            type: NotifType.TAX_HOLD_TRIGGERED,
            subject: "⚠️ Action Required: Tax Information Needed",
            bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;"><h2 style="color:#f97316;">{{title}}</h2><p>Hi {{name}},</p><p>{{body}}</p><p>Please log in to complete your tax information to restore payout eligibility.</p><p style="color:#999;font-size:12px;">OrbisVoice</p></div>`,
        },
        {
            type: NotifType.TAX_HOLD_LIFTED,
            subject: "✅ Payout Hold Lifted — Payouts Resumed",
            bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;"><h2 style="color:#14b8a6;">{{title}}</h2><p>Hi {{name}},</p><p>{{body}}</p><p style="color:#999;font-size:12px;">OrbisVoice</p></div>`,
        },
        {
            type: NotifType.LEAD_CAPTURED,
            subject: "🎯 New Lead Captured",
            bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;"><h2 style="color:#a78bfa;">{{title}}</h2><p>Hi {{name}},</p><p>{{body}}</p><p style="color:#999;font-size:12px;">OrbisVoice</p></div>`,
        },
        {
            type: NotifType.REFERRAL_CONVERTED,
            subject: "🎉 Referral Converted — You Earned a Reward!",
            bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;"><h2 style="color:#14b8a6;">{{title}}</h2><p>Hi {{name}},</p><p>{{body}}</p><p style="color:#999;font-size:12px;">OrbisVoice</p></div>`,
        },
        {
            type: NotifType.USAGE_WARNING,
            subject: "⚠️ Usage Limit Warning",
            bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;"><h2 style="color:#f59e0b;">{{title}}</h2><p>Hi {{name}},</p><p>{{body}}</p><p style="color:#999;font-size:12px;">OrbisVoice</p></div>`,
        },
        {
            type: NotifType.SYSTEM_ANNOUNCEMENT,
            subject: "📢 OrbisVoice Announcement",
            bodyHtml: `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:32px;"><h2 style="color:#14b8a6;">{{title}}</h2><p>Hi {{name}},</p><p>{{body}}</p><p style="color:#999;font-size:12px;">OrbisVoice</p></div>`,
        },
    ];

    for (const t of defaults) {
        await prisma.notificationTemplate.upsert({
            where: { type: t.type },
            update: {},
            create: t,
        });
    }
}
