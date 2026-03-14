const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const user = await prisma.user.findFirst({ where: { isAdmin: true } });
    if (user) {
      console.log('---ADMIN_USER_LOG---');
      console.log(JSON.stringify(user, null, 2));
      console.log('---END_ADMIN_USER_LOG---');
    } else {
      console.log('No admin user found.');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
