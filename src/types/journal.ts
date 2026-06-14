

export interface Journal {
  id: string;
  courseNumber: number;
  disciplineId: string;
  group: string;
  students: string[];
  isMixedGroup?: boolean;
  isIndividualJournal?: boolean;
  mergedJournalIds?: string[];
  parentIndividualJournalId?: string;
  sourceGroupEventId?: string;
  customTitle?: string;
}
