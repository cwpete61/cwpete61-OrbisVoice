import { FastifyInstance } from "fastify";
import { leadService } from "../services/lead";
import { authenticate } from "../middleware/auth";
import { ApiResponse, AuthPayload } from "../types";

export async function leadRoutes(fastify: FastifyInstance) {
    fastify.addHook("preHandler", authenticate);

    // GET /leads - List all leads for the tenant
    fastify.get("/", async (request, reply) => {
        const { tenantId } = request.user as AuthPayload;
        try {
            const leads = await leadService.getLeadsByTenant(tenantId);
            return { ok: true, data: leads } as ApiResponse;
        } catch (err) {
            return reply.code(500).send({ ok: false, message: "Failed to fetch leads" } as ApiResponse);
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
        const { id } = request.params as any;
        const { isBooked } = request.body as any;

        try {
            const lead = await leadService.updateLeadStatus(id, isBooked);
            return { ok: true, data: lead } as ApiResponse;
        } catch (err) {
            return reply.code(500).send({ ok: false, message: "Failed to update lead status" } as ApiResponse);
        }
    });
}
