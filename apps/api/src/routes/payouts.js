"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutRoutes = payoutRoutes;
const auth_1 = require("../middleware/auth");
const affiliate_1 = require("../services/affiliate");
const zod_1 = require("zod");
async function payoutRoutes(fastify) {
    // Admin: Get payout queue
    fastify.get("/admin/payouts/queue", { onRequest: [auth_1.requireSystemAdmin] }, async (request, reply) => {
        try {
            const queue = await affiliate_1.affiliateManager.getPayoutQueue();
            return reply.send({ ok: true, data: queue });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: Bulk process payouts
    const BulkPayoutSchema = zod_1.z.object({
        affiliateIds: zod_1.z.array(zod_1.z.string()),
    });
    fastify.post("/admin/payouts/bulk", { onRequest: [auth_1.requireSystemAdmin] }, async (request, reply) => {
        try {
            const { affiliateIds } = BulkPayoutSchema.parse(request.body);
            const results = [];
            for (const id of affiliateIds) {
                const result = await affiliate_1.affiliateManager.processPayout(id);
                results.push({ id, ...result });
            }
            const successful = results.filter((r) => r.success).length;
            const failed = results.filter((r) => !r.success).length;
            return reply.send({
                ok: true,
                message: `Processed ${successful} payouts successfully, ${failed} failed.`,
                data: results
            });
        }
        catch (err) {
            if (err instanceof zod_1.z.ZodError) {
                return reply.code(400).send({ ok: false, message: "Invalid input" });
            }
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: Release pending holds to available (for testing / manual override)
    fastify.post("/admin/payouts/release-holds", { onRequest: [auth_1.requireSystemAdmin] }, async (request, reply) => {
        try {
            const { prisma } = await Promise.resolve().then(() => __importStar(require("../db")));
            const { logger } = await Promise.resolve().then(() => __importStar(require("../logger")));
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
            });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: "Server error" });
        }
    });
    // Admin: Fund test Stripe balance (SANDBOX ONLY)
    fastify.post("/admin/payouts/fund-test-balance", { onRequest: [auth_1.requireSystemAdmin] }, async (request, reply) => {
        const { env } = await Promise.resolve().then(() => __importStar(require("../env")));
        if (env.NODE_ENV === "production") {
            return reply.code(403).send({ ok: false, message: "Not available in production" });
        }
        if (!env.STRIPE_API_KEY) {
            return reply.code(400).send({ ok: false, message: "Stripe not configured" });
        }
        try {
            const Stripe = (await Promise.resolve().then(() => __importStar(require("stripe")))).default;
            const stripe = new Stripe(env.STRIPE_API_KEY, { apiVersion: "2024-06-20" });
            // Check current balance first
            const balance = await stripe.balance.retrieve();
            const available = balance.available.reduce((s, b) => s + b.amount, 0);
            if (available >= 100000) { // Already $1000+
                return reply.send({
                    ok: true,
                    message: `Platform already has $${(available / 100).toFixed(2)} available. No topup needed.`,
                    data: { available: available / 100 },
                });
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
            });
        }
        catch (err) {
            fastify.log.error(err);
            return reply.code(500).send({ ok: false, message: err.message });
        }
    });
}
