import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Discipline {
  id: string;
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  linkWithRup: boolean;
  linkWithT: boolean;
  isHighlighted?: boolean;
}

export interface AddDisciplinePayload {
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  linkWithRup: boolean;
  linkWithT: boolean;
}

export const useDisciplineStore = defineStore("discipline", () => {
  const disciplines = ref<Discipline[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getAllDisciplines = computed(() => disciplines.value);

  const addDiscipline = async (payload: AddDisciplinePayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      // TODO: Replace with actual API call
      const newDiscipline: Discipline = {
        id: crypto.randomUUID(),
        ...payload,
      };

      disciplines.value.push(newDiscipline);
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Failed to add discipline";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const updateDiscipline = async (
    id: string,
    payload: AddDisciplinePayload
  ) => {
    try {
      isLoading.value = true;
      error.value = null;

      // TODO: Replace with actual API call
      const index = disciplines.value.findIndex((d) => d.id === id);
      if (index === -1) throw new Error("Discipline not found");

      disciplines.value[index] = {
        ...disciplines.value[index],
        ...payload,
      };
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to update discipline";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteDiscipline = async (id: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      // TODO: Replace with actual API call
      const index = disciplines.value.findIndex((d) => d.id === id);
      if (index === -1) throw new Error("Discipline not found");

      disciplines.value.splice(index, 1);
    } catch (e) {
      error.value =
        e instanceof Error ? e.message : "Failed to delete discipline";
      throw e;
    } finally {
      isLoading.value = false;
    }
  };

  const clearError = () => {
    error.value = null;
  };

  const getError = computed(() => error.value);

  return {
    disciplines,
    isLoading,
    getAllDisciplines,
    addDiscipline,
    updateDiscipline,
    deleteDiscipline,
    clearError,
    getError,
  };
});
