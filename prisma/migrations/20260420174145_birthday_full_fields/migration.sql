-- AlterTable
ALTER TABLE "BirthdayInquiry" ADD COLUMN     "commApp" TEXT,
ADD COLUMN     "favColor" TEXT,
ADD COLUMN     "favSuperhero" TEXT,
ADD COLUMN     "isMember" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "kid2Age" INTEGER,
ADD COLUMN     "kid2Gender" TEXT,
ADD COLUMN     "kid2Name" TEXT,
ADD COLUMN     "kidGender" TEXT;
