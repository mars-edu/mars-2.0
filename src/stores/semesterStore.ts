import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Semester {
  id: string;
  shortName: string;
  fullName?: string;
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
      api.semesters.queries.list,
      ref({})
    );

    watch(convexSemesters, (newData) => {
      if (newData) {
        semesters.value = newData.map((s) => ({
          id: s._id,
          shortName: s.shortName || s.name,
          fullName: s.fullName,
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

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addSemester(
      semesterData: Omit<
        Semester,
        "id" | "createdAt" | "updatedAt" | "academicYearId"
      >
    ) {
      loading.value = true;
      try {
        // Use Convex - need to provide a dummy academicYearId since it's required in schema
        // In a real scenario, this should come from context or be passed as parameter
        const { useAcademicYearStore } = await import("./academicYearStore");
        const academicYearStore = useAcademicYearStore();
        const activeYear = academicYearStore.getActiveAcademicYear;

        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.semesters.mutations.create, {
          name: semesterData.shortName,
          shortName: semesterData.shortName,
          fullName: semesterData.fullName,
          academicYearId: activeYear?.id as any || "temp",
        });
        // Don't push to semesters.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateSemester(
      id: string,
      semesterData: Partial<
        Omit<Semester, "id" | "createdAt" | "updatedAt" | "academicYearId">
      >
    ) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.semesters.mutations.update, {
          id: id as any,
          name: semesterData.shortName,
          shortName: semesterData.shortName,
          fullName: semesterData.fullName,
        });
        // Don't update semesters.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteSemester(id: string) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.semesters.mutations.remove, {
          id: id as any,
        });
        // Don't filter semesters.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete semester";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function loadFromBackend() {
      loading.value = true;
      try {
        const data = await convex.query(api.semesters.queries.list, {});
        semesters.value = data.map((sem) => ({
          id: sem._id,
          shortName: sem.shortName || sem.name,
          fullName: sem.fullName,
          createdAt: new Date(sem.createdAt),
          updatedAt: new Date(sem.updatedAt),
        }));
        error.value = null;
      } catch (err) {
        console.error("[semesterStore] Failed to load from Convex:", err);
        error.value = "Failed to load semesters";
      } finally {
        loading.value = false;
      }
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
      isLoading,
      getError,
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
