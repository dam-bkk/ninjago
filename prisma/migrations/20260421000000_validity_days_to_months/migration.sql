-- Add new column with a temporary default
ALTER TABLE "PackagePrice" ADD COLUMN "validityMonths" INTEGER NOT NULL DEFAULT 6;

-- Convert existing days → months (divide by 30, round)
UPDATE "PackagePrice" SET "validityMonths" = ROUND("validityDays"::numeric / 30);

-- Drop the default constraint so the column behaves normally
ALTER TABLE "PackagePrice" ALTER COLUMN "validityMonths" DROP DEFAULT;

-- Drop old column
ALTER TABLE "PackagePrice" DROP COLUMN "validityDays";
