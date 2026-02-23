import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    await prisma.$executeRaw`UPDATE "GoogleAuthConfig" SET "redirectUri" = 'http://localhost:3000/api/auth/callback/google' WHERE id = 'google-auth-config'`;
    console.log("Updated GoogleAuthConfig redirectUri to /api/auth/callback/google");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
