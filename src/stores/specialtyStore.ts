import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex, useConvexFeatures } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Specialty {
  id: string;
  name: string;
  codeName: string;
  code: string;
  hasModule: boolean;
  createdAt: Date;
  updatedAt: Date;
  details: string;
  isHighlighted?: boolean;
}

export interface AddSpecialtyPayload {
  code: string;
  name: string;
  details: string;
  codeName: string;
}

export const useSpecialtyStore = defineStore(
  "specialty",
  () => {
    const specialties = ref<Specialty[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    if (useConvexFeatures() && convex) {
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
            hasModule: s.hasModule || false,
            details: s.details || "",
            isHighlighted: s.isHighlighted,
            createdAt: new Date(s.createdAt),
            updatedAt: new Date(s.updatedAt),
          }));
        }
      });
    }

    const getSpecialtyById = computed(() => {
      return (id: string) => specialties.value.find((s) => s.id === id);
    });

    const getSpecialtyByCode = computed(() => {
      return (code: string) => specialties.value.find((s) => s.code === code);
    });

    const specialtyOptions = computed(() =>
      specialties.value.map((s) => ({
        value: s.id,
        text: `${s.name} - ${s.details}`,
      }))
    );

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function fetchSpecialties() {
      loading.value = true;
      try {
        // Data will be automatically loaded by Pinia persistence
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load specialties";
      } finally {
        loading.value = false;
      }
    }

    const addSpecialty = async (payload: AddSpecialtyPayload) => {
      try {
        loading.value = true;
        error.value = null;

        if (useConvexFeatures() && convex) {
          // Use Convex - reactive subscription will automatically update the list
          await convex.mutation(api.specialties.mutations.create, {
            name: payload.name,
            code: payload.code,
            codeName: payload.codeName,
            details: payload.details,
            hasModule: false,
            isHighlighted: false,
          });
          // No need to manually push - the watch on convexSpecialties handles it
          return;
        }

        // Fallback: local-only
        const newSpecialty: Specialty = {
          id: crypto.randomUUID(),
          ...payload,
          createdAt: new Date(),
          updatedAt: new Date(),
          hasModule: false,
        };

        specialties.value.push(newSpecialty);
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to add specialty";
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const updateSpecialty = async (
      id: string,
      payload: AddSpecialtyPayload
    ) => {
      try {
        loading.value = true;
        error.value = null;

        if (useConvexFeatures() && convex) {
          // Use Convex - reactive subscription will automatically update the list
          await convex.mutation(api.specialties.mutations.update, {
            id: id as any,
            name: payload.name,
            code: payload.code,
            codeName: payload.codeName,
            details: payload.details,
          });
          // No need to manually update - the watch on convexSpecialties handles it
          return;
        }

        // Fallback: local-only
        const index = specialties.value.findIndex((s) => s.id === id);
        if (index === -1) throw new Error("Specialty not found");

        specialties.value[index] = {
          ...specialties.value[index],
          ...payload,
          updatedAt: new Date(),
        };
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to update specialty";
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const deleteSpecialty = async (id: string) => {
      try {
        loading.value = true;
        error.value = null;

        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.specialties.mutations.remove, {
            id: id as any,
          });
          // Don't filter specialties.value - the reactive subscription will handle it
          return;
        }

        // Fallback: local-only
        const index = specialties.value.findIndex((s) => s.id === id);
        if (index === -1) throw new Error("Specialty not found");

        specialties.value.splice(index, 1);
      } catch (e) {
        error.value =
          e instanceof Error ? e.message : "Failed to delete specialty";
        throw e;
      } finally {
        loading.value = false;
      }
    };

    const loadFromBackend = async () => {
      if (!useConvexFeatures() || !convex) return;

      loading.value = true;
      try {
        const data = await convex.query(api.specialties.queries.list, {});
        specialties.value = data.map((specialty) => ({
          id: specialty._id,
          name: specialty.name,
          code: specialty.code,
          codeName: specialty.codeName,
          details: specialty.details || "",
          hasModule: specialty.hasModule || false,
          isHighlighted: specialty.isHighlighted,
          createdAt: new Date(specialty.createdAt),
          updatedAt: new Date(specialty.updatedAt),
        }));
        error.value = null;
      } catch (err) {
        console.error("[specialtyStore] Failed to load from Convex:", err);
        error.value = "Failed to load specialties";
      } finally {
        loading.value = false;
      }
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
      isLoading,
      getError,
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
