

export interface ScheduledIntermediateControl {
  id: string;
  academicYearId: string;
  intermediateControlId: string;
  shortName: string;
  startDate: string;
  endDate: string;
  semesterId?: string;
  createdAt: Date;
  updatedAt: Date;
}
