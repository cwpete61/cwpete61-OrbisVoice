import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@orbisvoice.app" },
  });
  console.log("Admin User:", user);
  
  const allUsers = await prisma.user.findMany({
      select: { email: true, role: true, isAdmin: true }
  });
  console.log("All Users Summary:", allUsers);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
