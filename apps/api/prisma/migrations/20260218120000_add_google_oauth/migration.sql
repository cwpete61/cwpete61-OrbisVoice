-- AlterTable
ALTER TABLE "User" ADD COLUMN "googleId" TEXT,
ADD COLUMN "googleEmail" TEXT,
ADD COLUMN "googleName" TEXT,
ADD COLUMN "googleProfilePicture" TEXT,
ADD COLUMN "googleAuthProvider" TEXT,
ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");
