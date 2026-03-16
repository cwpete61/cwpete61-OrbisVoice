import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const stripeKey = process.env.STRIPE_API_KEY as string; 

async function main() {
  const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as any });
  const events = await stripe.events.list({
    limit: 10,
    types: ['checkout.session.completed', 'invoice.payment_succeeded']
  });

  console.log(JSON.stringify(events.data, (key, value) => {
    if (key === 'raw' || key === 'headers') return undefined; // Filter out bulky stuff
    return value;
  }, 2));
}

main().catch(console.error);
