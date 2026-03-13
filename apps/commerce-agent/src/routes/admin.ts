import { FastifyInstance } from 'fastify';
import { syncStripeProducts } from '../lib/stripe';

export default async function adminRoutes(fastify: FastifyInstance) {
  // TODO: Add internal API key check here for security
  
  fastify.post('/sync-products', async () => {
    const products = await syncStripeProducts();
    return { success: true, count: products.length };
  });
}
