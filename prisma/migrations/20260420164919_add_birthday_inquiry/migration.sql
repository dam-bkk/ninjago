-- CreateEnum
CREATE TYPE "BirthdayInquiryStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "BirthdayInquiry" (
    "id" SERIAL NOT NULL,
    "parentName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "kidName" TEXT NOT NULL,
    "kidAge" INTEGER NOT NULL,
    "guestCount" INTEGER,
    "preferredDate" DATE,
    "preferredTime" TEXT,
    "locationId" INTEGER,
    "notes" TEXT,
    "status" "BirthdayInquiryStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BirthdayInquiry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BirthdayInquiry" ADD CONSTRAINT "BirthdayInquiry_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
