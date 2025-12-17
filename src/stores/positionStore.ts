import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex, useConvexFeatures } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

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

  // Reactive subscription to Convex
  if (useConvexFeatures() && convex) {
    const { data: convexPositions } = useConvexQuery(
      api.positions.queries.list,
      ref({})
    );

    watch(convexPositions, (newData) => {
      if (newData) {
        positions.value = newData.map((p) => ({
          id: p._id,
          name: p.name,
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
        }));
      }
    });
  }

  const getAllPositions = computed(() => positions.value);
  const getError = computed(() => error.value);

  async function addPosition(positionData: Omit<Position, "id">) {
    isLoading.value = true;
    try {
      if (useConvexFeatures() && convex) {
        // Use Convex - reactive subscription will automatically update the list
        await convex.mutation(api.positions.mutations.create, {
          name: positionData.name,
          shortName: positionData.name, // Using name for both
        });
        // No need to manually push - the watch on convexPositions handles it
        error.value = null;
        return;
      }

      const newPosition: Position = {
        id: crypto.randomUUID(),
        ...positionData,
      };
      positions.value.push(newPosition);
      error.value = null;
      return newPosition;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to add position";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function updatePosition(id: string, positionData: Partial<Omit<Position, "id">>) {
    isLoading.value = true;
    try {
      if (useConvexFeatures() && convex) {
        // Use Convex - reactive subscription will automatically update the list
        await convex.mutation(api.positions.mutations.update, {
          id: id as any,
          name: positionData.name,
          shortName: positionData.name,
        });
        // No need to manually update - the watch on convexPositions handles it
        error.value = null;
        return;
      }

      const index = positions.value.findIndex((p) => p.id === id);
      if (index === -1) throw new Error("Position not found");

      positions.value[index] = {
        ...positions.value[index],
        ...positionData,
      };
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to update position";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function deletePosition(id: string) {
    isLoading.value = true;
    try {
      if (useConvexFeatures() && convex) {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.positions.mutations.remove, {
          id: id as any,
        });
        // Don't filter positions.value - the reactive subscription will handle it
        error.value = null;
        return;
      }
      // Fallback: local-only
      positions.value = positions.value.filter((p) => p.id !== id);
      error.value = null;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to delete position";
      throw err;
    } finally {
      isLoading.value = false;
    }
  }

  async function loadFromBackend() {
    if (!useConvexFeatures() || !convex) return;

    isLoading.value = true;
    try {
      const data = await convex.query(api.positions.queries.list, {});
      positions.value = data.map((p) => ({
        id: p._id,
        name: p.name,
      }));
      error.value = null;
    } catch (err) {
      console.error("[positionStore] Failed to load from Convex:", err);
      error.value = "Failed to load positions";
    } finally {
      isLoading.value = false;
    }
  }

  const clearError = () => {
    error.value = null;
  };

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
    getError,
    addPosition,
    updatePosition,
    deletePosition,
    clearError,
    reset,
    loadFromBackend,
  };
});
