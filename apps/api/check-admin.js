const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmin() {
  const admin = await prisma.user.findFirst({
    where: { isAdmin: true },
    select: { email: true, role: true, isAdmin: true }
  });
  console.log('Current Admin User in DB:', admin);
  
  const allUsers = await prisma.user.findMany({
    select: { email: true, role: true, isAdmin: true },
    take: 10
  });
  console.log('Top 10 Users:', allUsers);
  
  process.exit(0);
}

checkAdmin();
