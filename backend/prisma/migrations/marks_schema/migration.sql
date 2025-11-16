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
