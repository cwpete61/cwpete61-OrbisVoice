const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(c => {
    console.log('Count:', c);
    process.exit(0);
  })
  .catch(e => {
    console.error('Connection Error:', e);
    process.exit(1);
  });
