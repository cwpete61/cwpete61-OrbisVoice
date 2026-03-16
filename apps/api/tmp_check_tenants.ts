import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({
    select: {
      id: true,
      name: true,
      subscriptionTier: true,
      usageLimit: true,
      stripeCustomerId: true,
    }
  });
  console.log(JSON.stringify(tenants, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
