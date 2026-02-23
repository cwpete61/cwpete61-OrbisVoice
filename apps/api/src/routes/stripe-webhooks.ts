import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { referralManager } from "../services/referral";
import { prisma } from "../db";
import { env } from "../env";
import { logger } from "../logger";
import crypto from "crypto";

/**
 * Stripe Webhook Handler
 *
 * Listens to Stripe events to automatically:
 *  - Create commissions when referred users pay (invoice.payment_succeeded)
 *  - Revoke commissions when payments are refunded (charge.refunded)
 *  - Handle checkout session completions (checkout.session.completed)
 */

function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
    try {
        const elements = signature.split(",");
        const timestamp = elements.find((e) => e.startsWith("t="))?.split("=")[1];
        const v1Signature = elements.find((e) => e.startsWith("v1="))?.split("=")[1];

        if (!timestamp || !v1Signature) return false;

        const signedPayload = `${timestamp}.${payload}`;
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(signedPayload)
            .digest("hex");

        return crypto.timingSafeEqual(
            Buffer.from(v1Signature),
            Buffer.from(expectedSignature)
        );
    } catch {
        return false;
    }
}

export default async function stripeWebhookRoutes(fastify: FastifyInstance) {
    // Use a preParsing hook to capture the raw body for signature verification
    fastify.addHook("preParsing", async (request, reply, payload) => {
        // Robust path matching for webhooks
        const url = request.url.split('?')[0];
        if (url.endsWith("/webhooks/stripe")) {
            const chunks: Buffer[] = [];
            for await (const chunk of payload) {
                chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
            }
            const rawBody = Buffer.concat(chunks);
            (request as unknown as { rawBody: string }).rawBody = rawBody.toString("utf8");
            // Return a new readable stream from the buffer so Fastify can still parse it
            const { Readable } = await import("stream");
            return Readable.from(rawBody);
        }
        return payload;
    });

    fastify.post(
        "/webhooks/stripe",
        async (request: FastifyRequest, reply: FastifyReply) => {
            const sig = request.headers["stripe-signature"] as string;
            const rawBody = (request as unknown as { rawBody: string }).rawBody as string;

            if (!sig || !rawBody) {
                return reply.code(400).send({ error: "Missing signature or body" });
            }

            // Verify signature if webhook secret is configured
            if (env.STRIPE_WEBHOOK_SECRET) {
                const valid = verifyStripeSignature(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
                if (!valid) {
                    logger.warn("Stripe webhook signature verification failed");
                    return reply.code(400).send({ error: "Invalid signature" });
                }
            } else {
                logger.warn("STRIPE_WEBHOOK_SECRET not set — skipping signature verification");
            }

            const event = request.body as any;
            logger.info({ type: event.type, id: event.id }, "Stripe webhook received");

            try {
                switch (event.type) {
                    // ─── PAYMENT SUCCEEDED ─────────────────────────────────
                    case "invoice.payment_succeeded": {
                        const invoice = event.data.object;
                        const customerId = invoice.customer;
                        const amountPaid = (invoice.amount_paid || 0) / 100; // cents → dollars
                        const invoiceId = invoice.id;
                        const billingReason = invoice.billing_reason;

                        if (amountPaid <= 0) break;

                        // Skip recurring subscription payments for commissions
                        if (billingReason === "subscription_cycle" || billingReason === "subscription_update") {
                            logger.info({ invoiceId, billingReason, amount: amountPaid }, "Skipping commission for recurring subscription payment");
                            break;
                        }

                        const tenant = await prisma.tenant.findFirst({
                            where: { stripeCustomerId: customerId },
                        });

                        if (!tenant) {
                            logger.warn({ customerId }, "No tenant found for Stripe customer");
                            break;
                        }

                        const user = await prisma.user.findFirst({
                            where: { tenantId: tenant.id },
                        });

                        if (!user) {
                            logger.warn({ tenantId: tenant.id }, "No user found for tenant");
                            break;
                        }

                        const processed = await referralManager.processCommission(user.id, amountPaid, invoiceId);

                        if (processed) {
                            logger.info({ userId: user.id, amount: amountPaid, invoiceId }, "Commission created from Stripe payment");
                        }
                        break;
                    }

                    // ─── PAYMENT REFUNDED ──────────────────────────────────
                    case "charge.refunded": {
                        const charge = event.data.object;
                        const invoiceId = charge.invoice;

                        if (invoiceId) {
                            const updated = await prisma.rewardTransaction.updateMany({
                                where: {
                                    sourcePaymentId: invoiceId,
                                    status: { in: ["pending", "available"] },
                                },
                                data: { status: "refunded" },
                            });

                            if (updated.count > 0) {
                                logger.info({ invoiceId, count: updated.count }, "Commission(s) refunded");

                                const refundedTxs = await prisma.rewardTransaction.findMany({
                                    where: { sourcePaymentId: invoiceId, status: "refunded" },
                                });

                                for (const tx of refundedTxs) {
                                    const affiliate = await prisma.affiliate.findUnique({
                                        where: { userId: tx.referrerId },
                                    });

                                    if (affiliate) {
                                        await prisma.affiliate.update({
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

                        if (amountTotal <= 0 || session.payment_status !== "paid") break;

                        const tenant = await prisma.tenant.findFirst({
                            where: { stripeCustomerId: customerId },
                        });
                        if (!tenant) break;

                        const user = await prisma.user.findFirst({
                            where: { tenantId: tenant.id },
                        });
                        if (!user) break;

                        // Process commission
                        await referralManager.processCommission(user.id, amountTotal, sessionId);

                        // Update the tenant's subscription tier and usage limits
                        if (tier) {
                            const settings = await prisma.platformSettings.findUnique({ where: { id: "global" } });
                            let newUsageLimit = 100; // default

                            if (tier === 'ltd') newUsageLimit = settings?.ltdLimit ?? 1000;
                            else if (tier === 'starter') newUsageLimit = settings?.starterLimit ?? 1000;
                            else if (tier === 'professional') newUsageLimit = settings?.professionalLimit ?? 10000;
                            else if (tier === 'enterprise') newUsageLimit = settings?.enterpriseLimit ?? 100000;
                            else if (tier === 'ai-revenue-infrastructure') newUsageLimit = settings?.aiInfraLimit ?? 250000;

                            await prisma.tenant.update({
                                where: { id: tenant.id },
                                data: {
                                    subscriptionTier: tier,
                                    subscriptionStatus: "active",
                                    usageLimit: newUsageLimit
                                },
                            });
                            logger.info({ tenantId: tenant.id, tier, newUsageLimit }, "Tenant upgraded via checkout");
                        }

                        // For LTD: auto-create the $20/month recurring subscription
                        if (tier === "ltd" && env.STRIPE_API_KEY) {
                            try {
                                const subRes = await fetch("https://api.stripe.com/v1/subscriptions", {
                                    method: "POST",
                                    headers: {
                                        Authorization: `Bearer ${env.STRIPE_API_KEY}`,
                                        "Content-Type": "application/x-www-form-urlencoded",
                                    },
                                    body: new URLSearchParams({
                                        customer: customerId,
                                        "items[0][price]": "price_1T2kHaEFjM4hGTWYOvNxHr89",
                                        "trial_period_days": "30",
                                        "metadata[tier]": "ltd",
                                        "metadata[tenantId]": tenant.id,
                                    }).toString(),
                                });

                                if (subRes.ok) {
                                    const sub = (await subRes.json()) as any;
                                    logger.info({ subscriptionId: sub.id }, "Auto-created $20/month LTD subscription");
                                }
                            } catch (err) {
                                logger.error({ err }, "Error creating LTD recurring subscription");
                            }
                        }
                        break;
                    }

                    // ─── SUBSCRIPTION UPDATED ──────────────────────────────
                    case "customer.subscription.updated": {
                        const subscription = event.data.object;
                        const customerId = subscription.customer;
                        const status = subscription.status;
                        const tier = subscription.metadata?.tier;

                        const tenant = await prisma.tenant.findFirst({
                            where: { stripeCustomerId: customerId },
                        });
                        if (!tenant) break;

                        await prisma.tenant.update({
                            where: { id: tenant.id },
                            data: {
                                subscriptionStatus: status,
                                ...(tier ? { subscriptionTier: tier } : {}),
                            },
                        });
                        logger.info({ tenantId: tenant.id, status, tier }, "Tenant subscription updated");
                        break;
                    }

                    // ─── SUBSCRIPTION DELETED ──────────────────────────────
                    case "customer.subscription.deleted": {
                        const subscription = event.data.object;
                        const customerId = subscription.customer;

                        const tenant = await prisma.tenant.findFirst({
                            where: { stripeCustomerId: customerId },
                        });
                        if (!tenant) break;

                        await prisma.tenant.update({
                            where: { id: tenant.id },
                            data: {
                                subscriptionStatus: "canceled",
                                subscriptionTier: "free",
                                usageLimit: 100 // Reset to free limit
                            },
                        });
                        logger.info({ tenantId: tenant.id }, "Tenant subscription deleted/canceled");
                        break;
                    }

                    default:
                        logger.info({ type: event.type }, "Unhandled Stripe event type");
                }
            } catch (err) {
                logger.error({ err, eventType: event.type }, "Error processing Stripe webhook");
            }

            return reply.code(200).send({ received: true });
        }
    );
}
