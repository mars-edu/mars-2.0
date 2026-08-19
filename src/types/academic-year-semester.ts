

export interface AcademicYearSemester {
  id: string;
  academicYearId: string;
  semesterDefinitionId: string;
  semesterNumber: number; // Derived from semesterDefinition
  semesterName: string; // Derived from semesterDefinition
  startDate: string;
  endDate: string;
  /**
   * Teaching weeks in this semester — the normative figure, not the calendar
   * span. Seeds `weeks{N}` when a discipline is added to a workload.
   * Falls back to DEFAULT_SEMESTER_WEEKS when unset.
   */
  weeksCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

/** Fallback teaching weeks when a semester has no explicit `weeksCount`. */
export const DEFAULT_SEMESTER_WEEKS = 18;
