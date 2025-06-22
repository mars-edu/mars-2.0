import { defineStore } from "pinia";
import { ref, computed } from "vue";
import Fuse from "fuse.js";

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
  });

  const getAllStudents = computed(() => students.value);

  const filteredStudents = computed(() => {
    let studentsToFilter = [...students.value];

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

    if (filters.value.searchTerm) {
      const studentsWithFio = studentsToFilter.map((student) => ({
        ...student,
        fio: `${student.surname} ${student.firstName} ${student.patronymic}`,
      }));

      const fuse = new Fuse(studentsWithFio, {
        keys: ["surname", "firstName", "patronymic", "fio"],
        threshold: 0.3,
      });
      return fuse.search(filters.value.searchTerm).map((result) => result.item);
    }

    return studentsToFilter;
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
    };
  };

  const addStudent = async (payload: AddStudentPayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      // TODO: Replace with actual API call
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

  const updateStudent = async (id: string, payload: AddStudentPayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      // TODO: Replace with actual API call
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

      // TODO: Replace with actual API call
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
    getError,
  };
});
