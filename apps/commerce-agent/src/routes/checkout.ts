import { FastifyInstance } from 'fastify';
import { stripe } from '../lib/stripe';
import prisma from '../lib/prisma';
import { ensureCommerceUser } from '../lib/users';
import { z } from 'zod';

export default async function checkoutRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.post('/create-session', async (request, reply) => {
    const schema = z.object({
      priceId: z.string(),
      successUrl: z.string().url(),
      cancelUrl: z.string().url(),
      purchaseType: z.enum(['subscription', 'credit_purchase']).default('credit_purchase'),
      creditAmount: z.number().optional()
    });

    const body = schema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: body.error.format() });
    }

    const userId = (request.user as any).userId;
    const { priceId, successUrl, cancelUrl, purchaseType, creditAmount } = body.data;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: purchaseType === 'subscription' ? 'subscription' : 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        externalUserId: userId,
        purchaseType,
        creditAmount: creditAmount?.toString() || '0'
      }
    });

    // Track the order locally
    const cUser = await ensureCommerceUser(userId);
    
    await prisma.order.create({
      data: {
        stripeSessionId: session.id,
        status: 'pending',
        commerceUserId: cUser.id,
        amountTotal: 0,
        currency: 'usd'
      }
    });

    return { url: session.url };
  });
}
