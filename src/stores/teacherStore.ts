import type { Id } from "@convex/_generated/dataModel";
import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import type { Teacher, AddTeacherPayload, TeacherFilters } from "@/types/teacher";

interface PaginatedTeachersResponse {
  items: Teacher[];
  totalCount: number;
}

export const useTeacherStore = defineStore("teacher", () => {
  const teachers = ref<Teacher[]>([]);
  const pageSize = ref(20);
  const currentPage = ref(1);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const filters = ref<TeacherFilters>({
    position: "",
    employmentYear: "",
    gender: "",
    searchTerm: "",
  });

  // Reactive arguments for paginated query
  const paginatedArgs = computed(() => {
    // Basic skip logic if needed, for now teachers query doesn't depend on other stores as much
    return {
      page: currentPage.value,
      pageSize: pageSize.value,
      position: filters.value.position || undefined,
      employmentYear: filters.value.employmentYear ? Number(filters.value.employmentYear) : undefined,
      gender: filters.value.gender || undefined,
      searchTerm: filters.value.searchTerm || undefined,
    };
  });

  // Reactive paginated query
  const paginatedResult = useConvexQuery(
    api.teachers.queries.listPaginated,
    paginatedArgs
  );

  const paginatedData = computed(() => paginatedResult.data.value as PaginatedTeachersResponse | undefined);
  const isPaginatedLoading = computed(() => paginatedResult.isPending.value);

  const paginatedFilteredTeachers = computed(() => {
    return paginatedData.value?.items || [];
  });

  const totalItemsCount = computed(() => paginatedData.value?.totalCount || 0);
  const totalPages = computed(() => Math.ceil(totalItemsCount.value / pageSize.value) || 1);

  // Full list for lookups
  const { data: convexTeachers } = useConvexQuery(
    api.teachers.queries.list,
    ref({})
  );

  watch(convexTeachers, (newData) => {
    if (newData) {
      teachers.value = newData.map((teacher) => ({
        id: teacher._id,
        userId: teacher.userId,
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
    if (!teacher) return "";
    return `${teacher.surname} ${teacher.firstName} ${teacher.patronymic}`;
  };

  const _teacherById = computed(() => {
    const m = new Map<string, Teacher>();
    for (const t of teachers.value) m.set(t.id, t);
    return m;
  });
  const _teacherByUserId = computed(() => {
    const m = new Map<string, Teacher>();
    for (const t of teachers.value) if (t.userId) m.set(t.userId, t);
    return m;
  });

  const getTeacherById = (id: string): Teacher | undefined => {
    return _teacherById.value.get(id);
  };

  const getTeacherByUserId = (userId: string): Teacher | undefined => {
    return _teacherByUserId.value.get(userId);
  };

  const getTeacherFullNameByUserId = (userId: string): string => {
    const teacher = getTeacherByUserId(userId);
    return teacher ? getTeacherFullName(teacher) : "";
  };

  const filteredTeachers = computed((): { length: number } => {
    // Return an object with length for compatibility
    return { length: totalItemsCount.value };
  });

  const setFilter = (key: keyof TeacherFilters, value: string) => {
    filters.value[key] = value;
    currentPage.value = 1;
  };

  const clearFilters = () => {
    filters.value = {
      position: "",
      employmentYear: "",
      gender: "",
      searchTerm: "",
    };
    currentPage.value = 1;
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
        userId: result.userId,
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
        id: id as Id<"teachers">,
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
        id: id as Id<"teachers">,
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
        userId: teacher.userId,
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
    currentPage.value = 1;
    isLoading.value = false;
    error.value = null;
    filters.value = {
      position: "",
      employmentYear: "",
      gender: "",
      searchTerm: "",
    };
  };
  return {
    teachers,
    pageSize,
    currentPage,
    totalPages,
    isPaginatedLoading,
    filters,
    getAllTeachers,
    teacherSelectOptions,
    filteredTeachers,
    paginatedFilteredTeachers,
    setFilter,
    clearFilters,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    clearError,
    reset,
    getTeacherFullName,
    getTeacherById,
    getTeacherByUserId,
    getTeacherFullNameByUserId,
    loadFromBackend,
  };
});
