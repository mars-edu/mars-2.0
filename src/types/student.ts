import type { Mark } from './marks';

export interface Student {
  id: string;
  surname: string;
  firstName: string;
  patronymic: string;
  specialty: string;
  language: string;
  base?: number;
  gender: "male" | "female";
  academicYearId?: string;
}

export interface StudentWithCourse extends Student {
  course: number;
}

export interface StudentWithMarks {
  id: number;
  name: string;
  marks: Mark[];
  studentId: string;
}

export interface AddStudentPayload {
  surname: string;
  firstName: string;
  patronymic: string;
  specialty: string;
  language: string;
  base?: number;
  gender: "male" | "female";
  academicYearId?: string;
}

export interface StudentFilters {
  specialty: string;
  language: string;
  gender: string;
  base: string;
  academicYearId: string;
  searchTerm: string;
  course: string;
}
