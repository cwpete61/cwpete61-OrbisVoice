import { FastifyInstance } from 'fastify';
import { getCart, addToCart, clearCart, removeFromCart } from '../lib/redis';
import prisma from '../lib/prisma';
import { z } from 'zod';

export default async function cartRoutes(fastify: FastifyInstance) {
  // Middleware to ensure user is authenticated via commerce-scoped JWT
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized: Valid commerce token required' });
    }
  });

  fastify.get('/', async (request) => {
    console.info('GET /cart started');
    const userId = (request.user as any).userId;
    const items = await getCart(userId);
    console.info(`Found ${items.length} items for ${userId}`);
    
    // Enrich items with product data from our local mirror
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { stripeProductId: { in: productIds } }
    });
    console.info(`Enriched with ${products.length} products`);

    return {
      items: items.map(item => ({
        ...item,
        product: products.find(p => p.stripeProductId === item.productId)
      }))
    };
  });

  fastify.post('/add', async (request, reply) => {
    const schema = z.object({
      productId: z.string(),
      quantity: z.number().int().positive().default(1)
    });

    const body = schema.safeParse(request.body);
    if (!body.success) {
      return reply.code(400).send({ error: body.error.format() });
    }

    const userId = (request.user as any).userId;
    const cart = await addToCart(userId, body.data.productId, body.data.quantity);

    return { success: true, cart };
  });

  fastify.delete('/', async (request) => {
    const userId = (request.user as any).userId;
    await clearCart(userId);
    return { success: true };
  });

  fastify.delete('/:productId', async (request, reply) => {
    const userId = (request.user as any).userId;
    const { productId } = request.params as { productId: string };
    const cart = await removeFromCart(userId, productId);
    return { success: true, cart };
  });
}
