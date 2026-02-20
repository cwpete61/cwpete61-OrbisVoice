-- AlterTable
ALTER TABLE "Referral" ALTER COLUMN "expiresAt" SET DEFAULT now() + interval '90 days';

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "subscriptionTier" SET DEFAULT 'starter';

-- CreateTable
CREATE TABLE "CalendarCredentials" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "calendarEmail" TEXT,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarCredentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CalendarCredentials_userId_tenantId_key" ON "CalendarCredentials"("userId", "tenantId");
