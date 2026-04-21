CREATE TABLE "CalendarOverride" (
  "id"         SERIAL PRIMARY KEY,
  "date"       DATE NOT NULL UNIQUE,
  "periodType" TEXT NOT NULL,
  "note"       TEXT,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
