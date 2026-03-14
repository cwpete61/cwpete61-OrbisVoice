/**
 * One-time script to create Stripe Products and Prices in the sandbox.
 * Run: node scripts/create-stripe-products.mjs
 */
import Stripe from "stripe";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
if (!STRIPE_SECRET_KEY) {
  console.error("❌ STRIPE_SECRET_KEY env var is required. Run: STRIPE_SECRET_KEY=sk_test_... node scripts/create-stripe-products.mjs");
  process.exit(1);
}

const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });

const PRODUCTS = [
  {
    name: "OrbisVoice Starter",
    description: "1,000 AI conversations per month",
    envKey: "STRIPE_PRICE_STARTER",
    amount: 19700, // $197 in cents
    interval: "month",
    mode: "recurring",
  },
  {
    name: "OrbisVoice Professional",
    description: "10,000 AI conversations per month",
    envKey: "STRIPE_PRICE_PROFESSIONAL",
    amount: 49700, // $497
    interval: "month",
    mode: "recurring",
  },
  {
    name: "OrbisVoice Enterprise",
    description: "100,000 AI conversations per month",
    envKey: "STRIPE_PRICE_ENTERPRISE",
    amount: 99700, // $997
    interval: "month",
    mode: "recurring",
  },
  {
    name: "OrbisVoice AI Revenue Infrastructure",
    description: "250,000 AI conversations per month",
    envKey: "STRIPE_PRICE_AI_INFRA",
    amount: 199700, // $1,997
    interval: "month",
    mode: "recurring",
  },
  {
    name: "OrbisVoice Lifetime Deal",
    description: "Lifetime access to AI engine - one-time payment",
    envKey: "STRIPE_PRICE_LTD",
    amount: 49700, // $497
    mode: "one_time",
  },
  {
    name: "OrbisVoice LTD Hosting",
    description: "Monthly token costs for Lifetime Deal holders",
    envKey: "STRIPE_PRICE_LTD_HOSTING",
    amount: 2000, // $20
    interval: "month",
    mode: "recurring",
  },
];

async function main() {
  console.log("🚀 Creating Stripe Products and Prices...\n");

  const envLines = [];

  for (const p of PRODUCTS) {
    // Create Product
    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
    });
    console.log(`✅ Product: ${product.name} (${product.id})`);

    // Create Price
    const priceParams = {
      product: product.id,
      unit_amount: p.amount,
      currency: "usd",
    };

    if (p.mode === "recurring") {
      priceParams.recurring = { interval: p.interval };
    }

    const price = await stripe.prices.create(priceParams);
    console.log(`   💰 Price: $${(p.amount / 100).toFixed(2)} → ${price.id}`);

    envLines.push(`${p.envKey}=${price.id}`);
  }

  console.log("\n─────────────────────────────────────────");
  console.log("📋 Add these to your .env file:\n");
  envLines.forEach((line) => console.log(line));
  console.log("─────────────────────────────────────────\n");
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
