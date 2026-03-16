import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: 'postgresql://postgres:Orbis8214Boss@localhost:5440/orbisvoice'
      }
    }
  });

  const u = await prisma.user.findFirst({
    where: { email: 'scotchbonnetseo@gmail.com' },
    include: { tenant: true }
  });
  console.log('User in 5440:', JSON.stringify(u, null, 2));
  
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Error connecting to 5440:', err.message);
});
