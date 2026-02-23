
import { PrismaClient } from "../prisma/client";

const prisma = new PrismaClient();

async function main() {
    const s = await prisma.platformSettings.findUnique({ where: { id: "global" } });
    console.log(JSON.stringify(s, null, 2));
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
