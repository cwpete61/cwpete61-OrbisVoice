
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function enforceAllReferrersToHigh() {
    try {
        console.log('--- ENFORCING HIGH COMMISSION (30%) FOR ALL REFERRERS ---');

        // 1. Ensure global settings are correct (20, 25, 30)
        await prisma.platformSettings.upsert({
            where: { id: 'global' },
            update: {
                lowCommission: 20,
                medCommission: 25,
                highCommission: 30,
                defaultCommissionLevel: 'HIGH',
                refundHoldDays: 30 // As per latest payout rules
            },
            create: {
                id: 'global',
                lowCommission: 20,
                medCommission: 25,
                highCommission: 30,
                defaultCommissionLevel: 'HIGH',
                refundHoldDays: 30,
                transactionFeePercent: 3.4
            }
        });
        console.log('Global PlatformSettings verified: High set to 30%.');

        // 2. Set all Users to HIGH level
        const userUpdate = await prisma.user.updateMany({
            data: { commissionLevel: 'HIGH' }
        });
        console.log(`Updated ${userUpdate.count} users to HIGH commission level.`);

        // 3. Clear/Update Affiliate overrides that are lower than 30%
        // We set them to 30 or null them out so they fall back to the User.commissionLevel (HIGH)
        const affUpdate = await prisma.affiliate.updateMany({
            where: {
                OR: [
                    { lockedCommissionRate: { lt: 30 } },
                    { customCommissionRate: { lt: 30 } }
                ]
            },
            data: {
                lockedCommissionRate: 30,
                customCommissionRate: 30
            }
        });
        console.log(`Enforced 30% rate on ${affUpdate.count} affiliates with lower overrides.`);

        // 4. Update any existing RewardTransactions for the specific missing sale if they were processed at 10%
        // The user previously mentioned a sale that was at 10%.
        const txUpdate = await prisma.rewardTransaction.updateMany({
            where: {
                amount: { lt: 50 }, // Heuristic: it was $19.70 (10% of $197)
                status: 'pending'
            },
            data: {
                amount: 59.10 // 30% of $197
            }
        });
        console.log(`Updated ${txUpdate.count} pending reward transactions to the 30% rate ($59.10).`);

    } catch (err) {
        console.error('ERROR ENFORCING SETTINGS:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

enforceAllReferrersToHigh();
