-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '90 days';

-- CreateTable
CREATE TABLE "GmailCredentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "gmailEmail" TEXT,
    "scope" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GmailCredentials_userId_tenantId_key" ON "GmailCredentials"("userId", "tenantId");
