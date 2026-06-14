import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";

export interface Semester {
  id: string;
  shortName: string;
  fullName?: string;
  number?: number;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SEMESTERS: Semester[] = [];

export const useSemesterStore = defineStore(
  "semester",
  () => {
    const semesters = ref<Semester[]>([...DEFAULT_SEMESTERS]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexSemesters } = useConvexQuery(
      api.semesterDefinitions.queries.list,
      ref({})
    );

    watch(convexSemesters, (newData) => {
      if (newData) {
        semesters.value = newData.map((s) => ({
          id: s._id,
          shortName: s.shortName,
          fullName: s.fullName,
          number: s.number,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
      }
    });

    const getSemesterById = computed(() => {
      return (id: string) => semesters.value.find((s) => s.id === id);
    });

    const sortedSemesters = computed(() => {
      return [...semesters.value].sort((a, b) =>
        a.shortName.localeCompare(b.shortName)
      );
    });

    const getSemestersByAcademicYear = computed(() => {
      return (academicYearId: string) => semesters.value; // All semesters are now global
    });

    async function addSemester(
      semesterData: Omit<Semester, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        if (semesterData.number === undefined) {
                  throw new Error("Semester number is required");
                }
                // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.semesterDefinitions.mutations.create, {
                  name: semesterData.shortName,
                  shortName: semesterData.shortName,
                  fullName: semesterData.fullName,
                  number: semesterData.number,
                });
                // Don't push to semesters.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to add semester");
    }

    async function updateSemester(
      id: string,
      semesterData: Partial<Omit<Semester, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.semesterDefinitions.mutations.update, {
                  id: id as any,
                  name: semesterData.shortName,
                  shortName: semesterData.shortName,
                  fullName: semesterData.fullName,
                  number: semesterData.number,
                });
                // Don't update semesters.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to update semester");
    }

    async function deleteSemester(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.semesterDefinitions.mutations.remove, {
                  id: id as any,
                });
                // Don't filter semesters.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete semester");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.semesterDefinitions.queries.list, {});
                semesters.value = data.map((sem) => ({
                  id: sem._id,
                  shortName: sem.shortName,
                  fullName: sem.fullName,
                  number: sem.number,
                  createdAt: new Date(sem.createdAt),
                  updatedAt: new Date(sem.updatedAt),
                }));
                error.value = null;
        }, "Operation failed");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      semesters.value = [...DEFAULT_SEMESTERS];
      loading.value = false;
      error.value = null;
    }

    return {
      semesters,
      loading,
      error,
      getSemesterById,
      sortedSemesters,
      getSemestersByAcademicYear,
      addSemester,
      updateSemester,
      deleteSemester,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
