/*
  Warnings:

  - The `dateOfBirth` column on the `Resume` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "dateOfBirth",
ADD COLUMN     "dateOfBirth" TIMESTAMP(3);
