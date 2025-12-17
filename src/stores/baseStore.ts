import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex, useConvexFeatures } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Base {
  id: string;
  value: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

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
    if (useConvexFeatures() && convex) {
      const { data: convexBases } = useConvexQuery(
        api.bases.queries.list,
        ref({})
      );

      watch(convexBases, (newData) => {
        if (newData) {
          bases.value = newData.map((b) => ({
            id: b._id,
            value: b.value.toString(),
            text: b.name,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
          }));
        }
      });
    }

    const getBaseById = computed(() => {
      return (id: string) => bases.value.find((b) => b.id === id);
    });

    const baseOptions = computed(() =>
      bases.value.map((base) => ({
        value: base.value,
        text: base.text,
      }))
    );

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function fetchBases() {
      loading.value = true;
      try {
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load bases";
      } finally {
        loading.value = false;
      }
    }

    async function addBase(
      baseData: Omit<Base, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        if (useConvexFeatures() && convex) {
          // Use Convex - reactive subscription will automatically update the list
          await convex.mutation(api.bases.mutations.create, {
            value: parseInt(baseData.value),
            name: baseData.text,
          });
          // No need to manually push - the watch on convexBases handles it
          error.value = null;
          return;
        }

        const newBase: Base = {
          ...baseData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        bases.value.push(newBase);
        error.value = null;
        return newBase;
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to add base";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateBase(
      id: string,
      baseData: Partial<Omit<Base, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        if (useConvexFeatures() && convex) {
          // Use Convex - reactive subscription will automatically update the list
          await convex.mutation(api.bases.mutations.update, {
            id: id as any,
            value: baseData.value ? parseInt(baseData.value) : undefined,
            name: baseData.text,
          });
          // No need to manually update - the watch on convexBases handles it
          error.value = null;
          return;
        }

        const index = bases.value.findIndex((b) => b.id === id);
        if (index === -1) {
          throw new Error("Base not found");
        }

        const updatedBase = {
          ...bases.value[index],
          ...baseData,
          updatedAt: new Date(),
        };

        bases.value[index] = updatedBase;
        error.value = null;
        return updatedBase;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update base";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteBase(id: string) {
      loading.value = true;
      try {
        if (useConvexFeatures() && convex) {
          await convex.mutation(api.bases.mutations.remove, {
            id: id as any,
          });
        }
        bases.value = bases.value.filter((b) => b.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete base";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function loadFromBackend() {
      if (!useConvexFeatures() || !convex) return;

      loading.value = true;
      try {
        const data = await convex.query(api.bases.queries.list, {});
        bases.value = data.map((b) => ({
          id: b._id,
          value: b.value.toString(),
          text: b.name,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        }));
        error.value = null;
      } catch (err) {
        console.error("[baseStore] Failed to load from Convex:", err);
        error.value = "Failed to load bases";
      } finally {
        loading.value = false;
      }
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
      isLoading,
      getError,
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
