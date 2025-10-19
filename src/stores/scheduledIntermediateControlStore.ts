import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface ScheduledIntermediateControl {
  id: string;
  academicYearId: string;
  intermediateControlId: string;
  shortName: string;
  startDate: string;
  endDate: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SCHEDULED_INTERMEDIATE_CONTROLS: ScheduledIntermediateControl[] =
  [];

export const useScheduledIntermediateControlStore = defineStore(
  "scheduledIntermediateControl",
  () => {
    const scheduledIntermediateControls = ref<ScheduledIntermediateControl[]>([
      ...DEFAULT_SCHEDULED_INTERMEDIATE_CONTROLS,
    ]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getScheduledIntermediateControlById = computed(() => {
      return (id: string) =>
        scheduledIntermediateControls.value.find((c) => c.id === id);
    });

    const sortedScheduledIntermediateControls = computed(() => {
      return [...scheduledIntermediateControls.value].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
    });

    const getScheduledIntermediateControlsByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        scheduledIntermediateControls.value.filter(
          (c) => c.academicYearId === academicYearId
        );
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addScheduledIntermediateControl(
      controlData: Omit<
        ScheduledIntermediateControl,
        "id" | "createdAt" | "updatedAt"
      >
    ) {
      loading.value = true;
      try {
        const newControl: ScheduledIntermediateControl = {
          ...controlData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        scheduledIntermediateControls.value.push(newControl);
        error.value = null;
        return newControl;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to add scheduled intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateScheduledIntermediateControl(
      id: string,
      controlData: Partial<
        Omit<ScheduledIntermediateControl, "id" | "createdAt" | "updatedAt">
      >
    ) {
      loading.value = true;
      try {
        const index = scheduledIntermediateControls.value.findIndex(
          (c) => c.id === id
        );
        if (index === -1) {
          throw new Error("Scheduled intermediate control not found");
        }

        const updatedControl = {
          ...scheduledIntermediateControls.value[index],
          ...controlData,
          updatedAt: new Date(),
        };

        scheduledIntermediateControls.value[index] = updatedControl;
        error.value = null;
        return updatedControl;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to update scheduled intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteScheduledIntermediateControl(id: string) {
      loading.value = true;
      try {
        scheduledIntermediateControls.value =
          scheduledIntermediateControls.value.filter((c) => c.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to delete scheduled intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      scheduledIntermediateControls.value = [
        ...DEFAULT_SCHEDULED_INTERMEDIATE_CONTROLS,
      ];
      loading.value = false;
      error.value = null;
    }

    return {
      scheduledIntermediateControls,
      loading,
      error,
      getScheduledIntermediateControlById,
      sortedScheduledIntermediateControls,
      getScheduledIntermediateControlsByAcademicYear,
      isLoading,
      getError,
      addScheduledIntermediateControl,
      updateScheduledIntermediateControl,
      deleteScheduledIntermediateControl,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);


