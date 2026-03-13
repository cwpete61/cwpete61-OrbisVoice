import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import { pino } from 'pino';
import * as dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ 
  logger: {
    transport: {
      target: 'pino-pretty',
      options: { colorize: true }
    }
  }
});

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

    // 3. Webhook raw body handling
    fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (req, body, done) => {
      try {
        if (req.url?.includes('/webhooks/stripe')) {
          done(null, body);
        } else {
          done(null, JSON.parse(body as string));
        }
      } catch (err: any) {
        done(err, undefined);
      }
    });

    // 4. Routes
    await fastify.register(import('./routes/cart'), { prefix: '/cart' });
    await fastify.register(import('./routes/checkout'), { prefix: '/checkout' });
    await fastify.register(import('./routes/admin'), { prefix: '/internal' });
    await fastify.register(import('./routes/webhooks'), { prefix: '/webhooks' });

    const port = parseInt(process.env.COMMERCE_PORT || '4005');
    await fastify.listen({ port, host: '0.0.0.0' });
    
    console.log(`🚀 Commerce Agent running on http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();
