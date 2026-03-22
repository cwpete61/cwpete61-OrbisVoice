
import { FastifyInstance } from 'fastify';
import prisma from '../lib/prisma';

export default async function productRoutes(fastify: FastifyInstance) {
  fastify.addHook('onRequest', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  });

  fastify.get('/', async (request) => {
    const products = await prisma.product.findMany({
      where: { active: true }
    });
    return { products };
  });

  fastify.get('/search', async (request) => {
    const { q } = request.query as { q: string };
    const products = await prisma.product.findMany({
      where: {
        active: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } }
        ]
      }
    });
    return { products };
  });
}
