import { FastifyInstance } from "fastify";
import { authenticate, requireAdmin } from "../middleware/auth";
import { affiliateManager } from "../services/affiliate";
import { prisma } from "../db";
import { ApiResponse } from "../types";
import { z } from "zod";

export async function affiliateRoutes(fastify: FastifyInstance) {
    // Get current user's affiliate status and stats
    fastify.get(
        "/affiliates/me",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as any).userId;
                const stats = await affiliateManager.getStats(userId);

                if (!stats) {
                    return reply.send({
                        ok: true,
                        data: { isAffiliate: false },
                    } as ApiResponse);
                }

                return reply.send({
                    ok: true,
                    data: {
                        isAffiliate: true,
                        ...stats,
                    },
                } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Apply for affiliate status
    fastify.post(
        "/affiliates/apply",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const userId = (request.user as any).userId;
                const result = await affiliateManager.applyForAffiliate(userId);

                if (!result.success) {
                    return reply.code(400).send({ ok: false, message: result.message });
                }

                return reply.send({
                    ok: true,
                    message: "Application submitted successfully",
                    data: result.data,
                } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: List all affiliate applications
    fastify.get(
        "/admin/affiliates",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const affiliates = await prisma.affiliate.findMany({
                    include: {
                        user: {
                            select: { name: true, email: true, username: true },
                        },
                    },
                    orderBy: { createdAt: "desc" },
                });

                return reply.send({ ok: true, data: affiliates } as ApiResponse);
            } catch (err) {
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: Update affiliate status
    const UpdateStatusSchema = z.object({
        status: z.enum(["PENDING", "ACTIVE", "REJECTED"]),
    });

    fastify.post<{ Params: { id: string }; Body: z.infer<typeof UpdateStatusSchema> }>(
        "/admin/affiliates/:id/status",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { id } = request.params;
                const { status } = UpdateStatusSchema.parse(request.body);

                const updated = await prisma.affiliate.update({
                    where: { id },
                    data: { status },
                });

                return reply.send({
                    ok: true,
                    message: `Affiliate status updated to ${status}`,
                    data: updated,
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Invalid status" });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );

    // Admin: Promote user to affiliate directly
    const PromoteSchema = z.object({
        userId: z.string(),
    });

    fastify.post<{ Body: z.infer<typeof PromoteSchema> }>(
        "/admin/affiliates/promote",
        { onRequest: [requireAdmin] },
        async (request, reply) => {
            try {
                const { userId } = PromoteSchema.parse(request.body);
                // We pass "ACTIVE" to skip the pending state for manual admin promotion
                const result = await affiliateManager.applyForAffiliate(userId, "ACTIVE");

                if (!result.success) {
                    return reply.code(400).send({ ok: false, message: result.message });
                }

                return reply.send({
                    ok: true,
                    message: "User promoted to affiliate successfully",
                    data: result.data,
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({ ok: false, message: "Missing userId" });
                }
                fastify.log.error(err);
                return reply.code(500).send({ ok: false, message: "Server error" });
            }
        }
    );
}
