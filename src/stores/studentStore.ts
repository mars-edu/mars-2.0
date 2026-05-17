import { defineStore, storeToRefs } from "pinia";
import { ref, computed, watch } from "vue";
import { useAcademicYearStore } from "./academicYearStore";
import { useCourseStore, type Course } from "./courseStore";
import { useSpecialtyStore } from "./specialtyStore";
import type {
  Student,
  StudentWithCourse,
  AddStudentPayload,
  StudentFilters,
} from "@/types/student";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export type { Student } from "@/types/student";

interface PaginatedStudentsResponse {
  items: any[];
  totalCount: number;
}

export const useStudentStore = defineStore("student", () => {
  const students = ref<Student[]>([]);
  const pageSize = ref(20);
  const currentPage = ref(1);
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
  const specialtyStore = useSpecialtyStore();
  const { specialties } = storeToRefs(specialtyStore);

  // Reactive arguments for paginated query
  const paginatedArgs = computed(() => {
    const activeStartYear = academicYearStore.getActiveAcademicYear?.startYear;

    const selectedSpecialtyRecord = filters.value.specialty
      ? specialtyStore.getSpecialtyById(filters.value.specialty)
      : undefined;
    const specialtyLegacyId =
      selectedSpecialtyRecord?.legacyId &&
      selectedSpecialtyRecord.legacyId !== filters.value.specialty
        ? selectedSpecialtyRecord.legacyId
        : undefined;

    return {
      page: currentPage.value,
      pageSize: pageSize.value,
      specialty: filters.value.specialty || undefined,
      specialtyLegacyId,
      language: filters.value.language || undefined,
      gender: filters.value.gender || undefined,
      base: filters.value.base ? Number(filters.value.base) : undefined,
      academicYearId: filters.value.academicYearId || undefined,
      searchTerm: filters.value.searchTerm || undefined,
      course: filters.value.course ? Number(filters.value.course) : undefined,
      activeStartYear: activeStartYear ?? 0,
    };
  });

  // Reactive paginated query
  const paginatedResult = useConvexQuery(
    api.students.queries.listPaginated,
    paginatedArgs
  );

  const paginatedData = computed(() => paginatedResult.data.value as PaginatedStudentsResponse | undefined);
  const isPaginatedLoading = computed(() => paginatedResult.isPending.value);

  // Full list for lookups
  const { data: convexStudents } = useConvexQuery(
    api.students.queries.list,
    ref({})
  );

  const buildSpecialtyMap = () => {
    const specialtyMap = new Map<string, string>();
    specialties.value.forEach((specialty) => {
      specialtyMap.set(specialty.id, specialty.id);
      if (specialty.legacyId) {
        specialtyMap.set(specialty.legacyId, specialty.id);
      }
    });
    return specialtyMap;
  };

  const normalizeStudent = (student: {
    _id: string;
    firstName: string;
    surname: string;
    patronymic: string;
    specialty: string;
    language: string;
    gender: "male" | "female";
    base?: number;
    academicYearId?: string;
    status?: any;
    history?: any[];
  }) => {
    const specialtyMap = buildSpecialtyMap();
    return {
      id: student._id,
      firstName: student.firstName,
      surname: student.surname,
      patronymic: student.patronymic,
      specialty: specialtyMap.get(student.specialty) ?? student.specialty,
      language: student.language,
      gender: student.gender,
      base: student.base,
      academicYearId: student.academicYearId,
      status: student.status || "active",
      history: student.history || [],
    };
  };

  watch([convexStudents, specialties], ([newData]) => {
    if (newData) {
      students.value = newData.map(normalizeStudent);
    }
  });

  const getAllStudents = computed(() => students.value);

  // O(1) lookup index — rebuilt only when students reactively change.
  const studentsById = computed(() => {
    const map = new Map<string, (typeof students.value)[number]>();
    for (const s of students.value) map.set(s.id, s);
    return map;
  });

  const paginatedFilteredStudents = computed((): StudentWithCourse[] => {
    if (!paginatedData.value) return [];

    const activeAcademicYear = academicYearStore.getActiveAcademicYear;

    return paginatedData.value.items.map((student: any) => {
      const normalized = normalizeStudent(student);
      const studentAcademicYear = academicYearStore.getAcademicYearById(
        normalized.academicYearId || ""
      );

      let course = 0;
      if (activeAcademicYear && studentAcademicYear) {
        const diff =
          activeAcademicYear.startYear - studentAcademicYear.startYear + 1;
        course = Math.max(0, diff);
      }

      return {
        ...normalized,
        course,
      };
    });
  });

  const totalItemsCount = computed(() => paginatedData.value?.totalCount || 0);
  const totalPages = computed(() => Math.ceil(totalItemsCount.value / pageSize.value) || 1);

  const filteredStudents = computed((): { length: number } => {
    // Return an object with length for compatibility with the Pagination component's props
    return { length: totalItemsCount.value };
  });

  const setFilter = (key: keyof StudentFilters, value: string) => {
    filters.value[key] = value;
    currentPage.value = 1; // Reset to first page on filter change
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
    currentPage.value = 1;
  };

  const addStudent = async (payload: AddStudentPayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      // Use Convex - reactive subscription will automatically update the list
      await convex.mutation(api.students.mutations.create, {
        firstName: payload.firstName,
        surname: payload.surname,
        patronymic: payload.patronymic,
        specialty: payload.specialty,
        language: payload.language,
        gender: payload.gender,
        base: payload.base,
        academicYearId: payload.academicYearId,
        status: payload.status,
        history: payload.history,
      });
      // No need to manually push - the watch on convexStudents handles it
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

      // Use Convex - reactive subscription will automatically update the list
      await convex.mutation(api.students.mutations.update, {
        id: id as any,
        firstName: payload.firstName,
        surname: payload.surname,
        patronymic: payload.patronymic,
        specialty: payload.specialty,
        language: payload.language,
        gender: payload.gender as any,
        base: payload.base,
        academicYearId: payload.academicYearId,
        status: payload.status,
        history: payload.history,
      });
      // No need to manually update - the watch on convexStudents handles it
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

      // Use Convex - the reactive subscription will handle updating the local state
      await convex.mutation(api.students.mutations.remove, {
        id: id as any,
      });
      // Don't filter students.value - the reactive subscription will handle it
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to delete student";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const loadFromBackend = async () => {
    isLoading.value = true;
    try {
      const data = await convex.query(api.students.queries.list, {});
      students.value = data.map(normalizeStudent);
      error.value = null;
    } catch (err) {
      console.error("[studentStore] Failed to load from Convex:", err);
      error.value = "Failed to load students";
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const reset = () => {
    students.value = [];
    currentPage.value = 1;
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

  const getCourseByStudentId = (id: string): number | null => {
    const student = studentsById.value.get(id);
    if (!student) return null;

    const activeAcademicYear = academicYearStore.getActiveAcademicYear;
    const studentAcademicYear = academicYearStore.getAcademicYearById(
      student.academicYearId || ""
    );

    if (activeAcademicYear && studentAcademicYear) {
      const diff =
        activeAcademicYear.startYear - studentAcademicYear.startYear + 1;
      return Math.max(0, diff);
    }

    return null;
  };

  const getStudentFullName = (idOrName: string): string => {
    const student = studentsById.value.get(idOrName);
    if (!student) return idOrName;
    return `${student.surname} ${student.firstName} ${student.patronymic}`;
  };

  const getStudentById = (id: string): Student | undefined => {
    return studentsById.value.get(id);
  };

  return {
    students,
    pageSize,
    currentPage,
    totalPages,
    isLoading,
    isPaginatedLoading,
    filters,
    getAllStudents,
    filteredStudents,
    paginatedFilteredStudents,
    setFilter,
    clearFilters,
    addStudent,
    updateStudent,
    deleteStudent,
    clearError,
    reset,
    getError,
    getCourseByStudentId,
    getStudentFullName,
    getStudentById,
    loadFromBackend,
  };
}, {
  persist: true,
});
