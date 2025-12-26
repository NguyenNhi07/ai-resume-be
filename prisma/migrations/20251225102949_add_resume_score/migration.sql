-- CreateTable
CREATE TABLE "ResumeScore" (
    "id" SERIAL NOT NULL,
    "resumeId" INTEGER NOT NULL,
    "userId" INTEGER,
    "score" INTEGER NOT NULL,
    "jdText" TEXT NOT NULL,
    "matchedRole" TEXT,
    "missingSkills" JSONB NOT NULL,
    "weakSections" JSONB NOT NULL,
    "suggestions" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "ResumeScore_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ResumeScore" ADD CONSTRAINT "ResumeScore_resumeId_fkey" FOREIGN KEY ("resumeId") REFERENCES "Resume"("id") ON DELETE CASCADE ON UPDATE CASCADE;
