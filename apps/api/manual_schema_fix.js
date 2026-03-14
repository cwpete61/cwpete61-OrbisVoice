/* eslint-disable */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function runFix() {
    console.log('--- STARTING MANUAL SCHEMA RECOVERY ---');
    try {
        // StripeConnectConfig fixes
        console.log('Syncing StripeConnectConfig schema...');
        const stripeCols = [
            'ALTER TABLE "StripeConnectConfig" ADD COLUMN IF NOT EXISTS "webhookSecret" TEXT',
            'ALTER TABLE "StripeConnectConfig" ADD COLUMN IF NOT EXISTS "priceStarter" TEXT',
            'ALTER TABLE "StripeConnectConfig" ADD COLUMN IF NOT EXISTS "priceProfessional" TEXT',
            'ALTER TABLE "StripeConnectConfig" ADD COLUMN IF NOT EXISTS "priceEnterprise" TEXT',
            'ALTER TABLE "StripeConnectConfig" ADD COLUMN IF NOT EXISTS "priceLtd" TEXT',
            'ALTER TABLE "StripeConnectConfig" ADD COLUMN IF NOT EXISTS "priceAiInfra" TEXT',
            'ALTER TABLE "StripeConnectConfig" ADD COLUMN IF NOT EXISTS "minimumPayout" DOUBLE PRECISION DEFAULT 100'
        ];
        for (const sql of stripeCols) {
            await prisma.$executeRawUnsafe(sql).catch(e => console.log(`  (Note: ${e.message.split('\n')[0]})`));
        }

        // User table fixes
        console.log('Syncing User schema...');
        const userCols = [
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "businessName" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phone" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "address" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "unit" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "city" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "state" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "zip" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "taxFormUrl" TEXT',
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tinSsn" TEXT'
        ];
        for (const sql of userCols) {
            await prisma.$executeRawUnsafe(sql).catch(e => console.log(`  (Note: ${e.message.split('\n')[0]})`));
        }

        // Tenant table fixes
        console.log('Syncing Tenant schema...');
        const tenantCols = [
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT DEFAULT \'starter\'',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionEnds" TIMESTAMP(3)',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER DEFAULT 100',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER DEFAULT 0',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "usageResetAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "creditBalance" DOUBLE PRECISION DEFAULT 0',
            'ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT'
        ];
        for (const sql of tenantCols) {
            await prisma.$executeRawUnsafe(sql).catch(e => console.log(`  (Note: ${e.message.split('\n')[0]})`));
        }

        // PlatformSettings fixes
        console.log('Syncing PlatformSettings schema...');
        const platformCols = [
            'ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "payoutMinimum" DOUBLE PRECISION DEFAULT 100',
            'ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "refundHoldDays" INTEGER DEFAULT 14',
            'ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "payoutCycleDelayMonths" INTEGER DEFAULT 1',
            'ALTER TABLE "PlatformSettings" ADD COLUMN IF NOT EXISTS "defaultCommissionLevel" TEXT DEFAULT \'LOW\''
        ];
        for (const sql of platformCols) {
            await prisma.$executeRawUnsafe(sql).catch(e => console.log(`  (Note: ${e.message.split('\n')[0]})`));
        }

        // Affiliate fixes
        console.log('Syncing Affiliate schema...');
        const affiliateCols = [
            'ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "payoutHoldReason" TEXT',
            'ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "payoutHoldLiftedAt" TIMESTAMP(3)',
            'ALTER TABLE "Affiliate" ADD COLUMN IF NOT EXISTS "payoutHoldLiftedBy" TEXT'
        ];
        for (const sql of affiliateCols) {
            await prisma.$executeRawUnsafe(sql).catch(e => console.log(`  (Note: ${e.message.split('\n')[0]})`));
        }

        // NotificationTemplate fix
        console.log('Syncing NotificationTemplate schema...');
        await prisma.$executeRawUnsafe('ALTER TABLE "NotificationTemplate" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN DEFAULT true')
            .catch(e => console.log(`  (Note: ${e.message.split('\n')[0]})`));

        console.log('--- MANUAL SCHEMA RECOVERY COMPLETE ---');
    } catch (err) {
        console.error('FATAL ERROR DURING SCHEMA RECOVERY:', err);
    } finally {
        await prisma.$disconnect();
    }
}

runFix();
