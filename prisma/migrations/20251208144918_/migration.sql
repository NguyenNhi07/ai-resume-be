/*
  Warnings:

  - The `gender` column on the `Resume` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Resume" ALTER COLUMN "name" DROP NOT NULL,
DROP COLUMN "gender",
ADD COLUMN     "gender" "Gender",
ALTER COLUMN "email" DROP NOT NULL;
