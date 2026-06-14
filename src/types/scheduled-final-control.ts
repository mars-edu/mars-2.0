

export interface ScheduledFinalControl {
  id: string;
  academicYearId: string;
  finalControlId: string;
  shortName: string;
  startDate: string;
  endDate: string;
  semesterId?: string;
  createdAt: Date;
  updatedAt: Date;
}
