import { FastifyInstance } from "fastify";
import { prisma } from "../db";

export async function commerceBridgeRoutes(fastify: FastifyInstance) {
  // Authentication: Check internal service key
  fastify.addHook("onRequest", async (request, reply) => {
    const serviceKey = request.headers["x-service-key"];
    if (serviceKey !== process.env.INTERNAL_SERVICE_KEY) {
      reply.code(401).send({ error: "Unauthorized: Invalid service key" });
    }
  });

  fastify.post("/api/commerce/finalize", async (request, reply) => {
    const { userId, type, payload } = request.body as any;

    if (type === "credit_purchase") {
      const { amount } = payload;
      // Add credits to account via the user's tenant
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { tenantId: true },
      });

      if (user) {
        await prisma.tenant.update({
          where: { id: user.tenantId },
          data: {
            creditBalance: { increment: amount },
          },
        });
      }
      return { success: true };
    }

    if (type === "subscription_change") {
      // Logic to update subscription tier in core DB
      // ... existing billing logic ...
      return { success: true };
    }

    return reply.code(400).send({ error: "Unknown fulfillment type" });
  });
}
