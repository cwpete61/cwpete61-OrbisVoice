
const { prisma } = require('./apps/api/dist/db');
const jwt = require('jsonwebtoken');
const { env } = require('./apps/api/dist/env');

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@orbisvoice.app' }
  });
  if (!admin) {
    console.log('Admin not found');
    return;
  }
  const token = jwt.sign(
    { id: admin.id, email: admin.email, tenantId: admin.tenantId, role: admin.role },
    env.JWT_SECRET || 'dev-secret-key-change-in-production'
  );
  console.log('TOKEN:' + token);
}
main();
