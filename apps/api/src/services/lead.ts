import { prisma } from "../db";
import { logger } from "../logger";
import { notificationService } from "./notification";

export interface LeadData {
    name: string;
    phone: string;
    email?: string;
    agentId: string;
    tenantId: string;
    summary?: string;
    metadata?: Record<string, any>;
}

class LeadService {
    async captureLead(data: LeadData) {
        try {
            const lead = await prisma.lead.create({
                data: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email,
                    agentId: data.agentId,
                    tenantId: data.tenantId,
                    summary: data.summary,
                    metadata: data.metadata ? JSON.stringify(data.metadata) : null,
                },
            });

            logger.info({ leadId: lead.id, tenantId: data.tenantId }, "Lead captured successfully");

            // Trigger notification
            await notificationService.sendLeadNotification(lead);

            return lead;
        } catch (err) {
            logger.error({ err, data }, "Failed to capture lead");
            throw err;
        }
    }

    async getLeadsByTenant(tenantId: string) {
        return prisma.lead.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            include: {
                agent: {
                    select: { name: true }
                }
            }
        });
    }

    async updateLeadStatus(leadId: string, isBooked: boolean) {
        return prisma.lead.update({
            where: { id: leadId },
            data: { isBooked },
        });
    }
}

export const leadService = new LeadService();
