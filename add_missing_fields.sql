-- Create GoogleAuthConfig table
CREATE TABLE IF NOT EXISTS "GoogleAuthConfig" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "clientId" TEXT,
  "clientSecret" TEXT,
  "redirectUri" TEXT,
  "enabled" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleEmail" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleProfilePicture" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "googleAuthProvider" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "isBlocked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatar" TEXT;

-- Create unique constraint for username
ALTER TABLE "User" ADD CONSTRAINT "User_username_key" UNIQUE ("username");
ALTER TABLE "User" ADD CONSTRAINT "User_googleId_key" UNIQUE ("googleId");

-- Add missing columns to Tenant table
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionStatus" TEXT;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionTier" TEXT NOT NULL DEFAULT 'starter';
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "subscriptionEnds" TIMESTAMP(3);
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "usageLimit" INTEGER NOT NULL DEFAULT 100;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "usageCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "usageResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Tenant" ADD COLUMN IF NOT EXISTS "billingEmail" TEXT;

-- Create unique constraints for Stripe fields
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_stripeCustomerId_key" UNIQUE ("stripeCustomerId");
ALTER TABLE "Tenant" ADD CONSTRAINT "Tenant_stripeSubscriptionId_key" UNIQUE ("stripeSubscriptionId");
