import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRaw`UPDATE "GoogleAuthConfig" SET "redirectUri" = 'http://localhost:3000/auth/google/callback' WHERE id = 'google-auth-config'`;
    console.log("Reverted GoogleAuthConfig redirectUri to /auth/google/callback");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
