/*
  Warnings:

  - You are about to drop the `UserOAuthConfig` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '90 days';

-- DropTable
DROP TABLE "UserOAuthConfig";

-- CreateTable
CREATE TABLE "TenantGoogleConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "geminiApiKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TenantGoogleConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TenantGoogleConfig_tenantId_key" ON "TenantGoogleConfig"("tenantId");

-- AddForeignKey
ALTER TABLE "TenantGoogleConfig" ADD CONSTRAINT "TenantGoogleConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
