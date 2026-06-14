import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";

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

    const getIntermediateControlById = computed(() => {
      return (id: string) =>
        intermediateControls.value.find((c) => c.id === id);
    });

    const sortedIntermediateControls = computed(() => {
      return [...intermediateControls.value].sort((a, b) =>
        a.shortName.localeCompare(b.shortName, "ru")
      );
    });

    async function addIntermediateControl(
      controlData: Omit<IntermediateControl, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.intermediateControls.mutations.create, {
                  name: controlData.name,
                  shortName: controlData.shortName,
                });
                // Don't push to intermediateControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to add intermediate control");
    }

    async function updateIntermediateControl(
      id: string,
      controlData: Partial<
        Omit<IntermediateControl, "id" | "createdAt" | "updatedAt">
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.intermediateControls.mutations.update, {
                  id: id as any,
                  name: controlData.name,
                  shortName: controlData.shortName,
                });
                // Don't update intermediateControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to update intermediate control");
    }

    async function deleteIntermediateControl(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.intermediateControls.mutations.remove, {
                  id: id as any,
                });
                // Don't filter intermediateControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete intermediate control");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
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
        }, "Operation failed");
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
