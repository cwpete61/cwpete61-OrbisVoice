import { FastifyInstance } from 'fastify';
import { stripe } from '../lib/stripe';
import prisma from '../lib/prisma';
import axios from 'axios';

export default async function webhookRoutes(fastify: FastifyInstance) {
  fastify.post('/stripe', async (request, reply) => {
    const sig = request.headers['stripe-signature'] as string;
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        request.body as string | Buffer,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET || ''
      );
    } catch (err: any) {
      return reply.code(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as any;
      const metadata = session.metadata;

      // 1. Permanent record in isolated DB
      const order = await prisma.order.update({
        where: { stripeSessionId: session.id },
        data: {
          status: 'completed',
          stripeInvoiceId: session.invoice as string,
          amountTotal: session.amount_total || 0
        }
      });

      // 2. Notify Core API for fulfillment
      try {
        await axios.post(`${process.env.CORE_API_URL}/api/commerce/finalize`, {
          userId: metadata.externalUserId,
          type: metadata.purchaseType || 'credit_purchase',
          payload: {
             amount: parseInt(metadata.creditAmount || '0'),
             orderId: order.id
          }
        }, {
          headers: { 'x-service-key': process.env.INTERNAL_SERVICE_KEY }
        });
      } catch (err: any) {
        fastify.log.error(err, 'Fulfillment notification failed');
        // We don't fail the webhook, but we should log/retry
      }
    }

    return { received: true };
  });
}
