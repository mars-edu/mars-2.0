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

    const getAllSpecialties = computed(() => specialties.value);
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

    async function addSpecialty(
      specialtyData: Omit<Specialty, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newSpecialty: Specialty = {
          ...specialtyData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        specialties.value.push(newSpecialty);
        error.value = null;
        return newSpecialty;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add specialty";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateSpecialty(
      id: string,
      specialtyData: Partial<Omit<Specialty, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        const index = specialties.value.findIndex((s) => s.id === id);
        if (index === -1) {
          throw new Error("Specialty not found");
        }

        const updatedSpecialty = {
          ...specialties.value[index],
          ...specialtyData,
          updatedAt: new Date(),
        };

        specialties.value[index] = updatedSpecialty;
        error.value = null;
        return updatedSpecialty;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update specialty";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteSpecialty(id: string) {
      loading.value = true;
      try {
        specialties.value = specialties.value.filter((s) => s.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete specialty";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    return {
      specialties,
      loading,
      error,
      getSpecialtyById,
      getSpecialtyByCode,
      getAllSpecialties,
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
