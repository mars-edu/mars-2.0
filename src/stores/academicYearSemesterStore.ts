import { defineStore } from "pinia";
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { useAcademicYearStore } from "./academicYearStore";

export interface AcademicYearSemester {
  id: string;
  academicYearId: string;
  semesterNumber: number;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_ACADEMIC_YEAR_SEMESTERS: AcademicYearSemester[] = [];

export const useAcademicYearSemesterStore = defineStore(
  "academicYearSemester",
  () => {
    const academicYearSemesters = ref<AcademicYearSemester[]>([
      ...DEFAULT_ACADEMIC_YEAR_SEMESTERS,
    ]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getAcademicYearSemesterById = computed(() => {
      return (id: string) =>
        academicYearSemesters.value.find((s) => s.id === id);
    });

    const getAcademicYearSemestersByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        academicYearSemesters.value.filter(
          (s) => s.academicYearId === academicYearId
        );
    });

    const getActiveAcademicYearSemester = computed(() => {
      const academicYearStore = useAcademicYearStore();
      const activeAcademicYear = academicYearStore.getActiveAcademicYear;

      if (!activeAcademicYear) {
        return null;
      }

      return (
        academicYearSemesters.value.find((semester) => {
          return semester.academicYearId === activeAcademicYear.id;
        }) || null
      );
    });

    const isSemesterActive = (semester: AcademicYearSemester) => {
      const today = new Date();
      const startDate = new Date(semester.startDate);
      const endDate = new Date(semester.endDate);

      return today >= startDate && today <= endDate;
    };

    const getActiveAcademicYearSemesters = computed(() => {
      const academicYearStore = useAcademicYearStore();
      const activeAcademicYear = academicYearStore.getActiveAcademicYear;

      if (!activeAcademicYear) {
        return [];
      }

      return academicYearSemesters.value.filter((semester) => {
        return semester.academicYearId === activeAcademicYear.id;
      });
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addAcademicYearSemester(
      semesterData: Omit<AcademicYearSemester, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newSemester: AcademicYearSemester = {
          ...semesterData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        academicYearSemesters.value.push(newSemester);
        error.value = null;
        return newSemester;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to add academic year semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateAcademicYearSemester(
      id: string,
      semesterData: Partial<
        Omit<AcademicYearSemester, "id" | "createdAt" | "updatedAt">
      >
    ) {
      loading.value = true;
      try {
        const index = academicYearSemesters.value.findIndex((s) => s.id === id);
        if (index === -1) {
          throw new Error("Academic year semester not found");
        }

        const updatedSemester = {
          ...academicYearSemesters.value[index],
          ...semesterData,
          updatedAt: new Date(),
        };

        academicYearSemesters.value[index] = updatedSemester;
        error.value = null;
        return updatedSemester;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to update academic year semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteAcademicYearSemester(id: string) {
      loading.value = true;
      try {
        academicYearSemesters.value = academicYearSemesters.value.filter(
          (s) => s.id !== id
        );
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to delete academic year semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      academicYearSemesters.value = [...DEFAULT_ACADEMIC_YEAR_SEMESTERS];
      loading.value = false;
      error.value = null;
    }

    return {
      academicYearSemesters,
      loading,
      error,
      getAcademicYearSemesterById,
      getAcademicYearSemestersByAcademicYear,
      getActiveAcademicYearSemester,
      getActiveAcademicYearSemesters,
      isSemesterActive,
      isLoading,
      getError,
      addAcademicYearSemester,
      updateAcademicYearSemester,
      deleteAcademicYearSemester,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
