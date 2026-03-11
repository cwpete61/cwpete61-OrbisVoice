"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageRoutes = packageRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
const PackageSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    price: zod_1.z.number().positive(),
    credits: zod_1.z.number().int().positive(),
    active: zod_1.z.boolean().optional().default(true),
});
const UpdatePackageSchema = PackageSchema.partial();
async function packageRoutes(fastify) {
    // List all packages (public or authenticated)
    fastify.get("/packages", async (request, reply) => {
        try {
            const packages = await db_1.prisma.conversationPackage.findMany({
                where: { active: true },
                orderBy: { price: "asc" },
            });
            return reply.code(200).send({
                ok: true,
                message: "Packages retrieved",
                data: packages,
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to list packages");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: List all packages (including inactive)
    fastify.get("/admin/packages", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const packages = await db_1.prisma.conversationPackage.findMany({
                orderBy: { price: "asc" },
            });
            return reply.code(200).send({
                ok: true,
                message: "All packages retrieved",
                data: packages,
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to list admin packages");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: Create package
    fastify.post("/admin/packages", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const body = PackageSchema.parse(request.body);
            const pkg = await db_1.prisma.conversationPackage.create({
                data: body,
            });
            logger_1.logger.info({ packageId: pkg.id }, "Conversation package created");
            return reply.code(201).send({
                ok: true,
                message: "Package created",
                data: pkg,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({
                    ok: false,
                    message: "Validation error",
                    data: err.errors,
                });
            }
            logger_1.logger.error(err, "Failed to create package");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: Update package
    fastify.put("/admin/packages/:id", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            const body = UpdatePackageSchema.parse(request.body);
            const pkg = await db_1.prisma.conversationPackage.update({
                where: { id },
                data: body,
            });
            logger_1.logger.info({ packageId: id }, "Conversation package updated");
            return reply.code(200).send({
                ok: true,
                message: "Package updated",
                data: pkg,
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({
                    ok: false,
                    message: "Validation error",
                    data: err.errors,
                });
            }
            logger_1.logger.error(err, "Failed to update package");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Admin: Delete package
    fastify.delete("/admin/packages/:id", { onRequest: [auth_1.requireAdmin] }, async (request, reply) => {
        try {
            const { id } = request.params;
            await db_1.prisma.conversationPackage.delete({
                where: { id },
            });
            logger_1.logger.info({ packageId: id }, "Conversation package deleted");
            return reply.code(200).send({
                ok: true,
                message: "Package deleted",
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to delete package");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
