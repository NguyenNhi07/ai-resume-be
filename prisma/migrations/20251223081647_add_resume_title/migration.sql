-- AlterTable
ALTER TABLE "User" ADD COLUMN     "resetNewPassword" TEXT,
ADD COLUMN     "resetOtpExpiredAt" TIMESTAMP(3),
ADD COLUMN     "resetOtpHash" TEXT;
