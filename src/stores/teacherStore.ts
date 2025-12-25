import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import Fuse from "fuse.js";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Teacher {
  id: string;
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

  // Reactive subscription to Convex
  const { data: convexTeachers } = useConvexQuery(
    api.teachers.queries.list,
    ref({})
  );

  watch(convexTeachers, (newData) => {
    if (newData) {
      teachers.value = newData.map((teacher) => ({
        id: teacher._id,
        firstName: teacher.firstName,
        surname: teacher.surname,
        patronymic: teacher.patronymic,
        position: teacher.position,
        employmentYear: teacher.employmentYear,
        gender: teacher.gender,
        email: teacher.email,
        username: teacher.username,
      }));
    }
  });

  const getAllTeachers = computed(() => teachers.value);

  const teacherSelectOptions = computed(() => {
    return teachers.value.map((teacher) => ({
      value: teacher.id,
      text: getTeacherFullName(teacher),
    }));
  });

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

  const getTeacherById = (id: string): Teacher | undefined => {
    return teachers.value.find((t) => t.id === id);
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

      // Use Convex - reactive subscription will automatically update the list
      const result = await convex.action(api.auth.mutations.registerTeacher, {
        firstName: payload.firstName,
        lastName: payload.surname,
        middleName: payload.patronymic,
        position: payload.position,
        gender: payload.gender,
        employmentYear: payload.employmentYear,
      });
      // No need to manually push - the watch on convexTeachers handles it
      // Return the credentials for display
      return {
        id: result.teacherId,
        surname: payload.surname,
        firstName: payload.firstName,
        patronymic: payload.patronymic,
        position: payload.position,
        employmentYear: payload.employmentYear,
        gender: payload.gender,
        email: result.email,
        password: result.password,
        username: result.username,
      };
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

      // Use Convex - reactive subscription will automatically update the list
      await convex.mutation(api.teachers.mutations.update, {
        id: id as any,
        firstName: payload.firstName,
        surname: payload.surname,
        patronymic: payload.patronymic,
        position: payload.position,
        employmentYear: payload.employmentYear,
        gender: payload.gender,
        email: payload.email,
      });
      // No need to manually update - the watch on convexTeachers handles it
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

      // Use Convex - the reactive subscription will handle updating the local state
      await convex.mutation(api.teachers.mutations.remove, {
        id: id as any,
      });
      // Don't filter teachers.value - the reactive subscription will handle it
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to delete teacher";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const loadFromBackend = async () => {
    isLoading.value = true;
    try {
      const data = await convex.query(api.teachers.queries.list, {});
      teachers.value = data.map((teacher) => ({
        id: teacher._id,
        firstName: teacher.firstName,
        surname: teacher.surname,
        patronymic: teacher.patronymic,
        position: teacher.position,
        employmentYear: teacher.employmentYear,
        gender: teacher.gender,
        email: teacher.email,
        username: teacher.username,
      }));
      error.value = null;
    } catch (err) {
      console.error("[teacherStore] Failed to load from Convex:", err);
      error.value = "Failed to load teachers";
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
    teacherSelectOptions,
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
    getTeacherById,
    loadFromBackend,
  };
});
