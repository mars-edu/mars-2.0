import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Cabinet {
  id: string;
  name: string;
  capacity: number;
  type: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddCabinetPayload {
  name: string;
  capacity: number;
  type: string;
  description?: string;
}

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

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function fetchCabinets() {
      loading.value = true;
      try {
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load cabinets";
      } finally {
        loading.value = false;
      }
    }

    const addCabinet = async (payload: AddCabinetPayload) => {
      try {
        loading.value = true;
        error.value = null;

        await convex.mutation(api.cabinets.mutations.create, {
          name: payload.name,
          capacity: payload.capacity,
          type: payload.type,
          description: payload.description,
          isActive: true,
        });
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to add cabinet";
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const updateCabinet = async (
      id: string,
      payload: Partial<AddCabinetPayload> & { isActive?: boolean }
    ) => {
      try {
        loading.value = true;
        error.value = null;

        await convex.mutation(api.cabinets.mutations.update, {
          id: id as any,
          name: payload.name,
          capacity: payload.capacity,
          type: payload.type,
          description: payload.description,
          isActive: payload.isActive,
        });
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to update cabinet";
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const deleteCabinet = async (id: string) => {
      try {
        loading.value = true;
        error.value = null;

        await convex.mutation(api.cabinets.mutations.remove, {
          id: id as any,
        });
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to delete cabinet";
        throw e;
      } finally {
        loading.value = false;
      }
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
      isLoading,
      getError,
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
