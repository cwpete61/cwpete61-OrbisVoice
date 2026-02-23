import { PrismaClient } from "@prisma/client";
import { affiliateManager } from "../src/services/affiliate";

const prisma = new PrismaClient();

async function main() {
    console.log("Fetching first user...");
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("No users in DB"); return;
    }

    console.log(`Testing applyForAffiliate for user: ${user.email} (${user.id})`);
    try {
        const res = await affiliateManager.applyForAffiliate(user.id, "PENDING");
        console.log("Result:", res);
    } catch (e) {
        console.error("Caught error:", e);
    }

}

main().catch(console.error).finally(() => prisma.$disconnect());
