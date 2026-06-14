

export interface WeeklySchedule {
  weekId: number;
  startTime?: string;
  endTime?: string;
  startId?: string;
  endId?: string;
}


export interface JournalSettings {
  calculationType: "calculated" | "manual";
  calculationMethod: "only-assigned" | "all-days";
  finalControlForm?: "written" | "oral" | "mixed";
  finalGradeFormula?: {
    intermediateWeight: number;
    finalWeight: number;
  };
}


export interface CalendarEvent {
  id: string;
  rupEntryId: string;
  ktpId?: string; // Direct reference to the event's dedicated KTP
  teacherId?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  participants: string[];
  color?: string;
  semester: string;
  useCustomPeriod: boolean;
  weeklySchedules?: WeeklySchedule[];
  isIndividualJournal?: boolean;
  mergedJournalIds?: string[];
  parentIndividualJournalId?: string;
  sourceGroupEventId?: string;
  gradingType?: "combined" | "separate";
  customTitle?: string;
  isClosed?: boolean;
  journalSettings?: JournalSettings;
  createdAt: Date;
  updatedAt: Date;
}
