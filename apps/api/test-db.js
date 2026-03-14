require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tenants = await prisma.tenant.findMany({ select: { id: true, bonusCredits: true } });
  console.log('Successfully found bonusCredits:', tenants.length > 0 ? 'Yes' : 'No tenants');
  await prisma.$disconnect();
}

main().catch(e => {
  console.error('ERROR!', e.message);
  process.exit(1);
});
