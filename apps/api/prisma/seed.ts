import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Hash the admin password
  const passwordHash = await bcrypt.hash("Orbis@8214@@!!", 10);

  // Create or get admin tenant
  const adminTenant = await prisma.tenant.upsert({
    where: { id: "admin-tenant-001" },
    update: {
      name: "Admin Workspace",
    },
    create: {
      id: "admin-tenant-001",
      name: "Admin Workspace",
      subscriptionTier: "enterprise",
    },
  });

  console.log("Admin tenant:", adminTenant);

  // Create or update admin user
  const adminUser = await prisma.user.upsert({
    where: { id: "admin-user-001" },
    update: {
      email: "admin@orbisvoice.app",
      name: "Admin",
      username: "Oadmin",
      passwordHash,
      isAdmin: true,
      role: "ADMIN",
    },
    create: {
      id: "admin-user-001",
      tenantId: adminTenant.id,
      email: "admin@orbisvoice.app",
      name: "Admin",
      username: "Oadmin",
      passwordHash,
      isAdmin: true,
      role: "ADMIN",
    },
  });

  console.log("Admin user created/updated:", {
    id: adminUser.id,
    email: adminUser.email,
    username: adminUser.username,
    isAdmin: adminUser.isAdmin,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
