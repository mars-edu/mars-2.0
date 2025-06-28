import { defineStore } from "pinia";
import { ref, computed } from "vue";
import Fuse from "fuse.js";
import { useAcademicYearStore } from "./academicYearStore";
import { useCourseStore, type Course } from "./courseStore";

export interface Student {
  id: string;
  surname: string;
  firstName: string;
  patronymic: string;
  specialty: string;
  language: string;
  base: number;
  gender: "male" | "female";
  academicYearId?: string;
}

export interface StudentWithCourse extends Student {
  course: number;
}

export interface AddStudentPayload {
  surname: string;
  firstName: string;
  patronymic: string;
  specialty: string;
  language: string;
  base: number;
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

export const useStudentStore = defineStore("student", () => {
  const students = ref<Student[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<StudentFilters>({
    specialty: "",
    language: "",
    gender: "",
    base: "",
    academicYearId: "",
    searchTerm: "",
    course: "",
  });

  const academicYearStore = useAcademicYearStore();

  const getAllStudents = computed(() => students.value);

  const filteredStudents = computed((): StudentWithCourse[] => {
    let studentsToFilter: Student[] = [...students.value];

    // Apply standard filters first
    studentsToFilter = studentsToFilter.filter((student) => {
      const specialtyMatch =
        !filters.value.specialty ||
        student.specialty === filters.value.specialty;
      const languageMatch =
        !filters.value.language || student.language === filters.value.language;
      const genderMatch =
        !filters.value.gender || student.gender === filters.value.gender;
      const baseMatch =
        !filters.value.base || student.base.toString() === filters.value.base;
      const academicYearMatch =
        !filters.value.academicYearId ||
        student.academicYearId === filters.value.academicYearId;

      return (
        specialtyMatch &&
        languageMatch &&
        genderMatch &&
        baseMatch &&
        academicYearMatch
      );
    });

    let studentsWithCourse = studentsToFilter.map((student) => {
      const activeAcademicYear = academicYearStore.getActiveAcademicYear;
      const studentAcademicYear = academicYearStore.getAcademicYearById(
        student.academicYearId || ""
      );

      let course = 1;
      if (activeAcademicYear && studentAcademicYear) {
        course =
          activeAcademicYear.startYear - studentAcademicYear.startYear + 1;
      }

      return {
        ...student,
        course: course,
      };
    });

    if (filters.value.course) {
      studentsWithCourse = studentsWithCourse.filter(
        (student) => student.course.toString() === filters.value.course
      );
    }

    if (filters.value.searchTerm) {
      const studentsWithFio = studentsWithCourse.map((student) => ({
        ...student,
        fio: `${student.surname} ${student.firstName} ${student.patronymic}`,
      }));

      const fuse = new Fuse(studentsWithFio, {
        keys: ["surname", "firstName", "patronymic", "fio"],
        threshold: 0.3,
      });
      return fuse.search(filters.value.searchTerm).map((result) => result.item);
    }

    return studentsWithCourse;
  });

  const setFilter = (key: keyof StudentFilters, value: string) => {
    filters.value[key] = value;
  };

  const clearFilters = () => {
    filters.value = {
      specialty: "",
      language: "",
      gender: "",
      base: "",
      academicYearId: "",
      searchTerm: "",
      course: "",
    };
  };

  const addStudent = async (payload: AddStudentPayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      const newStudent: Student = {
        id: crypto.randomUUID(),
        ...payload,
      };

      students.value.push(newStudent);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add student";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const updateStudent = async (
    id: string,
    payload: Partial<Omit<Student, "id">>
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      const index = students.value.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Student not found");

      students.value[index] = {
        ...students.value[index],
        ...payload,
      };
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to update student";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const index = students.value.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Student not found");

      students.value.splice(index, 1);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to delete student";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    students.value = [];
    isLoading.value = false;
    error.value = null;
    filters.value = {
      specialty: "",
      language: "",
      gender: "",
      base: "",
      academicYearId: "",
      searchTerm: "",
      course: "",
    };
  };

  const getError = computed(() => error.value);

  return {
    students,
    isLoading,
    filters,
    getAllStudents,
    filteredStudents,
    setFilter,
    clearFilters,
    addStudent,
    updateStudent,
    deleteStudent,
    clearError,
    reset,
    getError,
  };
});
