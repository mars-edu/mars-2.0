import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface Vacation {
  id: string;
  shortName: string;
  fullName: string;
  startDate: string;
  endDate: string;
  academicYearId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_VACATIONS: Vacation[] = [];

export const useVacationStore = defineStore(
  "vacation",
  () => {
    const vacations = ref<Vacation[]>([...DEFAULT_VACATIONS]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexVacations } = useConvexQuery(
      api.vacations.queries.list,
      ref({})
    );

    watch(convexVacations, (newData) => {
      if (newData) {
        vacations.value = newData.map((v) => ({
          id: v._id,
          shortName: v.shortName,
          fullName: v.fullName,
          startDate: v.startDate,
          endDate: v.endDate,
          academicYearId: v.academicYearId,
          createdAt: new Date(v.createdAt),
          updatedAt: new Date(v.updatedAt),
        }));
      }
    });

    const getVacationById = computed(() => {
      return (id: string) => vacations.value.find((v) => v.id === id);
    });

    const sortedVacations = computed(() => {
      return [...vacations.value].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
    });

    const getVacationsByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        vacations.value.filter((v) => v.academicYearId === academicYearId);
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addVacation(
      vacationData: Omit<Vacation, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.vacations.mutations.create, {
          name: vacationData.shortName,
          academicYearId: vacationData.academicYearId,
          startDate: vacationData.startDate,
          endDate: vacationData.endDate,
        });
        // Don't push to vacations.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add vacation";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateVacation(
      id: string,
      vacationData: Partial<Omit<Vacation, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.vacations.mutations.update, {
          id: id as any,
          name: vacationData.shortName,
          academicYearId: vacationData.academicYearId,
          startDate: vacationData.startDate,
          endDate: vacationData.endDate,
        });
        // Don't update vacations.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update vacation";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteVacation(id: string) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.vacations.mutations.remove, {
          id: id as any,
        });
        // Don't filter vacations.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete vacation";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function loadFromBackend() {
      loading.value = true;
      try {
        const data = await convex.query(api.vacations.queries.list, {});
        vacations.value = data.map((v) => ({
          id: v._id,
          shortName: v.name,
          fullName: v.name,
          startDate: v.startDate,
          endDate: v.endDate,
          academicYearId: v.academicYearId,
          createdAt: new Date(v.createdAt),
          updatedAt: new Date(v.updatedAt),
        }));
        error.value = null;
      } catch (err) {
        console.error("[vacationStore] Failed to load from Convex:", err);
        error.value = "Failed to load vacations";
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      vacations.value = [...DEFAULT_VACATIONS];
      loading.value = false;
      error.value = null;
    }

    // Migration function to port old vacation data from semesterStore
    function migrateOldVacationData() {
      let hasChanges = false;

      vacations.value = vacations.value.map((vacation) => {
        const oldVacation = vacation as any;
        if (oldVacation.name && (!vacation.shortName || !vacation.fullName)) {
          hasChanges = true;
          return {
            ...vacation,
            shortName: oldVacation.name,
            fullName: oldVacation.name,
            name: undefined,
          };
        }
        return vacation;
      });

      if (hasChanges) {
        console.log(
          "Migrated old vacation name fields to shortName/fullName structure"
        );
      }
    }

    // Function to handle legacy vacation data migration
    function handleLegacyVacationData(legacyVacations: any[]) {
      if (legacyVacations.length > 0 && vacations.value.length === 0) {
        vacations.value = legacyVacations;
        console.log(
          `Migrated ${legacyVacations.length} vacations to vacation store`
        );
      }
    }

    return {
      vacations,
      loading,
      error,
      getVacationById,
      sortedVacations,
      getVacationsByAcademicYear,
      isLoading,
      getError,
      addVacation,
      updateVacation,
      deleteVacation,
      clearError,
      reset,
      migrateOldVacationData,
      handleLegacyVacationData,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
