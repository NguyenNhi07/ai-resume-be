-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('Admin', 'Leader', 'Staff');

-- CreateEnum
CREATE TYPE "ProjectRole" AS ENUM ('PM', 'Developer', 'Tester');

-- CreateEnum
CREATE TYPE "WorkingStatus" AS ENUM ('Active', 'OnLeave', 'Inactive');

-- CreateEnum
CREATE TYPE "ProjectPrivacy" AS ENUM ('Public', 'Private');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('Planned', 'Active', 'Completed', 'Archived');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('Active', 'Inactive', 'Closed');

-- CreateEnum
CREATE TYPE "WorkStatus" AS ENUM ('Todo', 'Development', 'InProgress', 'DoneTesting', 'Review', 'Done');

-- CreateEnum
CREATE TYPE "LabelType" AS ENUM ('Design', 'API', 'Dev', 'Bug', 'Planning');

-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('Low', 'Medium', 'High');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('Male', 'Female', 'Other');

-- CreateEnum
CREATE TYPE "UserLanguage" AS ENUM ('En', 'Vn');

-- CreateEnum
CREATE TYPE "AuditTrailType" AS ENUM ('Update');

-- CreateEnum
CREATE TYPE "HistoryType" AS ENUM ('Update');

-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "temporaryPassword" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT,
    "status" "UserStatus" NOT NULL DEFAULT 'Active',
    "dob" TIMESTAMP(3),
    "role" "UserRole" NOT NULL,
    "gender" "Gender" NOT NULL DEFAULT 'Other',
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "imageLink" TEXT,
    "lastActive" TIMESTAMP(3),
    "forceResetPassword" BOOLEAN NOT NULL DEFAULT false,
    "language" "UserLanguage" NOT NULL DEFAULT 'En',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storage" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER,
    "filename" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "mimetype" TEXT,
    "size" INTEGER NOT NULL,
    "originalname" TEXT NOT NULL,
    "encoding" TEXT,
    "destination" TEXT,
    "epicId" INTEGER,
    "storyId" INTEGER,
    "taskId" INTEGER,
    "subTaskId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditTrail" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "before" JSONB NOT NULL,
    "after" JSONB,
    "diffs" JSONB,
    "type" "AuditTrailType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "AuditTrail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "History" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "condition" JSONB NOT NULL,
    "content" JSONB NOT NULL,
    "type" "HistoryType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Storage_filename_key" ON "Storage"("filename");
