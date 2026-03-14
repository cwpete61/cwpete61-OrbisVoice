
/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function applySettings() {
    try {
        console.log('--- APPLYING NEW GLOBAL SETTINGS ---');

        // 1. Update PlatformSettings
        const settings = await prisma.platformSettings.upsert({
            where: { id: 'global' },
            update: {
                lowCommission: 20,
                medCommission: 25,
                highCommission: 30,
                defaultCommissionLevel: 'HIGH',
                commissionDurationMonths: 0,
                payoutMinimum: 100,
                payoutCycleDelayMonths: 1,
                refundHoldDays: 14,
                starterLimit: 1000,
                professionalLimit: 10000,
                enterpriseLimit: 100000,
                ltdLimit: 1000,
                aiInfraLimit: 250000,
                emailVerificationEnabled: true,
                globalEmailEnabled: true
            },
            create: {
                id: 'global',
                lowCommission: 20,
                medCommission: 25,
                highCommission: 30,
                defaultCommissionLevel: 'HIGH',
                commissionDurationMonths: 0,
                payoutMinimum: 100,
                refundHoldDays: 14,
                payoutCycleDelayMonths: 1,
                // transactionFeePercent: 3.4, // Temporarily disabled if causing sync issues
                starterLimit: 1000,
                professionalLimit: 10000,
                enterpriseLimit: 100000,
                ltdLimit: 1000,
                aiInfraLimit: 250000,
                emailVerificationEnabled: true,
                globalEmailEnabled: true
            }
        });
        console.log('Global settings updated successfully.');

        // 2. Update StripeConnectConfig
        const stripeConfig = await prisma.stripeConnectConfig.upsert({
            where: { id: 'global' },
            update: {
                enabled: true,
                priceLtd: "price_ltd_placeholder"
            },
            create: {
                id: 'global',
                enabled: true,
                priceLtd: "price_ltd_placeholder"
            }
        });
        console.log('Stripe configuration updated successfully.');

        // 3. Update all users to HIGH commission level
        const userUpdate = await prisma.user.updateMany({
            data: {
                commissionLevel: 'HIGH'
            }
        });
        console.log(`Updated ${userUpdate.count} user accounts to HIGH commission level.`);

        // 3. Sync all affiliates if necessary (though service pulls from global mostly)
        // No specific change for affiliate model needed unless they have custom overrides.
        // The user said "update every account to use these settings". 
        // If there were custom overrides on affiliates, they might want them reset? 
        // To be safe and "not touch it again", I'll just ensure the global defaults are set.

    } catch (err) {
        console.error('FAILED TO APPLY SETTINGS:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

applySettings();
