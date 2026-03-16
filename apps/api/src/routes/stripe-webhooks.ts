import { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { referralManager } from "../services/referral";
import { prisma } from "../db";
import { env } from "../env";
import { logger } from "../logger";
import crypto from "crypto";
import { createNotification, NotifType } from "../services/notification";
import { UsageService } from "../services/usage-service";

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

                        // ─── FULFILL PACKAGE PURCHASE ──────────────────────────
                        if (session.metadata?.type === "package") {
                            const packageId = session.metadata.packageId;
                            const creditsToAdd = parseInt(session.metadata.credits || "0", 10);
                            const tenantId = session.metadata.tenantId || tenant.id;

                            if (creditsToAdd > 0) {
                                await prisma.tenant.update({
                                    where: { id: tenantId },
                                    data: {
                                        bonusCredits: { increment: creditsToAdd } as any
                                    } as any,
                                });
                                logger.info({ tenantId, packageId, creditsToAdd }, "Bonus credits added via package purchase");
                                
                                await createNotification({
                                    userId: user.id,
                                    type: NotifType.SYSTEM_ANNOUNCEMENT,
                                    title: "Credits Added!",
                                    body: `Your purchase was successful. ${creditsToAdd.toLocaleString()} credits have been added to your balance and will roll over monthly.`,
                                    data: { packageId, creditsAdded: creditsToAdd }
                                });
                            }
                            break;
                        }

                        // Update the tenant's subscription tier and usage limits
                        if (tier) {
                            await UsageService.updateSubscriptionTier(
                                tenant.id,
                                tier,
                                session.subscription ? String(session.subscription) : undefined
                            );
                        }

                        // For LTD: auto-create the $20/month recurring subscription
                        const ltdHostingPrice = env.STRIPE_PRICE_LTD_HOSTING;
                        if (tier === "ltd" && env.STRIPE_API_KEY && ltdHostingPrice && !ltdHostingPrice.includes("placeholder")) {
                            try {
                                const subRes = await fetch("https://api.stripe.com/v1/subscriptions", {
                                    method: "POST",
                                    headers: {
                                        Authorization: `Bearer ${env.STRIPE_API_KEY}`,
                                        "Content-Type": "application/x-www-form-urlencoded",
                                    },
                                    body: new URLSearchParams({
                                        customer: customerId,
                                        "items[0][price]": ltdHostingPrice,
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

                        // Notify user of activation
                        await createNotification({
                            userId: user.id,
                            type: NotifType.SYSTEM_ANNOUNCEMENT,
                            title: "Subscription Activated!",
                            body: `Your upgrade to ${tier.toUpperCase()} was successful. Your new usage limit is ${tenant.usageLimit} conversations.`,
                            data: { tier, amount: amountTotal }
                        });
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
                                stripeSubscriptionId: subscription.id,
                                ...(tier ? { subscriptionTier: tier } : {}),
                            },
                        });
                        logger.info({ tenantId: tenant.id, status, tier, subId: subscription.id }, "Tenant subscription updated");
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
                                usageLimit: 0 // No base monthly usage for free tier
                            },
                        });
                        logger.info({ tenantId: tenant.id }, "Tenant subscription deleted/canceled");
                        break;
                    }

                    // ─── CONNECT: TRANSFER CREATED ─────────────────────────
                    // Fires when a platform transfer lands in a connected account
                    case "transfer.created": {
                        const transfer = event.data.object as any;
                        // Update any pending AffiliatePayout records that used this transfer
                        const updated = await prisma.affiliatePayout.updateMany({
                            where: { transactionId: "simulated" },
                            data: { transactionId: transfer.id }
                        });
                        if (updated.count > 0) {
                            logger.info({ transferId: transfer.id }, "Backfilled Stripe transfer ID on payout record");
                        }
                        break;
                    }

                    // ─── CONNECT: ACCOUNT UPDATED ──────────────────────────
                    // Fires when a connected account's verification status changes
                    case "account.updated": {
                        const acct = event.data.object as any;
                        const affiliate = await prisma.affiliate.findFirst({
                            where: { stripeAccountId: acct.id }
                        });
                        if (!affiliate) break;

                        let newStatus = affiliate.stripeAccountStatus;
                        if (acct.details_submitted && acct.payouts_enabled) {
                            newStatus = "active";
                        } else if (acct.details_submitted && !acct.payouts_enabled) {
                            newStatus = "pending";
                        }

                        if (newStatus !== affiliate.stripeAccountStatus) {
                            await prisma.affiliate.update({
                                where: { id: affiliate.id },
                                data: { stripeAccountStatus: newStatus }
                            });
                            logger.info({ affiliateId: affiliate.id, newStatus }, "Stripe account status synced via webhook");
                        }
                        break;
                    }

                    // ─── CONNECT: PAYOUT PAID ──────────────────────────────
                    // Fires when Stripe pays the connected account to their bank
                    case "payout.paid": {
                        const payout = event.data.object as any;
                        // Find the most recent PAID AffiliatePayout for this account
                        const connectedAccountId = event.account; // Set by Stripe for Connect events
                        if (connectedAccountId) {
                            const affiliate = await prisma.affiliate.findFirst({
                                where: { stripeAccountId: connectedAccountId }
                            });
                            if (affiliate) {
                                logger.info({
                                    affiliateId: affiliate.id,
                                    payoutId: payout.id,
                                    amount: payout.amount / 100
                                }, "Connected account payout confirmed by bank");

                                await createNotification({
                                    userId: affiliate.userId,
                                    type: NotifType.PAYOUT_PROCESSED,
                                    title: "Funds Sent to Bank",
                                    body: `The bank has confirmed receipt of your payout ($${(payout.amount / 100).toFixed(2)}).`,
                                    data: { payoutId: payout.id }
                                });
                            }
                        }
                        break;
                    }

                    // ─── CONNECT: PAYOUT FAILED ────────────────────────────
                    // Fires when a bank payout fails (e.g. invalid account)
                    case "payout.failed": {
                        const payout = event.data.object as any;
                        const connectedAccountId = event.account;
                        if (connectedAccountId) {
                            const affiliate = await prisma.affiliate.findFirst({
                                where: { stripeAccountId: connectedAccountId }
                            });
                            if (affiliate) {
                                logger.error({
                                    affiliateId: affiliate.id,
                                    payoutId: payout.id,
                                    failureCode: payout.failure_code,
                                    failureMessage: payout.failure_message,
                                }, "⚠️ Connected account payout FAILED — manual review needed");

                                await prisma.affiliate.update({
                                    where: { id: affiliate.id },
                                    data: { stripeAccountStatus: "pending" }
                                });

                                await createNotification({
                                    userId: affiliate.userId,
                                    type: NotifType.PAYOUT_SCHEDULED, // Using scheduled since we don't have a FAILED type yet, or maybe manual
                                    title: "Payout Failed: Action Required",
                                    body: `Your bank payout of $${(payout.amount / 100).toFixed(2)} failed. Reason: ${payout.failure_message || 'Bank error'}. Please update your bank details.`,
                                    data: { payoutId: payout.id, error: payout.failure_code }
                                });
                            }
                        }
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
