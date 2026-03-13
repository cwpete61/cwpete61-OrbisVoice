import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { pino } from 'pino';
import * as dotenv from 'dotenv';

dotenv.config();

const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

const fastify = Fastify({ logger });

async function start() {
  try {
    // 1. Auth & CORS
    await fastify.register(cors, {
      origin: true // In production, tighten this to your frontend URL
    });

    await fastify.register(jwt, {
      secret: process.env.JWT_SECRET || 'dev-secret-change-me'
    });

    // 2. Health Check
    fastify.get('/health', async () => {
      return { status: 'ok', service: 'commerce-agent' };
    });

    // 3. TODO: Routes (Cart, Checkout, Mirror)

    const port = parseInt(process.env.COMMERCE_PORT || '4005');
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Commerce Agent running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
