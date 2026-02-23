import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    const affiliates = await prisma.affiliate.findMany({
        include: {
            user: true,
        }
    });

    console.log(JSON.stringify(affiliates, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
