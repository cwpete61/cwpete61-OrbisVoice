import { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { prisma } from "../db";
import { ApiResponse } from "../types";
import { authenticate } from "../middleware/auth";

const TwilioConfigSchema = z.object({
    accountSid: z.string().min(1, "Account SID is required"),
    authToken: z.string().min(1, "Auth Token is required"),
    phoneNumber: z.string().min(1, "Phone Number is required"),
});

export default async function twilioRoutes(fastify: FastifyInstance) {
    // Get Twilio config for tenant
    fastify.get(
        "/twilio/config",
        { onRequest: [authenticate] },
        async (request: FastifyRequest, reply) => {
            try {
                const tenantId = (request as any).user.tenantId;

                const config = await prisma.tenantTwilioConfig.findUnique({
                    where: { tenantId },
                });

                return reply.send({
                    ok: true,
                    data: config || {
                        accountSid: "",
                        authToken: "",
                        phoneNumber: "",
                    },
                } as ApiResponse);
            } catch (err) {
                fastify.log.error({ err }, "Failed to fetch Twilio config");
                return reply.code(500).send({
                    ok: false,
                    message: "Internal server error",
                } as ApiResponse);
            }
        }
    );

    // Update Twilio config for tenant
    fastify.put<{ Body: z.infer<typeof TwilioConfigSchema> }>(
        "/twilio/config",
        { onRequest: [authenticate] },
        async (request, reply) => {
            try {
                const tenantId = (request as any).user.tenantId;
                const body = TwilioConfigSchema.parse(request.body);

                const config = await prisma.tenantTwilioConfig.upsert({
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
                } as ApiResponse);
            } catch (err) {
                if (err instanceof z.ZodError) {
                    return reply.code(400).send({
                        ok: false,
                        message: "Validation error",
                        data: err.errors,
                    } as ApiResponse);
                }

                fastify.log.error({ err }, "Failed to update Twilio config");
                return reply.code(500).send({
                    ok: false,
                    message: "Internal server error",
                } as ApiResponse);
            }
        }
    );
}
