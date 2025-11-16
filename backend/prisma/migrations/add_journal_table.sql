-- CreateTable Journal (if not exists)
CREATE TABLE IF NOT EXISTS "Journal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disciplineId" TEXT NOT NULL,
    "groupName" TEXT,
    "academicYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Journal_disciplineId_idx" ON "Journal"("disciplineId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "Journal_academicYear_semester_idx" ON "Journal"("academicYear", "semester");
