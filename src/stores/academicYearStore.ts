import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { AcademicYear } from "@/types/academic-year";
import { DEFAULT_ACADEMIC_HOUR_MINUTES } from "@/types/academic-year";
import { useEducationTechnologyStore } from "@/stores/educationTechnologyStore";

const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [];

export const useAcademicYearStore = defineStore(
  "academicYear",
  () => {
    const academicYears = ref<AcademicYear[]>([...DEFAULT_ACADEMIC_YEARS]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const educationTechnologyStore = useEducationTechnologyStore();

    // Reactive subscription to Convex
    const { data: convexYears } = useConvexQuery(
      api.academicYears.queries.list,
      ref({})
    );

    // Recompute whenever either the years OR the technologies list changes —
    // technologies can arrive after years on first load, and we need the
    // resolved academicHourMinutes to update once they do.
    watch([convexYears, () => educationTechnologyStore.technologies], ([newData]) => {
      if (newData) {
        academicYears.value = newData.map((year) => {
          const tech = year.technologyId
            ? educationTechnologyStore.getById(year.technologyId)
            : undefined;
          return {
            id: year._id,
            name: year.name,
            startYear: year.startYear,
            endYear: year.endYear,
            isActive: year.isActive,
            // Per-year override wins, else fall back to the technology's
            // value, else the global KZ-standard default. This keeps
            // `resolveAcademicHourMinutes` in teacher-workload-calculator.ts
            // working unchanged — it still just reads year.academicHourMinutes.
            academicHourMinutes:
              year.academicHourMinutes ??
              tech?.academicHourMinutes ??
              DEFAULT_ACADEMIC_HOUR_MINUTES,
            technologyId: year.technologyId,
            startDate: year.startDate,
            endDate: year.endDate,
            createdAt: new Date(year.createdAt),
            updatedAt: new Date(year.updatedAt),
          };
        });
      }
    });

    const getAcademicYearById = computed(() => {
      return (id: string) => academicYears.value.find((ay) => ay.id === id);
    });

    const getActiveAcademicYear = computed(() => {
      return academicYears.value.find((ay) => ay.isActive) || null;
    });

    const getSortedAcademicYears = computed(() => {
      return [...academicYears.value].sort((a, b) => a.startYear - b.startYear);
    });

    const academicYearsAsNumbers = computed(() => {
      const years = new Set<number>();
      academicYears.value.forEach((year) => {
        years.add(year.startYear);
        years.add(year.endYear);
      });
      return Array.from(years).sort((a, b) => b - a);
    });

    const academicYearOptions = computed(() =>
      academicYears.value.map((year) => ({
        value: year.id,
        text: year.startYear.toString(),
      }))
    );

    async function addAcademicYear(
      academicYearData: Omit<AcademicYear, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                const id = await convex.mutation(api.academicYears.mutations.create, {
                  name: academicYearData.name,
                  startYear: academicYearData.startYear,
                  endYear: academicYearData.endYear,
                  isActive: academicYearData.isActive,
                  academicHourMinutes: academicYearData.academicHourMinutes,
                  technologyId: academicYearData.technologyId as any,
                  startDate: academicYearData.startDate,
                  endDate: academicYearData.endDate,
                });
                const newAcademicYear = await convex.query(api.academicYears.queries.getById, { id });
                if (newAcademicYear) {
                  const mappedYear: AcademicYear = {
                    id: newAcademicYear._id,
                    name: newAcademicYear.name,
                    startYear: newAcademicYear.startYear,
                    endYear: newAcademicYear.endYear,
                    isActive: newAcademicYear.isActive,
                    academicHourMinutes: newAcademicYear.academicHourMinutes,
                    technologyId: newAcademicYear.technologyId,
                    startDate: newAcademicYear.startDate,
                    endDate: newAcademicYear.endDate,
                    createdAt: new Date(newAcademicYear.createdAt),
                    updatedAt: new Date(newAcademicYear.updatedAt),
                  };
                  // Don't push to academicYears.value - the reactive subscription will handle it
                  error.value = null;
                  return mappedYear;
                }
        }, "Failed to add academic year");
    }

    async function updateAcademicYear(
      id: string,
      academicYearData: Partial<
        Omit<AcademicYear, "id" | "createdAt" | "updatedAt">
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                const updated = await convex.mutation(api.academicYears.mutations.update, {
                  id: id as any,
                  name: academicYearData.name,
                  startYear: academicYearData.startYear,
                  endYear: academicYearData.endYear,
                  isActive: academicYearData.isActive,
                  academicHourMinutes: academicYearData.academicHourMinutes,
                  technologyId: academicYearData.technologyId as any,
                  startDate: academicYearData.startDate,
                  endDate: academicYearData.endDate,
                });

                if (updated) {
                  const mappedYear: AcademicYear = {
                    id: updated._id,
                    name: updated.name,
                    startYear: updated.startYear,
                    endYear: updated.endYear,
                    isActive: updated.isActive,
                    academicHourMinutes: updated.academicHourMinutes,
                    technologyId: updated.technologyId,
                    startDate: updated.startDate,
                    endDate: updated.endDate,
                    createdAt: new Date(updated.createdAt),
                    updatedAt: new Date(updated.updatedAt),
                  };
                  // Don't update academicYears.value - the reactive subscription will handle it
                  error.value = null;
                  return mappedYear;
                }
        }, "Failed to update academic year");
    }

    async function deleteAcademicYear(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.academicYears.mutations.remove, {
                  id: id as any,
                });
                // Don't filter academicYears.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete academic year");
    }

    async function setActiveAcademicYear(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex
                await convex.mutation(api.academicYears.mutations.setActive, {
                  id: id as any,
                });
                // Refresh data from backend
                await loadFromBackend();
                error.value = null;
        }, "Failed to set active academic year");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.academicYears.queries.list, {});
                academicYears.value = data.map((year) => ({
                  id: year._id,
                  name: year.name,
                  startYear: year.startYear,
                  endYear: year.endYear,
                  isActive: year.isActive,
                  academicHourMinutes: year.academicHourMinutes,
                  technologyId: year.technologyId,
                  startDate: year.startDate,
                  endDate: year.endDate,
                  createdAt: new Date(year.createdAt),
                  updatedAt: new Date(year.updatedAt),
                }));
                error.value = null;
        }, "Operation failed");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      academicYears.value = [...DEFAULT_ACADEMIC_YEARS];
      loading.value = false;
      error.value = null;
    }

    return {
      academicYears,
      loading,
      error,
      getAcademicYearById,
      getActiveAcademicYear,
      getSortedAcademicYears,
      academicYearsAsNumbers,
      academicYearOptions,
      addAcademicYear,
      updateAcademicYear,
      deleteAcademicYear,
      setActiveAcademicYear,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
