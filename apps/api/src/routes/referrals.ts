import { FastifyInstance } from "fastify";
import { logger } from "../logger";
import { ApiResponse, AuthPayload } from "../types";
import { authenticate } from "../middleware/auth";
import { FastifyRequest } from "fastify";
import { referralManager } from "../services/referral";
import { env } from "../env";

export async function referralRoutes(fastify: FastifyInstance) {
  // Get referral code for user
  fastify.get("/users/me/referral-code", { onRequest: [authenticate] }, async (request: FastifyRequest, reply) => {
    try {
      const userId = (request.user as AuthPayload).userId;

      const code = await referralManager.getOrCreateCode(userId);

      return reply.code(200).send({
        ok: true,
        message: "Referral code retrieved",
        data: {
          code,
          shareUrl: `${env.WEB_URL}/signup?ref=${code}`,
        },
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get referral code");
      return reply.code(500).send({
        ok: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  });

  // Get referral stats
  fastify.get("/users/me/referral-stats", { onRequest: [authenticate] }, async (request: FastifyRequest, reply) => {
    try {
      const userId = (request.user as AuthPayload).userId;

      const stats = await referralManager.getReferralStats(userId);

      return reply.code(200).send({
        ok: true,
        message: "Referral stats retrieved",
        data: stats,
      } as ApiResponse);
    } catch (err) {
      logger.error(err, "Failed to get referral stats");
      return reply.code(500).send({
        ok: false,
        message: "Internal server error",
      } as ApiResponse);
    }
  });

  // Redeem referral code (called during signup)
  fastify.post<{ Body: { referralCode: string } }>(
    "/users/redeem-referral",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const userId = (request.user as AuthPayload).userId;
        const { referralCode } = request.body as { referralCode: string };

        if (!referralCode || referralCode.trim() === "") {
          return reply.code(400).send({
            ok: false,
            message: "Referral code is required",
          } as ApiResponse);
        }

        const result = await referralManager.redeemReferral(referralCode, userId);

        if (!result.success) {
          return reply.code(400).send({
            ok: false,
            message: "Invalid or expired referral code",
          } as ApiResponse);
        }

        return reply.code(200).send({
          ok: true,
          message: "Referral code redeemed",
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to redeem referral code");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );

  // Manual trigger to process holds (useful for testing/admin)
  fastify.post(
    "/referrals/process-holds",
    { onRequest: [authenticate] },
    async (request: FastifyRequest, reply) => {
      try {
        const count = await referralManager.clearPendingHolds();
        return reply.code(200).send({
          ok: true,
          message: `Processed ${count} pending holds`,
          data: { count }
        } as ApiResponse);
      } catch (err) {
        logger.error(err, "Failed to process holds");
        return reply.code(500).send({
          ok: false,
          message: "Internal server error",
        } as ApiResponse);
      }
    }
  );
}
