import { FastifyInstance } from "fastify";
import { requireAdmin } from "../middleware/auth";
import { affiliateManager } from "../services/affiliate";
import { ApiResponse } from "../types";
import { z } from "zod";

export async function payoutRoutes(fastify: FastifyInstance) {
    // Admin: Get payout queue
    fastify.get(
        "/admin/payouts/queue",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const queue = await affiliateManager.getPayoutQueue();
                return reply.send({ ok: true, data: queue } as ApiResponse);
            } catch (err: unknown) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: Bulk process payouts
    const BulkPayoutSchema = z.object({
        affiliateIds: z.array(z.string()),
    });

    fastify.post<{ Body: z.infer<typeof BulkPayoutSchema> }>(
        "/admin/payouts/bulk",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { affiliateIds } = BulkPayoutSchema.parse(request.body);
                const results: (Awaited<ReturnType<typeof affiliateManager.processPayout>> & { id: string })[] = [];

                for (const id of affiliateIds) {
                    const result = await affiliateManager.processPayout(id);
                    results.push({ id, ...result });
                }

                const successful = results.filter((r) => r.success).length;
                const failed = results.filter((r) => !r.success).length;

                return reply.send({
                    ok: true,
                    message: `Processed ${successful} payouts successfully, ${failed} failed.`,
                    data: results
                } as ApiResponse);
            } catch (err: unknown) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Invalid input" });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );
}
