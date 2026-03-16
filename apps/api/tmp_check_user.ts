import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const u = await prisma.user.findFirst({
    where: { email: 'scotchbonnetseo@gmail.com' },
    include: { tenant: true }
  });
  console.log(JSON.stringify(u, null, 2));
}

main().catch(err => console.error(err)).finally(() => prisma.$disconnect());
