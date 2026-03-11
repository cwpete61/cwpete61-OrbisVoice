"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.referralRoutes = referralRoutes;
const logger_1 = require("../logger");
const auth_1 = require("../middleware/auth");
const referral_1 = require("../services/referral");
const env_1 = require("../env");
async function referralRoutes(fastify) {
    // Get referral code for user
    fastify.get("/users/me/referral-code", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const code = await referral_1.referralManager.getOrCreateCode(userId);
            return reply.code(200).send({
                ok: true,
                message: "Referral code retrieved",
                data: {
                    code,
                    shareUrl: `${env_1.env.WEB_URL}/signup?ref=${code}`,
                },
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get referral code");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Get referral stats
    fastify.get("/users/me/referral-stats", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const stats = await referral_1.referralManager.getReferralStats(userId);
            return reply.code(200).send({
                ok: true,
                message: "Referral stats retrieved",
                data: stats,
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to get referral stats");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Redeem referral code (called during signup)
    fastify.post("/users/redeem-referral", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const userId = request.user.userId;
            const { referralCode } = request.body;
            if (!referralCode || referralCode.trim() === "") {
                return reply.code(400).send({
                    ok: false,
                    message: "Referral code is required",
                });
            }
            const result = await referral_1.referralManager.redeemReferral(referralCode, userId);
            if (!result.success) {
                return reply.code(400).send({
                    ok: false,
                    message: "Invalid or expired referral code",
                });
            }
            return reply.code(200).send({
                ok: true,
                message: "Referral code redeemed",
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to redeem referral code");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
    // Manual trigger to process holds (useful for testing/admin)
    fastify.post("/referrals/process-holds", { onRequest: [auth_1.authenticate] }, async (request, reply) => {
        try {
            const count = await referral_1.referralManager.clearPendingHolds();
            return reply.code(200).send({
                ok: true,
                message: `Processed ${count} pending holds`,
                data: { count }
            });
        }
        catch (err) {
            logger_1.logger.error(err, "Failed to process holds");
            return reply.code(500).send({
                ok: false,
                message: "Internal server error",
            });
        }
    });
}
