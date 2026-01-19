-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('Applied', 'Interviewing', 'Offer', 'Rejected', 'Withdrawn');

-- CreateTable
CREATE TABLE "JobApplication" (
    "id" SERIAL NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "userId" INTEGER,
    "jobTitle" TEXT NOT NULL,
    "companyName" TEXT,
    "jobUrl" TEXT NOT NULL,
    "jobDescription" TEXT,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'Applied',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "JobApplication_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobApplication" ADD CONSTRAINT "JobApplication_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
