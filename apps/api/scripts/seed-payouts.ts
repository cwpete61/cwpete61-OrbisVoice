
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "partner@test.com";
    console.log(`Seeding payout data for ${email}...`);

    // 1. Ensure the user exists
    let user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log("Creating test user...");
        const tenant = await prisma.tenant.create({ data: { name: "Test Partner Workspace" } });
        user = await prisma.user.create({
            data: {
                email,
                name: "Test Partner",
                username: "testpartner",
                passwordHash: "$2a$10$Efy7JcR/mSj6C0XyXpXR6eS7k6Z/i8u3G0qRyS7Y0S6Y8S0S6Y8S0", // Password: password123
                tenantId: tenant.id,
                isAffiliate: true,
                role: "USER"
            }
        });
    }

    // 2. Ensure the affiliate record exists and is active
    console.log("Setting up affiliate profile...");
    let affiliate = await prisma.affiliate.findUnique({ where: { userId: user.id } });

    if (!affiliate) {
        affiliate = await prisma.affiliate.create({
            data: {
                userId: user.id,
                status: "ACTIVE",
                slug: "testpartner",
                balance: 500,
                totalEarnings: 500,
                totalPaid: 0,
                stripeAccountId: "acct_dummy_test_123",
                stripeAccountStatus: "active",
                taxFormCompleted: true,
                payoutEmail: email
            }
        });
    } else {
        affiliate = await prisma.affiliate.update({
            where: { id: affiliate.id },
            data: {
                status: "ACTIVE",
                stripeAccountId: "acct_dummy_test_123",
                stripeAccountStatus: "active",
                taxFormCompleted: true,
            }
        });
    }

    // 3. Add some available reward transactions
    console.log("Seeding reward transactions...");
    const availableCount = await prisma.rewardTransaction.count({
        where: { referrerId: user.id, status: "available" }
    });

    if (availableCount === 0) {
        // Create 5 transactions of $100 each
        for (let i = 0; i < 5; i++) {
            await prisma.rewardTransaction.create({
                data: {
                    referrerId: user.id,
                    refereeId: user.id, // self-referral for simplicity in testing
                    amount: 100,
                    status: "available",
                    sourcePaymentId: `test_pay_${Date.now()}_${i}`,
                    holdEndsAt: new Date()
                }
            });
        }
        console.log("Added $500 in available rewards.");
    } else {
        console.log("Rewards already exist.");
    }

    console.log("Seeding completed successfully.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
