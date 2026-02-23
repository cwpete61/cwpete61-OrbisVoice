"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Global config:");
    const globalConfig = await prisma.platformSettings.findUnique({ where: { id: "global" } });
    console.log(globalConfig);
    // Actually, wait, the table is called GoogleAuthConfig but it's not in the main schema, wait. 
    // Let's use prisma.$queryRaw since we don't know the exact name.
    console.log("Trying to find GoogleAuthConfig...");
    try {
        const res = await prisma.$queryRaw `SELECT * FROM "GoogleAuthConfig"`;
        console.log(res);
    }
    catch (e) {
        console.log("No GoogleAuthConfig table");
    }
}
main().finally(() => prisma.$disconnect());
