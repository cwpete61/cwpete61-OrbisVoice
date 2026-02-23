
import { PrismaClient } from "../prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "saasuser@example.com";
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        await prisma.user.delete({ where: { id: user.id } });
        await prisma.tenant.delete({ where: { id: user.tenantId } });
        console.log("Cleaned up test user and tenant.");
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
