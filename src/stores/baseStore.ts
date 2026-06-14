import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { Base } from "@/types/base";

const DEFAULT_BASES: Base[] = [
  {
    id: "1",
    value: "9",
    text: "9",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    value: "11",
    text: "11",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useBaseStore = defineStore(
  "base",
  () => {
    const bases = ref<Base[]>(DEFAULT_BASES);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexBases } = useConvexQuery(
      api.bases.queries.list,
      ref({})
    );

    watch(convexBases, (newData) => {
      if (newData && newData.length > 0) {
        bases.value = newData.map((b) => ({
          id: b._id,
          value: b.value.toString(),
          text: b.name,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        }));
      }
      // If newData is empty or null, keep the default bases
      // This ensures the dropdown always has options even if DB is not seeded yet
    });

    const getBaseById = computed(() => {
      return (id: string) => bases.value.find((b) => b.id === id);
    });

    const baseOptions = computed(() =>
      bases.value.map((base) => ({
        value: base.value,
        text: base.text,
      }))
    );

    async function fetchBases() {
      return await withLoading(loading, error, async () => {

        }, "Failed to load bases");
    }

    async function addBase(
      baseData: Omit<Base, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - reactive subscription will automatically update the list
                await convex.mutation(api.bases.mutations.create, {
                  value: parseInt(baseData.value),
                  name: baseData.text,
                });
                // No need to manually push - the watch on convexBases handles it
                error.value = null;
        }, "Failed to add base");
    }

    async function updateBase(
      id: string,
      baseData: Partial<Omit<Base, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - reactive subscription will automatically update the list
                await convex.mutation(api.bases.mutations.update, {
                  id: id as any,
                  value: baseData.value ? parseInt(baseData.value) : undefined,
                  name: baseData.text,
                });
                // No need to manually update - the watch on convexBases handles it
                error.value = null;
        }, "Failed to update base");
    }

    async function deleteBase(id: string) {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.bases.mutations.remove, {
                  id: id as any,
                });
                error.value = null;
        }, "Failed to delete base");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.bases.queries.list, {});
                bases.value = data.map((b) => ({
                  id: b._id,
                  value: b.value.toString(),
                  text: b.name,
                  createdAt: new Date(b.createdAt),
                  updatedAt: new Date(b.updatedAt),
                }));
                error.value = null;
        }, "Operation failed");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      bases.value = [...DEFAULT_BASES];
      loading.value = false;
      error.value = null;
    }

    return {
      bases,
      loading,
      error,
      getBaseById,
      baseOptions,
      fetchBases,
      addBase,
      updateBase,
      deleteBase,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
