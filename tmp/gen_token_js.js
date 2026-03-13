
const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

const envPath = path.join(__dirname, '..', 'apps', 'api', '.env');
const envConfig = dotenv.parse(fs.readFileSync(envPath));
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@orbisvoice.app' }
  });
  if (!admin) {
    console.log('Admin not found');
    return;
  }
  const token = jwt.sign(
    { userId: admin.id, email: admin.email, tenantId: admin.tenantId },
    envConfig.JWT_SECRET || 'dev-secret-key-change-in-production'
  );
  console.log('TOKEN:' + token);
  await prisma.$disconnect();
}
main();
