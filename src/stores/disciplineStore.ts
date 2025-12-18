import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import type { Id } from "@convex/_generated/dataModel";

export interface Discipline {
  _id: Id<"disciplines">;
  _creationTime: number;
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
  createdAt: number;
  updatedAt: number;
  isHighlighted?: boolean;
}

export interface AddDisciplinePayload {
  moduleIndex: string;
  moduleName: string;
  learningOutcome: string;
}

export const useDisciplineStore = defineStore("discipline", () => {
  const disciplines = ref<Discipline[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Reactive subscription to Convex
  const { data: convexDisciplines } = useConvexQuery(
    api.disciplines.queries.list,
    ref({})
  );

  watch(convexDisciplines, (newData) => {
    if (newData) {
      disciplines.value = newData as Discipline[];
    }
  });

  const getAllDisciplines = computed(() => disciplines.value);

  const addDiscipline = async (payload: AddDisciplinePayload) => {
    try {
      isLoading.value = true;
      error.value = null;

      if (!convex) throw new Error("Convex client not initialized");
      await convex.mutation(api.disciplines.mutations.create, payload);
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

      if (!convex) throw new Error("Convex client not initialized");
      await convex.mutation(api.disciplines.mutations.update, {
        id: id as Id<"disciplines">,
        ...payload,
      });
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

      if (!convex) throw new Error("Convex client not initialized");
      await convex.mutation(api.disciplines.mutations.remove, {
        id: id as Id<"disciplines">,
      });
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

  const reset = () => {
    disciplines.value = [];
    isLoading.value = false;
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
    reset,
    getError,
  };
});
