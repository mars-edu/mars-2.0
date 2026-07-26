

export interface AcademicYear {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  /** Length of one academic hour in minutes (default 45 when unset). */
  academicHourMinutes?: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Shared default for academicHourMinutes (Kazakhstan college standard). */
export const DEFAULT_ACADEMIC_HOUR_MINUTES = 45;
