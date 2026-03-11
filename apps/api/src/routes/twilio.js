"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = twilioRoutes;
const zod_1 = require("zod");
const db_1 = require("../db");
const auth_1 = require("../middleware/auth");
const TwilioConfigSchema = zod_1.z.object({
    accountSid: zod_1.z.string().min(1, "Account SID is required"),
    authToken: zod_1.z.string().min(1, "Auth Token is required"),
    phoneNumber: zod_1.z.string().min(1, "Phone Number is required"),
});
async function twilioRoutes(fastify) {
    // Get Twilio config for tenant
    fastify.get("/twilio/config", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const tenantId = request.user.tenantId;
            const config = await db_1.prisma.tenantTwilioConfig.findUnique({
                where: { tenantId },
            });
            return reply.send({
                ok: true,
                data: config || {
                    accountSid: "",
                    authToken: "",
                    phoneNumber: "",
                },
            });
        }
        catch (err) {
            fastify.log.error({ err }, "Failed to fetch Twilio config");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Update Twilio config for tenant
    fastify.put("/twilio/config", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const tenantId = request.user.tenantId;
            const body = TwilioConfigSchema.parse(request.body);
            const config = await db_1.prisma.tenantTwilioConfig.upsert({
                where: { tenantId },
                update: {
                    accountSid: body.accountSid,
                    authToken: body.authToken,
                    phoneNumber: body.phoneNumber,
                },
                create: {
                    tenantId,
                    accountSid: body.accountSid,
                    authToken: body.authToken,
                    phoneNumber: body.phoneNumber,
                },
            });
            return reply.send({
                ok: true,
                data: config,
                message: "Twilio configuration updated successfully",
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
            fastify.log.error({ err }, "Failed to update Twilio config");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
