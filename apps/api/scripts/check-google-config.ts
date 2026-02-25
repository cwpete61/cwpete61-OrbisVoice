import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Checking Google Auth Config in database...");
    const config = await prisma.googleAuthConfig.findFirst();
    console.log("Global Config:", JSON.stringify(config, null, 2));

    const tenantConfigs = await prisma.tenantGoogleConfig.findMany();
    console.log("Tenant Configs:", JSON.stringify(tenantConfigs, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
