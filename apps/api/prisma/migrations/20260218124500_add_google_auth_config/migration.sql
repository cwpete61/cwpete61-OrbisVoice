-- CreateTable
CREATE TABLE "GoogleAuthConfig" (
  "id" TEXT NOT NULL,
  "clientId" TEXT,
  "clientSecret" TEXT,
  "redirectUri" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "GoogleAuthConfig_pkey" PRIMARY KEY ("id")
);
