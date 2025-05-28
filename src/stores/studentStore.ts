import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Student {
  id: string;
  name: string;
  course: number;
  specialty: string;
  language: string;
  base: number;
  gender: "male" | "female";
}

export interface AddStudentPayload {
  name: string;
  course: number;
  specialty: string;
  language: string;
  base: number;
  gender: "male" | "female";
}

export const useStudentStore = defineStore("student", () => {
  const students = ref<Student[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getAllStudents = computed(() => students.value);

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
    getAllStudents,
    addStudent,
    updateStudent,
    deleteStudent,
    clearError,
    getError,
  };
});
