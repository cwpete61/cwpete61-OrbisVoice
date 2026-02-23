"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log("Updating default system commission rate to 30% (HIGH)...");
    // 1. Update PlatformSettings to HIGH (30%)
    await prisma.platformSettings.upsert({
        where: { id: "global" },
        update: { defaultCommissionLevel: "HIGH" },
        create: {
            id: "global",
            defaultCommissionLevel: "HIGH"
        }
    });
    console.log("Updating existing Affiliate/Referral agents to 30% locked rate...");
    // 2. Update existing Affiliates to 30% locked commission rate
    const updated = await prisma.affiliate.updateMany({
        data: { lockedCommissionRate: 30 }
    });
    console.log(`Updated ${updated.count} existing agents to 30% commission rate.`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
