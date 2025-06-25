import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Position {
  id: string;
  name: string;
}

const DEFAULT_POSITIONS: Position[] = [
  { id: "1", name: "Преподаватель" },
  { id: "2", name: "Старший преподаватель" },
  { id: "3", name: "Доцент" },
  { id: "4", name: "Профессор" },
];

export const usePositionStore = defineStore("position", () => {
  const positions = ref<Position[]>([...DEFAULT_POSITIONS]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const getAllPositions = computed(() => positions.value);

  const reset = () => {
    positions.value = [...DEFAULT_POSITIONS];
    isLoading.value = false;
    error.value = null;
  };

  return {
    positions,
    isLoading,
    error,
    getAllPositions,
    reset,
  };
});
