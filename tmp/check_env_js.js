
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', 'apps', 'api', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

console.log('Price IDs in .env file:');
console.log('Starter:', envConfig.STRIPE_PRICE_STARTER);
console.log('Professional:', envConfig.STRIPE_PRICE_PROFESSIONAL);
console.log('Enterprise:', envConfig.STRIPE_PRICE_ENTERPRISE);
console.log('AI Infra:', envConfig.STRIPE_PRICE_AI_INFRA);
console.log('LTD:', envConfig.STRIPE_PRICE_LTD);
console.log('LTD Hosting:', envConfig.STRIPE_PRICE_LTD_HOSTING);
