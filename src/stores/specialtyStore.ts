import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { Specialty, AddSpecialtyPayload } from "@/types/specialty";

export const useSpecialtyStore = defineStore(
  "specialty",
  () => {
    const specialties = ref<Specialty[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexSpecialties } = useConvexQuery(
      api.specialties.queries.list,
      ref({})
    );

    watch(convexSpecialties, (newData) => {
      if (newData) {
        specialties.value = newData.map((s) => ({
          id: s._id,
          name: s.name,
          codeName: s.codeName,
          code: s.code,
          year: s.year,
          orderNumber: s.orderNumber,
          hasModule: s.hasModule || false,
          details: s.details || "",
          isHighlighted: s.isHighlighted,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
      }
    });

    const _specialtyById = computed(() => {
      const m = new Map<string, (typeof specialties.value)[number]>();
      for (const s of specialties.value) m.set(s.id, s);
      return m;
    });
    const getSpecialtyById = computed(() => {
      return (id: string) => _specialtyById.value.get(id);
    });

    const getSpecialtyByCode = computed(() => {
      return (code: string) =>
        specialties.value.find((s) => s.code === code || s.id === code);
    });

    const specialtyOptions = computed(() =>
      specialties.value.map((s) => ({
        value: s.id,
        text: `${s.name} - ${s.details}`,
      }))
    );

    async function fetchSpecialties() {
      return await withLoading(loading, error, async () => {
        // Data will be automatically loaded by Pinia persistence
                error.value = null;
        }, "Failed to load specialties");
    }

    const addSpecialty = async (payload: AddSpecialtyPayload) => {
      return await withLoading(loading, error, async () => {
        // Use Convex - reactive subscription will automatically update the list
                await convex.mutation(api.specialties.mutations.create, {
                  name: payload.name,
                  code: payload.code,
                  codeName: payload.codeName,
                  details: payload.details,
                  year: payload.year,
                  orderNumber: payload.orderNumber,
                  hasModule: false,
                  isHighlighted: false,
                });
                // No need to manually push - the watch on convexSpecialties handles it
        }, "Failed to add specialty");
    };

    const updateSpecialty = async (
      id: string,
      payload: AddSpecialtyPayload
    ) => {
      return await withLoading(loading, error, async () => {
        // Use Convex - reactive subscription will automatically update the list
                await convex.mutation(api.specialties.mutations.update, {
                  id: id as any,
                  name: payload.name,
                  code: payload.code,
                  codeName: payload.codeName,
                  details: payload.details,
                  year: payload.year,
                  orderNumber: payload.orderNumber,
                });
                // No need to manually update - the watch on convexSpecialties handles it
        }, "Failed to update specialty");
    };

    const deleteSpecialty = async (id: string) => {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.specialties.mutations.remove, {
                  id: id as any,
                });
                // Don't filter specialties.value - the reactive subscription will handle it
        }, "Failed to delete specialty");
    };

    const loadFromBackend = async () => {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.specialties.queries.list, {});
                specialties.value = data.map((specialty) => ({
                  id: specialty._id,
                  name: specialty.name,
                  code: specialty.code,
                  codeName: specialty.codeName,
                  year: specialty.year,
                  orderNumber: specialty.orderNumber,
                  details: specialty.details || "",
                  hasModule: specialty.hasModule || false,
                  isHighlighted: specialty.isHighlighted,
                  createdAt: new Date(specialty.createdAt),
                  updatedAt: new Date(specialty.updatedAt),
                }));
                error.value = null;
        }, "Operation failed");
    };

    const clearError = () => {
      error.value = null;
    };

    const reset = () => {
      specialties.value = [];
      loading.value = false;
      error.value = null;
    };

    return {
      specialties,
      loading,
      error,
      getSpecialtyById,
      getSpecialtyByCode,
      specialtyOptions,
      fetchSpecialties,
      addSpecialty,
      updateSpecialty,
      deleteSpecialty,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
