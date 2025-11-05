export interface JournalChangeRecord {
  id: string;
  journalId: string;
  studentId: string;
  markIndex: number; // Column index
  valueIndex: number; // Row index (for multi-row columns)
  oldValue: string | null;
  newValue: string | null;
  changedBy: string; // User ID
  changedAt: string; // ISO timestamp
  columnLabel: string; // Human-readable column name
  columnDate?: string; // ISO date if applicable
}
