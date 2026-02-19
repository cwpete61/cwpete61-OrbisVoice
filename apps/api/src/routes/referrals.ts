import { FastifyInstance } from "fastify";
import { prisma } from "../db";
import { logger } from "../logger";
import { ApiResponse } from "../types";
import { authenticate } from "../middleware/auth";
import { FastifyRequest } from "fastify";
import { referralManager } from "../services/referral";
import { env } from "../env";

export async function referralRoutes(fastify: FastifyInstance) {
  // Get referral code for user
  fastify.get("/users/me/referral-code", { onRequest: [authenticate] }, async (request: FastifyRequest, reply) => {
    try {
      const userId = (request as any).user.userId;

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
      const userId = (request as any).user.userId;

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
        const userId = (request as any).user.userId;
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
          data: {
            reward: result.reward,
            message: `You've received $${result.reward} credit!`,
          },
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
}
