import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { useAcademicYearStore } from "./academicYearStore";
import { convex, useConvexFeatures } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

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

    // Reactive subscription to Convex
    if (useConvexFeatures() && convex) {
      const { data: convexSemesters } = useConvexQuery(
        api.semesters.queries.list,
        ref({})
      );

      watch(convexSemesters, (newData) => {
        if (newData) {
          academicYearSemesters.value = newData.map((s) => ({
            id: s._id,
            academicYearId: s.academicYearId,
            semesterNumber: s.number || 1,
            startDate: s.startDate || "",
            endDate: s.endDate || "",
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }));
        }
      });
    }

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
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.semesters.mutations.create, {
            name: `Semester ${semesterData.semesterNumber}`,
            academicYearId: semesterData.academicYearId as any,
            number: semesterData.semesterNumber,
            startDate: semesterData.startDate,
            endDate: semesterData.endDate,
            isActive: true,
          });
          // Don't push to academicYearSemesters.value - the reactive subscription will handle it
          error.value = null;
          return;
        }

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
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.semesters.mutations.update, {
            id: id as any,
            name: semesterData.semesterNumber ? `Semester ${semesterData.semesterNumber}` : undefined,
            academicYearId: semesterData.academicYearId as any,
            number: semesterData.semesterNumber,
            startDate: semesterData.startDate,
            endDate: semesterData.endDate,
          });
          // Don't update academicYearSemesters.value - the reactive subscription will handle it
          error.value = null;
          return;
        }

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
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.semesters.mutations.remove, {
            id: id as any,
          });
          // Don't filter academicYearSemesters.value - the reactive subscription will handle it
          error.value = null;
          return;
        }
        // Fallback: local-only
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

    async function loadFromBackend() {
      if (!useConvexFeatures() || !convex) return;

      loading.value = true;
      try {
        const data = await convex.query(api.semesters.queries.list, {});
        academicYearSemesters.value = data
          .filter((s) => s.academicYearId) // Only those with academic year
          .map((s) => ({
            id: s._id,
            academicYearId: s.academicYearId as string,
            semesterNumber: s.number || 1,
            startDate: s.startDate || "",
            endDate: s.endDate || "",
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }));
        error.value = null;
      } catch (err) {
        console.error("[academicYearSemesterStore] Failed to load from Convex:", err);
        error.value = "Failed to load academic year semesters";
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
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
