"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadRoutes = leadRoutes;
const lead_1 = require("../services/lead");
const auth_1 = require("../middleware/auth");
async function leadRoutes(fastify) {
    fastify.addHook("preHandler", auth_1.authenticate);
    // GET /leads - List all leads for the tenant
    fastify.get("/", async (request, reply) => {
        const { tenantId } = request.user;
        try {
            const leads = await lead_1.leadService.getLeadsByTenant(tenantId);
            return { ok: true, data: leads };
        }
        catch (err) {
            return reply.code(500).send({ ok: false, message: "Failed to fetch leads" });
        }
    });
    // PATCH /leads/:id - Update lead status (e.g. isBooked)
    fastify.patch("/:id", {
        schema: {
            params: {
                type: 'object',
                properties: {
                    id: { type: 'string' }
                }
            },
            body: {
                type: 'object',
                properties: {
                    isBooked: { type: 'boolean' }
                }
            }
        }
    }, async (request, reply) => {
        const { id } = request.params;
        const { isBooked } = request.body;
        try {
            const lead = await lead_1.leadService.updateLeadStatus(id, isBooked);
            return { ok: true, data: lead };
        }
        catch (err) {
            return reply.code(500).send({ ok: false, message: "Failed to update lead status" });
        }
    });
}
