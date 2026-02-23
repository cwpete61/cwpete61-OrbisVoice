import { PrismaClient } from "@prisma/client";
import { affiliateManager } from "../src/services/affiliate";

const prisma = new PrismaClient();

async function main() {
    // 1. Find or create test affiliates with available rewards
    const admin = await prisma.user.findUnique({
        where: { email: 'admin@orbisvoice.app' },
        include: { affiliate: true }
    });

    const user = await prisma.user.findUnique({
        where: { email: 'wbrown@browncorp.com' },
        include: { affiliate: true }
    });

    if (!admin || !user) {
        console.error("Test users not found. Run seeds or ensure users exist.");
        return;
    }

    console.log("Found test users.");

    // Ensure they are affiliates and have dummy Stripe info for testing
    if (!admin.affiliate) {
        console.log("Creating affiliate for admin...");
        await affiliateManager.applyForAffiliate(admin.id, "ACTIVE");
    }
    if (!user.affiliate) {
        console.log("Creating affiliate for user...");
        await affiliateManager.applyForAffiliate(user.id, "ACTIVE");
    }

    // Refresh data and add dummy stripe info
    await prisma.affiliate.update({
        where: { userId: admin.id },
        data: { stripeAccountId: 'acct_dummy_admin', stripeAccountStatus: 'active' }
    });
    await prisma.affiliate.update({
        where: { userId: user.id },
        data: { stripeAccountId: 'acct_dummy_user', stripeAccountStatus: 'active' }
    });

    const aff1 = await prisma.affiliate.findUnique({ where: { userId: admin.id } });
    const aff2 = await prisma.affiliate.findUnique({ where: { userId: user.id } });

    if (!aff1 || !aff2) throw new Error("Failed to ensure affiliates exist");

    // 2. Add some 'available' rewards if they don't have any
    const rewards1 = await prisma.rewardTransaction.findMany({ where: { referrerId: admin.id, status: 'available' } });
    if (rewards1.length === 0) {
        console.log("Adding mock rewards for admin...");
        await prisma.rewardTransaction.create({
            data: { referrerId: admin.id, amount: 50, status: 'available' }
        });
        await prisma.affiliate.update({
            where: { userId: admin.id },
            data: { balance: { increment: 50 } }
        });
    }

    const rewards2 = await prisma.rewardTransaction.findMany({ where: { referrerId: user.id, status: 'available' } });
    if (rewards2.length === 0) {
        console.log("Adding mock rewards for user...");
        await prisma.rewardTransaction.create({
            data: { referrerId: user.id, amount: 75, status: 'available' }
        });
        await prisma.affiliate.update({
            where: { userId: user.id },
            data: { balance: { increment: 75 } }
        });
    }

    console.log("Starting bulk payout test (using dummy accounts for simulation)...");
    const ids = [aff1.id, aff2.id];

    const results = await affiliateManager.processBulkPayouts(ids);

    console.log("Bulk Payout Results:");
    console.log(`Successful: ${results.successful.length}`);
    console.log(`Failed: ${results.failed.length}`);
    console.log(`Total Amount: ${results.totalAmount}`);

    if (results.failed.length > 0) {
        console.log("Failures:");
        results.failed.forEach(f => console.log(`- ${f.id}: ${f.error}`));
    }

    // 3. Verify DB state (optional check)
    const updatedAff1 = await prisma.affiliate.findUnique({ where: { id: aff1.id } });
    console.log(`Admin new balance: ${updatedAff1?.balance}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
