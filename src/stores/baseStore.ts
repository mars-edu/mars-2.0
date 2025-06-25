import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Base {
  id: string;
  value: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_BASES: Base[] = [
  {
    id: "1",
    value: "9",
    text: "9",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    value: "11",
    text: "11",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export const useBaseStore = defineStore(
  "base",
  () => {
    const bases = ref<Base[]>(DEFAULT_BASES);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getBaseById = computed(() => {
      return (id: string) => bases.value.find((b) => b.id === id);
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function fetchBases() {
      loading.value = true;
      try {
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load bases";
      } finally {
        loading.value = false;
      }
    }

    async function addBase(
      baseData: Omit<Base, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newBase: Base = {
          ...baseData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        bases.value.push(newBase);
        error.value = null;
        return newBase;
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to add base";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateBase(
      id: string,
      baseData: Partial<Omit<Base, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        const index = bases.value.findIndex((b) => b.id === id);
        if (index === -1) {
          throw new Error("Base not found");
        }

        const updatedBase = {
          ...bases.value[index],
          ...baseData,
          updatedAt: new Date(),
        };

        bases.value[index] = updatedBase;
        error.value = null;
        return updatedBase;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update base";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteBase(id: string) {
      loading.value = true;
      try {
        bases.value = bases.value.filter((b) => b.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete base";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      bases.value = [...DEFAULT_BASES];
      loading.value = false;
      error.value = null;
    }

    return {
      bases,
      loading,
      error,
      getBaseById,
      isLoading,
      getError,
      fetchBases,
      addBase,
      updateBase,
      deleteBase,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
