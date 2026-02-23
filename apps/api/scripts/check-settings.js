"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const s = await prisma.platformSettings.findUnique({ where: { id: "global" } });
    console.log(JSON.stringify(s, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
