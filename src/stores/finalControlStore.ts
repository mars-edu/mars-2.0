import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { FinalControl } from "@/types/final-control";

const DEFAULT_FINAL_CONTROLS: FinalControl[] = [];

export const useFinalControlStore = defineStore(
  "finalControl",
  () => {
    const finalControls = ref<FinalControl[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const sortFinalControls = () => {
      finalControls.value.sort((a, b) =>
        a.shortName.localeCompare(b.shortName, "ru")
      );
    };

    // Reactive subscription to Convex
    const { data: convexControls } = useConvexQuery(
      api.finalControls.queries.list,
      ref({})
    );

    watch(convexControls, (newData) => {
      if (newData) {
        finalControls.value = newData.map((c) => ({
          id: c._id,
          name: c.name,
          shortName: c.shortName,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
        sortFinalControls();
      }
    });

    const getFinalControlById = computed(() => {
      return (id: string) => finalControls.value.find((c) => c.id === id);
    });

    const sortedFinalControls = computed(() => {
      return [...finalControls.value].sort((a, b) =>
        a.shortName.localeCompare(b.shortName, "ru")
      );
    });

    async function addFinalControl(
      controlData: Omit<FinalControl, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.finalControls.mutations.create, {
                  name: controlData.name,
                  shortName: controlData.shortName,
                });
                // Don't push to finalControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to add final control");
    }

    async function updateFinalControl(
      id: string,
      controlData: Partial<Omit<FinalControl, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.finalControls.mutations.update, {
                  id: id as any,
                  name: controlData.name,
                  shortName: controlData.shortName,
                });
                // Don't update finalControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to update final control");
    }

    async function deleteFinalControl(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.finalControls.mutations.remove, {
                  id: id as any,
                });
                // Don't filter finalControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete final control");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.finalControls.queries.list, {});
                finalControls.value = data.map((c) => ({
                  id: c._id,
                  name: c.name,
                  shortName: c.shortName,
                  createdAt: new Date(c.createdAt),
                  updatedAt: new Date(c.updatedAt),
                }));
                sortFinalControls();
                error.value = null;
        }, "Operation failed");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      finalControls.value = [...DEFAULT_FINAL_CONTROLS];
      loading.value = false;
      error.value = null;
      sortFinalControls();
    }

    return {
      finalControls,
      loading,
      error,
      getFinalControlById,
      sortedFinalControls,
      addFinalControl,
      updateFinalControl,
      deleteFinalControl,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
