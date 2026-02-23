import { PrismaClient } from "@prisma/client";
import { affiliateManager } from "../src/services/affiliate";

const prisma = new PrismaClient();

async function main() {
    const user = await prisma.user.findFirst({
        where: { email: 'admin@orbisvoice.app' }
    });

    if (!user) {
        console.log("Admin not found."); return;
    }

    console.log(`Testing applyForAffiliate for admin: ${user.email} (${user.id})`);
    try {
        const res = await affiliateManager.applyForAffiliate(user.id, "PENDING");
        console.log("Result:", res);
    } catch (e) {
        console.error("Caught error:", e);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
