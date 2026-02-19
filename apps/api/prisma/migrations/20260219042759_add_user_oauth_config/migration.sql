-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '90 days';

-- CreateTable
CREATE TABLE "UserOAuthConfig" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "gmailClientId" TEXT,
    "gmailClientSecret" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserOAuthConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserOAuthConfig_userId_key" ON "UserOAuthConfig"("userId");
