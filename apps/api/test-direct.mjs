import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  console.log('Connecting to database...');
  const config = await prisma.googleAuthConfig.findUnique({
    where: { id: 'google-auth-config' }
  });
  console.log('Success!', JSON.stringify(config, null, 2));
  process.exit(0);
} catch (e) {
  console.error('Error:', e.message);
  console.error(e);
  process.exit(1);
} finally {
  await prisma.$disconnect();
}
