-- CreateEnum
CREATE TYPE "CommissionLevel" AS ENUM ('LOW', 'MED', 'HIGH');

-- CreateEnum
CREATE TYPE "AffiliateStatus" AS ENUM ('PENDING', 'ACTIVE', 'REJECTED');

-- CreateEnum
CREATE TYPE "AffiliateReferralStatus" AS ENUM ('PENDING', 'CONVERTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('PENDING', 'PAID', 'CANCELLED');

-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '90 days';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "commissionLevel" "CommissionLevel" NOT NULL DEFAULT 'LOW';

-- CreateTable
CREATE TABLE "TenantTwilioConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accountSid" TEXT NOT NULL,
    "authToken" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantTwilioConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformSettings" (
    "id" TEXT NOT NULL DEFAULT 'global',
    "lowCommission" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "medCommission" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "highCommission" DOUBLE PRECISION NOT NULL DEFAULT 30,
    "starterLimit" INTEGER NOT NULL DEFAULT 1000,
    "professionalLimit" INTEGER NOT NULL DEFAULT 10000,
    "enterpriseLimit" INTEGER NOT NULL DEFAULT 100000,
    "ltdLimit" INTEGER NOT NULL DEFAULT 1000,
    "aiInfraLimit" INTEGER NOT NULL DEFAULT 250000,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Affiliate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "AffiliateStatus" NOT NULL DEFAULT 'PENDING',
    "slug" TEXT NOT NULL,
    "paymentInfo" TEXT,
    "totalEarnings" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Affiliate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliateReferral" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "refereeId" TEXT,
    "status" "AffiliateReferralStatus" NOT NULL DEFAULT 'PENDING',
    "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliateReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffiliatePayout" (
    "id" TEXT NOT NULL,
    "affiliateId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "status" "PayoutStatus" NOT NULL DEFAULT 'PENDING',
    "method" TEXT NOT NULL DEFAULT 'stripe',
    "transactionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AffiliatePayout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantTwilioConfig_tenantId_key" ON "TenantTwilioConfig"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_userId_key" ON "Affiliate"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Affiliate_slug_key" ON "Affiliate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "AffiliateReferral_refereeId_key" ON "AffiliateReferral"("refereeId");

-- AddForeignKey
ALTER TABLE "TenantTwilioConfig" ADD CONSTRAINT "TenantTwilioConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Affiliate" ADD CONSTRAINT "Affiliate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliateReferral" ADD CONSTRAINT "AffiliateReferral_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffiliatePayout" ADD CONSTRAINT "AffiliatePayout_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "Affiliate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
