

export interface Teacher {
  id: string;
  userId?: string;
  surname: string;
  firstName: string;
  patronymic: string;
  position: string;
  employmentYear: number;
  gender: "male" | "female";
  email?: string;
  password?: string;
  username?: string;
}


export interface AddTeacherPayload {
  surname: string;
  firstName: string;
  patronymic: string;
  position: string;
  employmentYear: number;
  gender: "male" | "female";
  email?: string;
  password?: string;
}


export interface TeacherFilters {
  position: string;
  employmentYear: string;
  gender: string;
  searchTerm: string;
}
