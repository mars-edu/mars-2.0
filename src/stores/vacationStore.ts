import { defineStore } from "pinia";
import { ref, computed } from "vue";

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
        const newVacation: Vacation = {
          ...vacationData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        vacations.value.push(newVacation);
        error.value = null;
        return newVacation;
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
        const index = vacations.value.findIndex((v) => v.id === id);
        if (index === -1) {
          throw new Error("Vacation not found");
        }

        const updatedVacation = {
          ...vacations.value[index],
          ...vacationData,
          updatedAt: new Date(),
        };

        vacations.value[index] = updatedVacation;
        error.value = null;
        return updatedVacation;
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
        vacations.value = vacations.value.filter((v) => v.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete vacation";
        throw err;
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
    };
  },
  {
    persist: true,
  }
);
