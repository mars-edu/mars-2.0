import type { D1Database } from "@cloudflare/workers-types";

/**
 * Run database migrations on application startup
 * This ensures the schema is up to date before handling requests
 */
export async function runMigrations(db: D1Database): Promise<void> {
  console.log("[Migrations] Starting database migrations...");

  try {
    // Check if Journal table exists
    const tableCheck = await db
      .prepare(
        `SELECT name FROM sqlite_master WHERE type='table' AND name='Journal'`
      )
      .first();

    if (!tableCheck) {
      console.log("[Migrations] Journal table not found, running marks_schema migration...");

      // Run the marks schema migration
      const migration = `
-- CreateTable
CREATE TABLE "Journal" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "disciplineId" TEXT NOT NULL,
    "groupName" TEXT,
    "academicYear" TEXT NOT NULL,
    "semester" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JournalStudent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    CONSTRAINT "JournalStudent_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Mark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "columnIndex" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "value" TEXT,
    "columnType" TEXT NOT NULL,
    "columnDate" TEXT,
    "columnLabel" TEXT,
    "controlType" TEXT,
    "controlId" TEXT,
    "sessionId" TEXT,
    "scheduledControlId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    CONSTRAINT "Mark_journalId_fkey" FOREIGN KEY ("journalId") REFERENCES "Journal" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MarkHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "columnIndex" INTEGER NOT NULL,
    "rowIndex" INTEGER NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "columnLabel" TEXT,
    "columnDate" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT
);

-- CreateIndex
CREATE INDEX "Journal_disciplineId_idx" ON "Journal"("disciplineId");

-- CreateIndex
CREATE INDEX "Journal_academicYear_semester_idx" ON "Journal"("academicYear", "semester");

-- CreateIndex
CREATE UNIQUE INDEX "JournalStudent_journalId_studentId_key" ON "JournalStudent"("journalId", "studentId");

-- CreateIndex
CREATE INDEX "JournalStudent_studentId_idx" ON "JournalStudent"("studentId");

-- CreateIndex
CREATE UNIQUE INDEX "Mark_journalId_studentId_columnIndex_rowIndex_key" ON "Mark"("journalId", "studentId", "columnIndex", "rowIndex");

-- CreateIndex
CREATE INDEX "Mark_journalId_studentId_idx" ON "Mark"("journalId", "studentId");

-- CreateIndex
CREATE INDEX "Mark_studentId_idx" ON "Mark"("studentId");

-- CreateIndex
CREATE INDEX "MarkHistory_journalId_studentId_idx" ON "MarkHistory"("journalId", "studentId");

-- CreateIndex
CREATE INDEX "MarkHistory_createdAt_idx" ON "MarkHistory"("createdAt");
`;

      // Split migration into individual statements and execute
      const statements = migration
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const statement of statements) {
        if (statement) {
          await db.prepare(statement + ";").run();
        }
      }

      console.log("[Migrations] ✅ marks_schema migration completed successfully");
    } else {
      console.log("[Migrations] ✅ Database schema is up to date");
    }
  } catch (error) {
    console.error("[Migrations] ❌ Migration failed:", error);
    throw error;
  }
}
