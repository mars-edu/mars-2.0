import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { useAcademicYearStore } from "./academicYearStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface AcademicYearSemester {
  id: string;
  academicYearId: string;
  semesterDefinitionId: string;
  semesterNumber: number; // Derived from semesterDefinition
  semesterName: string; // Derived from semesterDefinition
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
    const { data: convexSemesters } = useConvexQuery(
      api.academicYearSemesters.queries.list,
      ref({})
    );

    watch(convexSemesters, (newData) => {
      if (newData) {
        academicYearSemesters.value = newData.map((s) => ({
          id: s._id,
          academicYearId: s.academicYearId,
          semesterDefinitionId: s.semesterDefinitionId,
          semesterNumber: s.semesterDefinition?.number || 1,
          semesterName: s.semesterDefinition?.shortName || "",
          startDate: s.startDate,
          endDate: s.endDate,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
      }
    });

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

    async function addAcademicYearSemester(semesterData: {
      academicYearId: string;
      semesterDefinitionId: string;
      startDate: string;
      endDate: string;
    }) {
      loading.value = true;
      try {
        // Validate that dates are not empty
        if (!semesterData.startDate || !semesterData.endDate) {
          error.value = "Даты начала и окончания семестра обязательны";
          throw new Error(error.value);
        }

        // Validate that dates are valid
        const startDate = new Date(semesterData.startDate);
        const endDate = new Date(semesterData.endDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          error.value = "Указаны некорректные даты";
          throw new Error(error.value);
        }

        if (endDate <= startDate) {
          error.value = "Дата окончания должна быть позже даты начала";
          throw new Error(error.value);
        }

        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.academicYearSemesters.mutations.create, {
          academicYearId: semesterData.academicYearId as any,
          semesterDefinitionId: semesterData.semesterDefinitionId as any,
          startDate: semesterData.startDate,
          endDate: semesterData.endDate,
        });
        // Don't push to academicYearSemesters.value - the reactive subscription will handle it
        error.value = null;
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
      semesterData: {
        semesterDefinitionId?: string;
        startDate?: string;
        endDate?: string;
      }
    ) {
      loading.value = true;
      try {
        // Validate dates if they're being updated
        if (semesterData.startDate !== undefined || semesterData.endDate !== undefined) {
          // If either date is being updated, validate both
          if (semesterData.startDate !== undefined && !semesterData.startDate) {
            error.value = "Дата начала семестра обязательна";
            throw new Error(error.value);
          }

          if (semesterData.endDate !== undefined && !semesterData.endDate) {
            error.value = "Дата окончания семестра обязательна";
            throw new Error(error.value);
          }

          // Validate date values if provided
          if (semesterData.startDate) {
            const startDate = new Date(semesterData.startDate);
            if (isNaN(startDate.getTime())) {
              error.value = "Дата начала указана некорректно";
              throw new Error(error.value);
            }
          }

          if (semesterData.endDate) {
            const endDate = new Date(semesterData.endDate);
            if (isNaN(endDate.getTime())) {
              error.value = "Дата окончания указана некорректно";
              throw new Error(error.value);
            }
          }

          // Validate date order if both are provided
          if (semesterData.startDate && semesterData.endDate) {
            const startDate = new Date(semesterData.startDate);
            const endDate = new Date(semesterData.endDate);
            if (endDate <= startDate) {
              error.value = "Дата окончания должна быть позже даты начала";
              throw new Error(error.value);
            }
          }
        }

        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.academicYearSemesters.mutations.update, {
          id: id as any,
          semesterDefinitionId: semesterData.semesterDefinitionId as any,
          startDate: semesterData.startDate,
          endDate: semesterData.endDate,
        });
        // Don't update academicYearSemesters.value - the reactive subscription will handle it
        error.value = null;
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
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.academicYearSemesters.mutations.remove, {
          id: id as any,
        });
        // Don't filter academicYearSemesters.value - the reactive subscription will handle it
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
