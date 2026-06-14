import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { Cabinet, AddCabinetPayload } from "@/types/cabinet";

export const useCabinetStore = defineStore(
  "cabinet",
  () => {
    const cabinets = ref<Cabinet[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexCabinets } = useConvexQuery(
      api.cabinets.queries.list,
      ref({})
    );

    watch(convexCabinets, (newData) => {
      if (newData) {
        cabinets.value = newData.map((c) => ({
          id: c._id,
          name: c.name,
          capacity: c.capacity,
          type: c.type,
          description: c.description,
          isActive: c.isActive ?? true,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
      }
    });

    const getCabinetById = computed(() => {
      return (id: string) =>
        cabinets.value.find((c) => c.id === id);
    });

    async function fetchCabinets() {
      return await withLoading(loading, error, async () => {

        }, "Failed to load cabinets");
    }

    const addCabinet = async (payload: AddCabinetPayload) => {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.cabinets.mutations.create, {
                  name: payload.name,
                  capacity: payload.capacity,
                  type: payload.type,
                  description: payload.description,
                  isActive: true,
                });
        }, "Failed to add cabinet");
    };

    const updateCabinet = async (
      id: string,
      payload: Partial<AddCabinetPayload> & { isActive?: boolean }
    ) => {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.cabinets.mutations.update, {
                  id: id as any,
                  name: payload.name,
                  capacity: payload.capacity,
                  type: payload.type,
                  description: payload.description,
                  isActive: payload.isActive,
                });
        }, "Failed to update cabinet");
    };

    const deleteCabinet = async (id: string) => {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.cabinets.mutations.remove, {
                  id: id as any,
                });
        }, "Failed to delete cabinet");
    };

    const toggleActive = async (id: string) => {
      const cabinet = cabinets.value.find((c) => c.id === id);
      if (!cabinet) return;
      await updateCabinet(id, { isActive: !cabinet.isActive });
    };

    const clearError = () => {
      error.value = null;
    };

    const reset = () => {
      cabinets.value = [];
      loading.value = false;
      error.value = null;
    };

    return {
      cabinets,
      loading,
      error,
      getCabinetById,
      fetchCabinets,
      addCabinet,
      updateCabinet,
      deleteCabinet,
      toggleActive,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
