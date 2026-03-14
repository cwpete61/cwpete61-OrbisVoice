const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRaw`UPDATE "StripeConnectConfig" SET "priceLtd" = 'price_1R0f3vEFjM4hGTWYVz4ZtGfK' WHERE id = 'global'`;
    console.log('Updated priceLtd for testing');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
