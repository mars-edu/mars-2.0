import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Specialty {
  id: string;
  name: string;
  codeName: string;
  code: string;
  hasModule: boolean;
  createdAt: Date;
  updatedAt: Date;
  details: string;
  isHighlighted?: boolean;
}

export interface AddSpecialtyPayload {
  code: string;
  name: string;
  details: string;
  codeName: string;
}

export const useSpecialtyStore = defineStore(
  "specialty",
  () => {
    const specialties = ref<Specialty[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getSpecialtyById = computed(() => {
      return (id: string) => specialties.value.find((s) => s.id === id);
    });

    const getSpecialtyByCode = computed(() => {
      return (code: string) => specialties.value.find((s) => s.code === code);
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function fetchSpecialties() {
      loading.value = true;
      try {
        // Data will be automatically loaded by Pinia persistence
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load specialties";
      } finally {
        loading.value = false;
      }
    }

    const addSpecialty = async (payload: AddSpecialtyPayload) => {
      try {
        loading.value = true;
        error.value = null;

        // TODO: Replace with actual API call
        const newSpecialty: Specialty = {
          id: crypto.randomUUID(),
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
          hasModule: false,
        };

        specialties.value.push(newSpecialty);
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to add specialty";
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const updateSpecialty = async (
      id: string,
      payload: AddSpecialtyPayload
    ) => {
      try {
        loading.value = true;
        error.value = null;

        // TODO: Replace with actual API call
        const index = specialties.value.findIndex((s) => s.id === id);
        if (index === -1) throw new Error("Specialty not found");

        specialties.value[index] = {
          ...specialties.value[index],
          ...payload,
          updatedAt: new Date(),
        };
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to update specialty";
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const deleteSpecialty = async (id: string) => {
      try {
        loading.value = true;
        error.value = null;

        // TODO: Replace with actual API call
        const index = specialties.value.findIndex((s) => s.id === id);
        if (index === -1) throw new Error("Specialty not found");

        specialties.value.splice(index, 1);
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to delete specialty";
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const clearError = () => {
      error.value = null;
    };

    return {
      specialties,
      loading,
      error,
      getSpecialtyById,
      getSpecialtyByCode,
      isLoading,
      getError,
      fetchSpecialties,
      addSpecialty,
      updateSpecialty,
      deleteSpecialty,
      clearError,
    };
  },
  {
    persist: true,
  }
);
