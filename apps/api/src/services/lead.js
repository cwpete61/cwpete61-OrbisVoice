"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadService = void 0;
const db_1 = require("../db");
const logger_1 = require("../logger");
const notification_1 = require("./notification");
class LeadService {
    async captureLead(data) {
        try {
            const lead = await db_1.prisma.lead.create({
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
            logger_1.logger.info({ leadId: lead.id, tenantId: data.tenantId }, "Lead captured successfully");
            // Trigger notification to all users of the tenant
            const users = await db_1.prisma.user.findMany({ where: { tenantId: data.tenantId } });
            await Promise.allSettled(users.map(u => (0, notification_1.createNotification)({
                userId: u.id,
                type: notification_1.NotifType.LEAD_CAPTURED,
                title: "New Lead Captured!",
                body: `You received a new lead from ${data.name}.`,
                data: { leadId: lead.id, name: data.name, phone: data.phone }
            })));
            return lead;
        }
        catch (err) {
            logger_1.logger.error({ err, data }, "Failed to capture lead");
            throw err;
        }
    }
    async getLeadsByTenant(tenantId) {
        return db_1.prisma.lead.findMany({
            where: { tenantId },
            orderBy: { createdAt: "desc" },
            include: {
                agent: {
                    select: { name: true }
                }
            }
        });
    }
    async updateLeadStatus(leadId, isBooked) {
        return db_1.prisma.lead.update({
            where: { id: leadId },
            data: { isBooked },
        });
    }
}
exports.leadService = new LeadService();
