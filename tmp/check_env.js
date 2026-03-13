
const { env } = require('./apps/api/dist/env');
console.log('Price IDs currently in env:');
console.log('Starter:', env.STRIPE_PRICE_STARTER);
console.log('Professional:', env.STRIPE_PRICE_PROFESSIONAL);
console.log('Enterprise:', env.STRIPE_PRICE_ENTERPRISE);
console.log('AI Infra:', env.STRIPE_PRICE_AI_INFRA);
console.log('LTD:', env.STRIPE_PRICE_LTD);
console.log('LTD Hosting:', env.STRIPE_PRICE_LTD_HOSTING);
