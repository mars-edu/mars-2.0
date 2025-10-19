import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface IntermediateControl {
  id: string;
  name: string;
  shortName: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_INTERMEDIATE_CONTROLS: IntermediateControl[] = [];

export const useIntermediateControlStore = defineStore(
  "intermediateControl",
  () => {
    const intermediateControls = ref<IntermediateControl[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const sortIntermediateControls = () => {
      intermediateControls.value.sort((a, b) =>
        a.shortName.localeCompare(b.shortName, "ru")
      );
    };

    if (intermediateControls.value.length === 0) {
      intermediateControls.value = DEFAULT_INTERMEDIATE_CONTROLS;
    }
    sortIntermediateControls();

    const getIntermediateControlById = computed(() => {
      return (id: string) =>
        intermediateControls.value.find((c) => c.id === id);
    });

    const sortedIntermediateControls = computed(() => {
      return [...intermediateControls.value].sort((a, b) =>
        a.shortName.localeCompare(b.shortName, "ru")
      );
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addIntermediateControl(
      controlData: Omit<IntermediateControl, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newControl: IntermediateControl = {
          ...controlData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        intermediateControls.value.push(newControl);
        sortIntermediateControls();
        error.value = null;
        return newControl;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to add intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateIntermediateControl(
      id: string,
      controlData: Partial<
        Omit<IntermediateControl, "id" | "createdAt" | "updatedAt">
      >
    ) {
      loading.value = true;
      try {
        const index = intermediateControls.value.findIndex((c) => c.id === id);
        if (index === -1) {
          throw new Error("Intermediate control not found");
        }

        const updatedControl = {
          ...intermediateControls.value[index],
          ...controlData,
          updatedAt: new Date(),
        };

        intermediateControls.value[index] = updatedControl;
        sortIntermediateControls();
        error.value = null;
        return updatedControl;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to update intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteIntermediateControl(id: string) {
      loading.value = true;
      try {
        intermediateControls.value = intermediateControls.value.filter(
          (c) => c.id !== id
        );
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to delete intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      intermediateControls.value = [...DEFAULT_INTERMEDIATE_CONTROLS];
      loading.value = false;
      error.value = null;
      sortIntermediateControls();
    }

    return {
      intermediateControls,
      loading,
      error,
      getIntermediateControlById,
      sortedIntermediateControls,
      isLoading,
      getError,
      addIntermediateControl,
      updateIntermediateControl,
      deleteIntermediateControl,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
