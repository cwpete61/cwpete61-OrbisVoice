import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const t = await prisma.tenant.findUnique({
    where: { id: 'cmm1m7pie000dm178oov8k5yj' }
  });
  console.log(JSON.stringify(t, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
