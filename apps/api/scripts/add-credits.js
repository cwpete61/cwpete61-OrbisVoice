const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const tenantId = process.argv[2] || "admin-tenant-001";
  const credits = parseInt(process.argv[3] || "2500");

  console.log(`Adding ${credits} bonus credits to tenant ${tenantId}...`);

  try {
    const tenant = await prisma.tenant.update({
      where: { id: tenantId },
      data: {
        bonusCredits: { increment: credits }
      }
    });

    console.log("Success!");
    console.log(`Tenant: ${tenant.name}`);
    console.log(`New Bonus Credit Balance: ${tenant.bonusCredits}`);
  } catch (err) {
    console.error("Error adding credits:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
