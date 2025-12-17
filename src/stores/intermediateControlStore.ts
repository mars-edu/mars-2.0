import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex, useConvexFeatures } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

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

    // Reactive subscription to Convex
    if (useConvexFeatures() && convex) {
      const { data: convexControls } = useConvexQuery(
        api.intermediateControls.queries.list,
        ref({})
      );

      watch(convexControls, (newData) => {
        if (newData) {
          intermediateControls.value = newData.map((c) => ({
            id: c._id,
            name: c.name,
            shortName: c.shortName,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          }));
          sortIntermediateControls();
        }
      });
    } else if (intermediateControls.value.length === 0) {
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
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.intermediateControls.mutations.create, {
            name: controlData.name,
            shortName: controlData.shortName,
          });
          // Don't push to intermediateControls.value - the reactive subscription will handle it
          error.value = null;
          return;
        }

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
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.intermediateControls.mutations.update, {
            id: id as any,
            name: controlData.name,
            shortName: controlData.shortName,
          });
          // Don't update intermediateControls.value - the reactive subscription will handle it
          error.value = null;
          return;
        }

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
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.intermediateControls.mutations.remove, {
            id: id as any,
          });
          // Don't filter intermediateControls.value - the reactive subscription will handle it
          error.value = null;
          return;
        }
        // Fallback: local-only
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

    async function loadFromBackend() {
      if (!useConvexFeatures() || !convex) return;

      loading.value = true;
      try {
        const data = await convex.query(api.intermediateControls.queries.list, {});
        intermediateControls.value = data.map((c) => ({
          id: c._id,
          name: c.name,
          shortName: c.shortName,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
        sortIntermediateControls();
        error.value = null;
      } catch (err) {
        console.error("[intermediateControlStore] Failed to load from Convex:", err);
        error.value = "Failed to load intermediate controls";
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
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
