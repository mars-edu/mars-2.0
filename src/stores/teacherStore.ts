import { defineStore } from "pinia";
import { ref, computed } from "vue";
import Fuse from "fuse.js";

export interface Teacher {
  id: string;
  surname: string;
  firstName: string;
  patronymic: string;
  position: string;
  employmentYear: number;
  gender: "male" | "female";
}

export interface AddTeacherPayload {
  surname: string;
  firstName: string;
  patronymic: string;
  position: string;
  employmentYear: number;
  gender: "male" | "female";
}

export interface TeacherFilters {
  position: string;
  employmentYear: string;
  gender: string;
  searchTerm: string;
}

export const useTeacherStore = defineStore("teacher", () => {
  const teachers = ref<Teacher[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<TeacherFilters>({
    position: "",
    employmentYear: "",
    gender: "",
    searchTerm: "",
  });

  const getAllTeachers = computed(() => teachers.value);

  const getTeacherFullName = (idOrTeacher: string | Teacher): string => {
    let teacher: Teacher | undefined;
    if (typeof idOrTeacher === "string") {
      teacher = teachers.value.find((t) => t.id === idOrTeacher);
    } else {
      teacher = idOrTeacher;
    }
    if (!teacher) return typeof idOrTeacher === "string" ? idOrTeacher : "";
    return `${teacher.surname} ${teacher.firstName} ${teacher.patronymic}`;
  };

  const filteredTeachers = computed(() => {
    let teachersToFilter = [...teachers.value];

    teachersToFilter = teachersToFilter.filter((teacher) => {
      const positionMatch =
        !filters.value.position || teacher.position === filters.value.position;
      const employmentYearMatch =
        !filters.value.employmentYear ||
        teacher.employmentYear.toString() === filters.value.employmentYear;
      const genderMatch =
        !filters.value.gender || teacher.gender === filters.value.gender;

      return positionMatch && employmentYearMatch && genderMatch;
    });

    if (filters.value.searchTerm) {
      const teachersWithFio = teachersToFilter.map((teacher) => ({
        ...teacher,
        fio: getTeacherFullName(teacher).toLowerCase(),
      }));

      const fuse = new Fuse(teachersWithFio, {
        keys: ["surname", "firstName", "patronymic", "fio"],
        threshold: 0.3,
      });
      return fuse.search(filters.value.searchTerm).map((result) => result.item);
    }

    return teachersToFilter;
  });

  const setFilter = (key: keyof TeacherFilters, value: string) => {
    filters.value[key] = value;
  };

  const clearFilters = () => {
    filters.value = {
      position: "",
      employmentYear: "",
      gender: "",
      searchTerm: "",
    };
  };

  const addTeacher = async (payload: AddTeacherPayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      const newTeacher: Teacher = {
        id: crypto.randomUUID(),
        ...payload,
      };

      teachers.value.push(newTeacher);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add teacher";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const updateTeacher = async (id: string, payload: AddTeacherPayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      const index = teachers.value.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Teacher not found");

      teachers.value[index] = {
        ...teachers.value[index],
        ...payload,
      };
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to update teacher";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteTeacher = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      const index = teachers.value.findIndex((s) => s.id === id);
      if (index === -1) throw new Error("Teacher not found");

      teachers.value.splice(index, 1);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to delete teacher";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    teachers.value = [];
    isLoading.value = false;
    error.value = null;
    filters.value = {
      position: "",
      employmentYear: "",
      gender: "",
      searchTerm: "",
    };
  };

  const getError = computed(() => error.value);

  return {
    teachers,
    isLoading,
    filters,
    getAllTeachers,
    filteredTeachers,
    setFilter,
    clearFilters,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    clearError,
    reset,
    getError,
    getTeacherFullName,
  };
});
