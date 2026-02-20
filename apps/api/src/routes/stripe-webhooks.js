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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = stripeWebhookRoutes;
const referral_1 = require("../services/referral");
const db_1 = require("../db");
const env_1 = require("../env");
const logger_1 = require("../logger");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Stripe Webhook Handler
 *
 * Listens to Stripe events to automatically:
 *  - Create commissions when referred users pay (invoice.payment_succeeded)
 *  - Revoke commissions when payments are refunded (charge.refunded)
 *  - Handle checkout session completions (checkout.session.completed)
 */
function verifyStripeSignature(payload, signature, secret) {
    try {
        const elements = signature.split(",");
        const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
        const v1Signature = elements.find((e) => e.startsWith("v1="))?.split("=")[1];
        if (!timestamp || !v1Signature)
            return false;
        const signedPayload = `${timestamp}.${payload}`;
        const expectedSignature = crypto_1.default
            .createHmac("sha256", secret)
            .update(signedPayload)
            .digest("hex");
        return crypto_1.default.timingSafeEqual(Buffer.from(v1Signature), Buffer.from(expectedSignature));
    }
    catch {
        return false;
    }
}
async function stripeWebhookRoutes(fastify) {
    // Use a preParsing hook to capture the raw body for signature verification
    fastify.addHook("preParsing", async (request, reply, payload) => {
        if (request.url === "/webhooks/stripe") {
            const chunks = [];
            for await (const chunk of payload) {
                chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            const rawBody = Buffer.concat(chunks);
            request.rawBody = rawBody.toString("utf8");
            // Return a new readable stream from the buffer so Fastify can still parse it
            const { Readable } = await Promise.resolve().then(() => __importStar(require("stream")));
            return Readable.from(rawBody);
        }
        return payload;
    });
    fastify.post("/webhooks/stripe", async (request, reply) => {
        const sig = request.headers["stripe-signature"];
        const rawBody = request.rawBody;
        if (!sig || !rawBody) {
            return reply.code(400).send({ error: "Missing signature or body" });
        }
        // Verify signature if webhook secret is configured
        if (env_1.env.STRIPE_WEBHOOK_SECRET) {
            const valid = verifyStripeSignature(rawBody, sig, env_1.env.STRIPE_WEBHOOK_SECRET);
            if (!valid) {
                logger_1.logger.warn("Stripe webhook signature verification failed");
                return reply.code(400).send({ error: "Invalid signature" });
            }
        }
        else {
            logger_1.logger.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
        }
        const event = request.body;
        logger_1.logger.info({ type: event.type, id: event.id }, "Stripe webhook received");
        try {
            switch (event.type) {
                // ─── PAYMENT SUCCEEDED ─────────────────────────────────
                case "invoice.payment_succeeded": {
                    const invoice = event.data.object;
                    const customerId = invoice.customer;
                    const amountPaid = (invoice.amount_paid || 0) / 100; // cents → dollars
                    const invoiceId = invoice.id;
                    const billingReason = invoice.billing_reason; // e.g. "subscription_cycle", "subscription_create", "manual"
                    if (amountPaid <= 0)
                        break;
                    // Skip recurring subscription payments (e.g. $20/mo) — commission only on one-time charges
                    if (billingReason === "subscription_cycle" || billingReason === "subscription_update") {
                        logger_1.logger.info({ invoiceId, billingReason, amount: amountPaid }, "Skipping commission for recurring subscription payment");
                        break;
                    }
                    // Find tenant by Stripe customer ID
                    const tenant = await db_1.prisma.tenant.findFirst({
                        where: { stripeCustomerId: customerId },
                    });
                    if (!tenant) {
                        logger_1.logger.warn({ customerId }, "No tenant found for Stripe customer");
                        break;
                    }
                    const user = await db_1.prisma.user.findFirst({
                        where: { tenantId: tenant.id },
                    });
                    if (!user) {
                        logger_1.logger.warn({ tenantId: tenant.id }, "No user found for tenant");
                        break;
                    }
                    const processed = await referral_1.referralManager.processCommission(user.id, amountPaid, invoiceId);
                    if (processed) {
                        logger_1.logger.info({ userId: user.id, amount: amountPaid, invoiceId }, "Commission created from Stripe payment");
                    }
                    break;
                }
                // ─── PAYMENT REFUNDED ──────────────────────────────────
                case "charge.refunded": {
                    const charge = event.data.object;
                    const invoiceId = charge.invoice;
                    if (invoiceId) {
                        const updated = await db_1.prisma.rewardTransaction.updateMany({
                            where: {
                                sourcePaymentId: invoiceId,
                                status: { in: ["pending", "available"] },
                            },
                            data: { status: "refunded" },
                        });
                        if (updated.count > 0) {
                            logger_1.logger.info({ invoiceId, count: updated.count }, "Commission(s) refunded");
                            // Adjust affiliate balances for refunded commissions
                            const refundedTxs = await db_1.prisma.rewardTransaction.findMany({
                                where: { sourcePaymentId: invoiceId, status: "refunded" },
                            });
                            for (const tx of refundedTxs) {
                                const affiliate = await db_1.prisma.affiliate.findUnique({
                                    where: { userId: tx.referrerId },
                                });
                                if (affiliate) {
                                    await db_1.prisma.affiliate.update({
                                        where: { id: affiliate.id },
                                        data: {
                                            balance: { decrement: tx.amount },
                                            totalEarnings: { decrement: tx.amount },
                                        },
                                    });
                                }
                            }
                        }
                    }
                    break;
                }
                // ─── CHECKOUT SESSION COMPLETED ────────────────────────
                case "checkout.session.completed": {
                    const session = event.data.object;
                    const customerId = session.customer;
                    const amountTotal = (session.amount_total || 0) / 100;
                    const sessionId = session.id;
                    const tier = session.metadata?.tier;
                    if (amountTotal <= 0 || session.payment_status !== "paid")
                        break;
                    const tenant = await db_1.prisma.tenant.findFirst({
                        where: { stripeCustomerId: customerId },
                    });
                    if (!tenant)
                        break;
                    const user = await db_1.prisma.user.findFirst({
                        where: { tenantId: tenant.id },
                    });
                    if (!user)
                        break;
                    // Process commission on the one-time payment
                    await referral_1.referralManager.processCommission(user.id, amountTotal, sessionId);
                    logger_1.logger.info({ userId: user.id, amount: amountTotal, tier }, "Commission from checkout session");
                    // Update the tenant's subscription tier
                    if (tier) {
                        await db_1.prisma.tenant.update({
                            where: { id: tenant.id },
                            data: {
                                subscriptionTier: tier,
                                subscriptionStatus: "active",
                            },
                        });
                        logger_1.logger.info({ tenantId: tenant.id, tier }, "Tenant tier updated");
                    }
                    // For LTD: auto-create the $20/month recurring subscription
                    if (tier === "ltd" && env_1.env.STRIPE_API_KEY) {
                        try {
                            const subRes = await fetch("https://api.stripe.com/v1/subscriptions", {
                                method: "POST",
                                headers: {
                                    Authorization: `Bearer ${env_1.env.STRIPE_API_KEY}`,
                                    "Content-Type": "application/x-www-form-urlencoded",
                                },
                                body: new URLSearchParams({
                                    customer: customerId,
                                    "items[0][price]": "price_1T2kHaEFjM4hGTWYOvNxHr89", // $20/month
                                    "trial_period_days": "30", // First month is free (covered by $497)
                                    "metadata[tier]": "ltd",
                                    "metadata[tenantId]": tenant.id,
                                }).toString(),
                            });
                            if (subRes.ok) {
                                const sub = await subRes.json();
                                logger_1.logger.info({ subscriptionId: sub.id }, "Auto-created $20/month LTD subscription");
                            }
                            else {
                                const err = await subRes.text();
                                logger_1.logger.error({ err }, "Failed to create LTD recurring subscription");
                            }
                        }
                        catch (err) {
                            logger_1.logger.error({ err }, "Error creating LTD recurring subscription");
                        }
                    }
                    break;
                }
                default:
                    logger_1.logger.info({ type: event.type }, "Unhandled Stripe event type");
            }
        }
        catch (err) {
            logger_1.logger.error({ err, eventType: event.type }, "Error processing Stripe webhook");
            // Still return 200 to prevent Stripe from retrying
        }
        return reply.code(200).send({ received: true });
    });
}
