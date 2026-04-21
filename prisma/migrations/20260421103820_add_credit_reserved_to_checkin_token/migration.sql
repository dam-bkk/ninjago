/*
  Warnings:

  - The `creditType` column on the `Event` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `periodType` on the `CalendarOverride` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `sessionType` on the `Event` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "CalendarOverride" DROP COLUMN "periodType",
ADD COLUMN     "periodType" "PeriodType" NOT NULL;

-- AlterTable
ALTER TABLE "CheckInToken" ADD COLUMN     "creditReserved" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "token" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Event" DROP COLUMN "sessionType",
ADD COLUMN     "sessionType" "SessionType" NOT NULL,
DROP COLUMN "creditType",
ADD COLUMN     "creditType" "CreditType";
