import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const emailToPromote = "admin@orbisvoice.app";
  console.log(`Promoting ${emailToPromote} to SYSTEM_ADMIN...`);
  const user = await prisma.user.update({
    where: { email: emailToPromote },
    data: { role: "SYSTEM_ADMIN" },
  });
  console.log('User promoted:', JSON.stringify(user, null, 2));

  // Also see if we should promote anyone else
  const otherAdmin = "myorbislocal@gmail.com";
  const user2 = await prisma.user.findUnique({ where: { email: otherAdmin } });
  if (user2) {
    console.log(`Promoting ${otherAdmin} to SYSTEM_ADMIN...`);
    await prisma.user.update({
      where: { email: otherAdmin },
      data: { role: "SYSTEM_ADMIN" },
    });
  }
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
