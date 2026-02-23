"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const affiliate_1 = require("../src/services/affiliate");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Fetching first user...");
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No users in DB");
        return;
    }
    console.log(`Testing applyForAffiliate for user: ${user.email} (${user.id})`);
    try {
        const res = await affiliate_1.affiliateManager.applyForAffiliate(user.id, "PENDING");
        console.log("Result:", res);
    }
    catch (e) {
        console.error("Caught error:", e);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
