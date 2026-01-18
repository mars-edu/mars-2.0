// ============================================================================
// Analytics Export - Shared Types (Frontend-safe)
// ============================================================================

export interface DisciplineInfo {
  id: string;
  title: string;
}

export interface FinalControlForm {
  id: string;
  shortName: string;
}

export interface StudentRow {
  index: number;
  fullName: string;
  semester: Record<string, string | number>;
  withoutFinal: Record<string, string | number>;
  finals: Record<string, Record<string, string | number>>;
  overallAverage?: string | number;
}

export interface SpecialtyGroup {
  specialtyName: string;
  disciplinesSemester: DisciplineInfo[];
  disciplinesWithoutFinal: DisciplineInfo[];
  disciplinesByForm: Record<string, DisciplineInfo[]>;
  rows: StudentRow[];
}

export interface CourseGroup {
  course: string;
  specialtyGroups: SpecialtyGroup[];
}

export interface AnalyticsExportPayload {
  courseGroups: CourseGroup[];
  finalForms: FinalControlForm[];
}
