import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { requireAdmin } from "../middleware/auth";
import { FastifyRequest } from "fastify";

const PackageSchema = z.object({
    name: z.string().min(1),
    price: z.number().positive(),
    credits: z.number().int().positive(),
    active: z.boolean().optional().default(true),
});

const UpdatePackageSchema = PackageSchema.partial();

export async function packageRoutes(fastify: FastifyInstance) {
    // List all packages (public or authenticated)
    fastify.get("/packages", async (request, reply) => {
        try {
            const packages = await prisma.conversationPackage.findMany({
                where: { active: true },
                orderBy: { price: "asc" },
            });
            return reply.code(200).send({
                ok: true,
                message: "Packages retrieved",
                data: packages,
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to list packages");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            } as ApiResponse);
        }
    });

    // Admin: List all packages (including inactive)
    fastify.get("/admin/packages", { onRequest: [requireAdmin] }, async (request, reply) => {
        try {
            const packages = await prisma.conversationPackage.findMany({
                orderBy: { price: "asc" },
            });
            return reply.code(200).send({
                ok: true,
                message: "All packages retrieved",
                data: packages,
            } as ApiResponse);
        } catch (err) {
            logger.error(err, "Failed to list admin packages");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            } as ApiResponse);
        }
    });

    // Admin: Create package
    fastify.post<{ Body: z.infer<typeof PackageSchema> }>(
        "/admin/packages",
        { onRequest: [requireAdmin] },
        async (request: FastifyRequest, reply) => {
            try {
                const body = PackageSchema.parse(request.body);
                const pkg = await prisma.conversationPackage.create({
                    data: body,
                });

                logger.info({ packageId: pkg.id }, "Conversation package created");
                return reply.code(201).send({
                    ok: true,
                    message: "Package created",
                    data: pkg,
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({
                        ok: false,
                        message: "Validation error",
                        data: err.errors,
                    } as ApiResponse);
                }
                logger.error(err, "Failed to create package");
                return reply.code(500).send({
                    ok: false,
                    message: "Internal server error",
                } as ApiResponse);
            }
        }
    );

    // Admin: Update package
    fastify.put<{ Params: { id: string }; Body: z.infer<typeof UpdatePackageSchema> }>(
        "/admin/packages/:id",
        { onRequest: [requireAdmin] },
        async (request: FastifyRequest, reply) => {
            try {
                const { id } = request.params as { id: string };
                const body = UpdatePackageSchema.parse(request.body);

                const pkg = await prisma.conversationPackage.update({
                    where: { id },
                    data: body,
                });

                logger.info({ packageId: id }, "Conversation package updated");
                return reply.code(200).send({
                    ok: true,
                    message: "Package updated",
                    data: pkg,
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({
                        ok: false,
                        message: "Validation error",
                        data: err.errors,
                    } as ApiResponse);
                }
                logger.error(err, "Failed to update package");
                return reply.code(500).send({
                    ok: false,
                    message: "Internal server error",
                } as ApiResponse);
            }
        }
    );

    // Admin: Delete package
    fastify.delete<{ Params: { id: string } }>(
        "/admin/packages/:id",
        { onRequest: [requireAdmin] },
        async (request: FastifyRequest, reply) => {
            try {
                const { id } = request.params as { id: string };
                await prisma.conversationPackage.delete({
                    where: { id },
                });

                logger.info({ packageId: id }, "Conversation package deleted");
                return reply.code(200).send({
                    ok: true,
                    message: "Package deleted",
                } as ApiResponse);
            } catch (err) {
                logger.error(err, "Failed to delete package");
                return reply.code(500).send({
                    ok: false,
                    message: "Internal server error",
                } as ApiResponse);
            }
        }
    );
}
