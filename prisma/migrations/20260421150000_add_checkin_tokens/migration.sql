CREATE TABLE "CheckInToken" (
  "id"        SERIAL PRIMARY KEY,
  "token"     TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  "studentId" INTEGER NOT NULL,
  "sessionId" INTEGER NOT NULL,
  "packageId" INTEGER NOT NULL,
  "date"      DATE NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CheckInToken_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CheckInToken_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "CheckInToken_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
