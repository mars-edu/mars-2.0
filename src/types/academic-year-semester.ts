

export interface AcademicYearSemester {
  id: string;
  academicYearId: string;
  semesterDefinitionId: string;
  semesterNumber: number; // Derived from semesterDefinition
  semesterName: string; // Derived from semesterDefinition
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}
