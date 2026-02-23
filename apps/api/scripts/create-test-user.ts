
import { PrismaClient } from "../prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "saasuser@example.com";
    const name = "SaaS User";

    // Create tenant first
    const tenant = await prisma.tenant.create({
        data: {
            name: `${name}'s Workspace`,
        }
    });

    const user = await prisma.user.create({
        data: {
            email,
            name,
            username: "saasuser",
            tenantId: tenant.id,
            role: "USER",
            isAdmin: false,
            isAffiliate: false
        }
    });

    console.log("Created SaaS User:", user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
