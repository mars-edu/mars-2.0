import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Position {
  id: string;
  name: string;
}

export const usePositionStore = defineStore("position", () => {
  const positions = ref<Position[]>([
    { id: "1", name: "Преподаватель" },
    { id: "2", name: "Старший преподаватель" },
    { id: "3", name: "Доцент" },
    { id: "4", name: "Профессор" },
  ]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getAllPositions = computed(() => positions.value);

  return {
    positions,
    isLoading,
    error,
    getAllPositions,
  };
});
