
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function check() {
  const id = 'cmmyznplr0005cv64wtbyjiat';
  const agent = await prisma.agent.findUnique({ where: { id } });
  console.log('Agent:', agent);
  
  const allAgents = await prisma.agent.findMany({ take: 5 });
  console.log('Sample agents:', allAgents.map(a => a.id));
  
  await prisma.$disconnect();
}

check().catch(console.error);
