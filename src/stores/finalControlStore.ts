import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface FinalControl {
  id: string;
  name: string;
  shortName: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_FINAL_CONTROLS: FinalControl[] = [];

export const useFinalControlStore = defineStore(
  "finalControl",
  () => {
    const finalControls = ref<FinalControl[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const sortFinalControls = () => {
      finalControls.value.sort((a, b) =>
        a.shortName.localeCompare(b.shortName, "ru")
      );
    };

    if (finalControls.value.length === 0) {
      finalControls.value = DEFAULT_FINAL_CONTROLS;
    }
    sortFinalControls();

    const getFinalControlById = computed(() => {
      return (id: string) => finalControls.value.find((c) => c.id === id);
    });

    const sortedFinalControls = computed(() => {
      return [...finalControls.value].sort((a, b) =>
        a.shortName.localeCompare(b.shortName, "ru")
      );
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addFinalControl(
      controlData: Omit<FinalControl, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newControl: FinalControl = {
          ...controlData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        finalControls.value.push(newControl);
        sortFinalControls();
        error.value = null;
        return newControl;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add final control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateFinalControl(
      id: string,
      controlData: Partial<Omit<FinalControl, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        const index = finalControls.value.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error("Final control not found");
        }

        const updatedControl = {
          ...finalControls.value[index],
          ...controlData,
          updatedAt: new Date(),
        };

        finalControls.value[index] = updatedControl;
        sortFinalControls();
        error.value = null;
        return updatedControl;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update final control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteFinalControl(id: string) {
      loading.value = true;
      try {
        finalControls.value = finalControls.value.filter((c) => c.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete final control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      finalControls.value = [...DEFAULT_FINAL_CONTROLS];
      loading.value = false;
      error.value = null;
      sortFinalControls();
    }

    return {
      finalControls,
      loading,
      error,
      getFinalControlById,
      sortedFinalControls,
      isLoading,
      getError,
      addFinalControl,
      updateFinalControl,
      deleteFinalControl,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
