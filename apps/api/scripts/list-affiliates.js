"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
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
