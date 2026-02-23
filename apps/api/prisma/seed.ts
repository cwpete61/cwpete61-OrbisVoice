import { PrismaClient } from "./client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Seeding database...");
    console.log("Current working directory:", process.cwd());
    console.log("Seed script directory:", __dirname);
    console.log("Available Prisma models:", Object.keys(prisma).filter(k => !k.startsWith("_")));

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

    console.log("Admin tenant found/created:", adminTenant.id);

    // Hash the admin password
    const adminPasswordHash = await bcrypt.hash("admin123", 10);

    // Create or update admin user
    const adminUser = await prisma.user.upsert({
      where: { id: "admin-user-001" },
      update: {
        email: "admin@orbisvoice.app",
        name: "Admin",
        username: "Oadmin",
        passwordHash: adminPasswordHash,
        isAdmin: true,
        role: "ADMIN",
        isAffiliate: false,
      },
      create: {
        id: "admin-user-001",
        tenantId: adminTenant.id,
        email: "admin@orbisvoice.app",
        name: "Admin",
        username: "Oadmin",
        passwordHash: adminPasswordHash,
        isAdmin: true,
        role: "ADMIN",
        isAffiliate: false,
      },
    });

    console.log("Admin user found/created:", adminUser.id);

    // Create or update secondary test user
    const wbrownPasswordHash = await bcrypt.hash("Orbis@123", 10);
    const wbrownUser = await prisma.user.upsert({
      where: { email: "wbrown@browncorp.com" },
      update: {
        passwordHash: wbrownPasswordHash,
        isAffiliate: false,
      },
      create: {
        tenantId: adminTenant.id,
        email: "wbrown@browncorp.com",
        name: "W. Brown",
        username: "wbrown",
        passwordHash: wbrownPasswordHash,
        role: "USER",
        isAffiliate: false,
      },
    });

    console.log("WBrown user found/created:", wbrownUser.id);

    // Ensure these users are Active Referrers
    const affiliates = [
      { userId: adminUser.id, slug: "admin-ref" },
      { userId: wbrownUser.id, slug: "wbrown-ref" },
    ];

    for (const aff of affiliates) {
      await prisma.affiliate.upsert({
        where: { userId: aff.userId },
        update: { status: "ACTIVE" },
        create: {
          userId: aff.userId,
          slug: aff.slug,
          status: "ACTIVE",
        },
      });
    }

    // Create default conversation packages
    const packages = [
      { name: "1000 Credits", price: 50, credits: 1000 },
      { name: "5000 Credits", price: 225, credits: 5000 },
      { name: "10000 Credits", price: 400, credits: 10000 },
    ];

    for (const pkg of packages) {
      await prisma.conversationPackage.upsert({
        where: { id: `pkg-${pkg.credits}` },
        update: { name: pkg.name, price: pkg.price, credits: pkg.credits },
        create: {
          id: `pkg-${pkg.credits}`,
          name: pkg.name,
          price: pkg.price,
          credits: pkg.credits,
          active: true,
        },
      });
    }

    console.log("Seeding complete. Admin and WBrown users ready. Affiliates active. Packages created.");
  } catch (err) {
    console.error("CRITICAL SEED ERROR:");
    console.error(err);
    throw err;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
