import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Semester {
  id: string;
  shortName: string;
  fullName: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SEMESTERS: Semester[] = [];

export const useSemesterStore = defineStore(
  "semester",
  () => {
    const semesters = ref<Semester[]>([...DEFAULT_SEMESTERS]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getSemesterById = computed(() => {
      return (id: string) => semesters.value.find((s) => s.id === id);
    });

    const sortedSemesters = computed(() => {
      return [...semesters.value].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
    });

    const getSemestersByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        semesters.value.filter((s) => s.academicYearId === academicYearId);
    });

    const getActiveSemester = computed(() => {
      const today = new Date().toISOString().split("T")[0]; // Get current date in YYYY-MM-DD format

      return (
        semesters.value.find((semester) => {
          return semester.startDate <= today && semester.endDate >= today;
        }) || null
      );
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addSemester(
      semesterData: Omit<Semester, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newSemester: Semester = {
          ...semesterData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        semesters.value.push(newSemester);
        error.value = null;
        return newSemester;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateSemester(
      id: string,
      semesterData: Partial<Omit<Semester, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        const index = semesters.value.findIndex((s) => s.id === id);
        if (index === -1) {
          throw new Error("Semester not found");
        }

        const updatedSemester = {
          ...semesters.value[index],
          ...semesterData,
          updatedAt: new Date(),
        };

        semesters.value[index] = updatedSemester;
        error.value = null;
        return updatedSemester;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteSemester(id: string) {
      loading.value = true;
      try {
        semesters.value = semesters.value.filter((s) => s.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      semesters.value = [...DEFAULT_SEMESTERS];
      loading.value = false;
      error.value = null;
    }

    // Remove migration-related logic
    return {
      semesters,
      loading,
      error,
      getSemesterById,
      sortedSemesters,
      getSemestersByAcademicYear,
      getActiveSemester,
      isLoading,
      getError,
      addSemester,
      updateSemester,
      deleteSemester,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
