CREATE TABLE "Event" (
  "id"          SERIAL PRIMARY KEY,
  "locationId"  INTEGER NOT NULL,
  "name"        TEXT NOT NULL,
  "sessionType" TEXT NOT NULL,
  "creditType"  TEXT,
  "date"        DATE NOT NULL,
  "startTime"   TEXT NOT NULL,
  "endTime"     TEXT NOT NULL,
  "maxCapacity" INTEGER,
  "description" TEXT,
  "active"      BOOLEAN NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Event_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
