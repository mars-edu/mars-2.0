import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { EducationTechnology } from "@/types/education-technology";

const DEFAULT_TECHNOLOGIES: EducationTechnology[] = [];

export const useEducationTechnologyStore = defineStore(
  "educationTechnology",
  () => {
    const technologies = ref<EducationTechnology[]>([...DEFAULT_TECHNOLOGIES]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexTechnologies } = useConvexQuery(
      api.educationTechnologies.queries.list,
      ref({})
    );

    watch(convexTechnologies, (newData) => {
      if (newData) {
        technologies.value = newData.map((tech) => ({
          id: tech._id,
          name: tech.name,
          shortName: tech.shortName,
          academicHourMinutes: tech.academicHourMinutes,
          isDefault: tech.isDefault,
          description: tech.description,
          createdAt: new Date(tech.createdAt),
          updatedAt: new Date(tech.updatedAt),
        }));
      }
    });

    const getById = computed(() => {
      return (id: string) => technologies.value.find((t) => t.id === id);
    });

    const getDefaultTechnology = computed(() => {
      return technologies.value.find((t) => t.isDefault) || null;
    });

    async function addEducationTechnology(
      data: Omit<EducationTechnology, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        const id = await convex.mutation(api.educationTechnologies.mutations.create, {
          name: data.name,
          shortName: data.shortName,
          academicHourMinutes: data.academicHourMinutes,
          isDefault: data.isDefault,
          description: data.description,
        });
        const created = await convex.query(api.educationTechnologies.queries.getById, { id });
        if (created) {
          error.value = null;
          return {
            id: created._id,
            name: created.name,
            shortName: created.shortName,
            academicHourMinutes: created.academicHourMinutes,
            isDefault: created.isDefault,
            description: created.description,
            createdAt: new Date(created.createdAt),
            updatedAt: new Date(created.updatedAt),
          } satisfies EducationTechnology;
        }
      }, "Failed to add education technology");
    }

    async function updateEducationTechnology(
      id: string,
      data: Partial<Omit<EducationTechnology, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        const updated = await convex.mutation(api.educationTechnologies.mutations.update, {
          id: id as any,
          name: data.name,
          shortName: data.shortName,
          academicHourMinutes: data.academicHourMinutes,
          isDefault: data.isDefault,
          description: data.description,
        });

        if (updated) {
          error.value = null;
          return {
            id: updated._id,
            name: updated.name,
            shortName: updated.shortName,
            academicHourMinutes: updated.academicHourMinutes,
            isDefault: updated.isDefault,
            description: updated.description,
            createdAt: new Date(updated.createdAt),
            updatedAt: new Date(updated.updatedAt),
          } satisfies EducationTechnology;
        }
      }, "Failed to update education technology");
    }

    async function deleteEducationTechnology(id: string) {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.educationTechnologies.mutations.remove, {
          id: id as any,
        });
        error.value = null;
      }, "Failed to delete education technology");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      technologies.value = [...DEFAULT_TECHNOLOGIES];
      loading.value = false;
      error.value = null;
    }

    return {
      technologies,
      loading,
      error,
      getById,
      getDefaultTechnology,
      addEducationTechnology,
      updateEducationTechnology,
      deleteEducationTechnology,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
