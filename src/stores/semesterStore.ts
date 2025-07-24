import { defineStore } from "pinia";
import { ref, computed } from "vue";

export type PeriodType = "semester" | "vacation" | "session" | "academicYear";

export interface AcademicPeriod {
  id: string;
  type: PeriodType; 
  name: string; 
  startDate: string; 
  endDate: string; 
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_PERIODS: AcademicPeriod[] = [];

export const useSemesterStore = defineStore(
  "semester",
  () => {
    const periods = ref<AcademicPeriod[]>([...DEFAULT_PERIODS]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getPeriodById = computed(() => {
      return (id: string) => periods.value.find((p) => p.id === id);
    });

    const getPeriodsByType = computed(() => {
      return (type: PeriodType) => periods.value.filter((p) => p.type === type);
    });

    const sortedPeriods = computed(() => {
      return [...periods.value].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addPeriod(
      periodData: Omit<AcademicPeriod, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newPeriod: AcademicPeriod = {
          ...periodData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        periods.value.push(newPeriod);
        error.value = null;
        return newPeriod;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add period";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updatePeriod(
      id: string,
      periodData: Partial<
        Omit<AcademicPeriod, "id" | "createdAt" | "updatedAt">
      >
    ) {
      loading.value = true;
      try {
        const index = periods.value.findIndex((p) => p.id === id);
        if (index === -1) {
          throw new Error("Period not found");
        }

        const updatedPeriod = {
          ...periods.value[index],
          ...periodData,
          updatedAt: new Date(),
        };

        periods.value[index] = updatedPeriod;
        error.value = null;
        return updatedPeriod;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update period";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deletePeriod(id: string) {
      loading.value = true;
      try {
        periods.value = periods.value.filter((p) => p.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete period";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      periods.value = [...DEFAULT_PERIODS];
      loading.value = false;
      error.value = null;
    }

    return {
      periods,
      loading,
      error,
      getPeriodById,
      getPeriodsByType,
      sortedPeriods,
      isLoading,
      getError,
      addPeriod,
      updatePeriod,
      deletePeriod,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
