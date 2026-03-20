const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSettings() {
  const settings = await prisma.platformSettings.findFirst();
  console.log('Platform Settings:', settings);
  process.exit(0);
}

checkSettings();
