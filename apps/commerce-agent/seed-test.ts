
import prisma from "./src/lib/prisma";

async function seed() {
  console.log("Seeding commerce database...");
  await prisma.product.upsert({
    where: { stripeProductId: "prod_test_1" },
    update: {},
    create: {
      stripeProductId: "prod_test_1",
      stripePriceId: "price_test_1",
      name: "Test Product",
      description: "A product for integration testing",
      price: 999,
      currency: "usd",
      active: true,
    },
  });
  console.log("Seeding completed!");
}

seed().catch(err => console.error(err));
