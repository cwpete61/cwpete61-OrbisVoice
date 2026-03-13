import Stripe from 'stripe';

if (!process.env.STRIPE_API_KEY) {
  throw new Error('STRIPE_API_KEY is missing');
}

export const stripe = new Stripe(process.env.STRIPE_API_KEY);

export async function syncStripeProducts() {
  const products = await stripe.products.list({ active: true, expand: ['data.default_price'] });
  
  const results = [];
  for (const product of products.data) {
    const price = product.default_price as Stripe.Price;
    
    // Upsert into our local isolated mirror
    const record = await import('./prisma').then(m => m.default.product.upsert({
      where: { stripeProductId: product.id },
      update: {
        name: product.name,
        description: product.description,
        price: price?.unit_amount || 0,
        currency: price?.currency || 'usd',
        stripePriceId: typeof product.default_price === 'string' ? product.default_price : product.default_price?.id || '',
        active: product.active
      },
      create: {
        stripeProductId: product.id,
        stripePriceId: typeof product.default_price === 'string' ? product.default_price : product.default_price?.id || '',
        name: product.name,
        description: product.description,
        price: price?.unit_amount || 0,
        currency: price?.currency || 'usd',
        active: product.active
      }
    }));
    results.push(record);
  }
  return results;
}
