

export interface AcademicYear {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  /** Length of one academic hour in minutes (default 45 when unset). */
  academicHourMinutes?: number;
  /** Education technology this year runs under (e.g. "Классическая", "Кредитная"). */
  technologyId?: string;
  /** ISO date — start of the academic year. Falls back to Sept 1 of startYear when unset. */
  startDate?: string;
  /** ISO date — end of the academic year. Falls back to Jun 30 of endYear when unset. */
  endDate?: string;
  createdAt: Date;
  updatedAt: Date;
}

/** Shared default for academicHourMinutes (Kazakhstan college standard). */
export const DEFAULT_ACADEMIC_HOUR_MINUTES = 45;
