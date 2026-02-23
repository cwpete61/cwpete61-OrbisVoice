import { logger } from "../logger";
import { env } from "../env";

export interface PushNotificationPayload {
    title: string;
    body: string;
    data?: Record<string, string>;
}

class NotificationService {
    private fcmInitialized = false;

    async initialize() {
        // This will be expanded when we add the Firebase Admin SDK dependency
        // and provide the service account key.
        logger.info("Notification service initialized");
        this.fcmInitialized = true;
    }

    async sendLeadNotification(lead: any) {
        const payload: PushNotificationPayload = {
            title: "New Lead Captured! 🚀",
            body: `VoiceAgent engaged with ${lead.name || 'a new prospect'}.`,
            data: {
                leadId: lead.id,
                type: "lead_captured",
            },
        };

        logger.info({ leadId: lead.id, payload }, "Triggering lead notification");

        // 1. Send Push Notification via Firebase
        await this.sendPush(payload, lead.tenantId);

        // 2. Add Socket.io/WebSocket notification for Desktop here
        // gateway.notifyTenant(lead.tenantId, payload);
    }

    async sendSummaryNotification(transcript: any, summary: string) {
        const payload: PushNotificationPayload = {
            title: "Conversation Summary",
            body: summary,
            data: {
                transcriptId: transcript.id,
                type: "session_summary",
            },
        };

        logger.info({ transcriptId: transcript.id }, "Triggering summary notification");
        await this.sendPush(payload, transcript.userId); // userId or tenantId
    }

    private async sendPush(payload: PushNotificationPayload, recipientId: string) {
        if (!this.fcmInitialized) {
            logger.warn("FCM not initialized, skipping push notification");
            return;
        }

        // This is where admin.messaging().send() will go
        logger.info({ recipientId, payload }, "Push notification sent (MOCK)");
    }
}

export const notificationService = new NotificationService();
