import { FastifyInstance } from "fastify";
import { requireAdmin, requireSystemAdmin } from "../middleware/auth";
import { affiliateManager } from "../services/affiliate";
import { ApiResponse } from "../types";
import { z } from "zod";

export async function payoutRoutes(fastify: FastifyInstance) {
    // Admin: Get payout queue
    fastify.get(
        "/admin/payouts/queue",
        { onRequest: [requireSystemAdmin] },
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
        { onRequest: [requireSystemAdmin] },
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

    // Admin: Release pending holds to available (for testing / manual override)
    fastify.post(
        "/admin/payouts/release-holds",
        { onRequest: [requireSystemAdmin] },
        async (request, reply) => {
            try {
                const { prisma } = await import("../db");
                const { logger } = await import("../logger");
                const now = new Date();
                const updated = await prisma.rewardTransaction.updateMany({
                    where: {
                        status: "pending",
                        holdEndsAt: { lte: now },
                    },
                    data: { status: "available" },
                });
                logger.info({ count: updated.count }, "Admin manually released holds");
                return reply.send({
                    ok: true,
                    message: `Released ${updated.count} pending hold(s) to available.`,
                    data: { released: updated.count },
                } as ApiResponse);
            } catch (err: unknown) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: Fund test Stripe balance (SANDBOX ONLY)
    fastify.post(
        "/admin/payouts/fund-test-balance",
        { onRequest: [requireSystemAdmin] },
        async (request, reply) => {
            const { env } = await import("../env");
            if (env.NODE_ENV === "production") {
                return reply.code(403).send({ ok: false, message: "Not available in production" });
            }
            if (!env.STRIPE_API_KEY) {
                return reply.code(400).send({ ok: false, message: "Stripe not configured" });
            }
            try {
                const Stripe = (await import("stripe")).default;
                const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2024-06-20" as any });

                // Check current balance first
                const balance = await stripe.balance.retrieve();
                const available = balance.available.reduce((s, b) => s + b.amount, 0);

                if (available >= 100000) { // Already $1000+
                    return reply.send({
                        ok: true,
                        message: `Platform already has $${(available / 100).toFixed(2)} available. No topup needed.`,
                        data: { available: available / 100 },
                    } as ApiResponse);
                }

                // Create a test topup
                const topup = await stripe.topups.create({
                    amount: 500000, // $5,000
                    currency: "usd",
                    description: "Sandbox: test platform balance topup",
                });

                fastify.log.info({ topupId: topup.id, status: topup.status }, "Test balance topup created");

                return reply.send({
                    ok: true,
                    message: `Topup of $5,000 created (status: ${topup.status}). May take a moment to reflect.`,
                    data: { topupId: topup.id, status: topup.status },
                } as ApiResponse);
            } catch (err: any) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: err.message });
            }
        }
    );
}
