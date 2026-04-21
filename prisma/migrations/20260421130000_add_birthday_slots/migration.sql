CREATE TABLE "BirthdaySlot" (
  "id"         SERIAL PRIMARY KEY,
  "locationId" INTEGER,
  "date"       DATE NOT NULL,
  "startTime"  TEXT NOT NULL,
  "endTime"    TEXT NOT NULL,
  "maxParties" INTEGER NOT NULL DEFAULT 1,
  "booked"     BOOLEAN NOT NULL DEFAULT false,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BirthdaySlot_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
