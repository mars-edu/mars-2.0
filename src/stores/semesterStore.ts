import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Semester {
  id: string;
  shortName: string;
  fullName: string;
  startDate: string;
  endDate: string;
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

    const getSemesterById = computed(() => {
      return (id: string) => semesters.value.find((s) => s.id === id);
    });

    const sortedSemesters = computed(() => {
      return [...semesters.value].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addSemester(
      semesterData: Omit<Semester, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newSemester: Semester = {
          ...semesterData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        semesters.value.push(newSemester);
        error.value = null;
        return newSemester;
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
      semesterData: Partial<Omit<Semester, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        const index = semesters.value.findIndex((s) => s.id === id);
        if (index === -1) {
          throw new Error("Semester not found");
        }

        const updatedSemester = {
          ...semesters.value[index],
          ...semesterData,
          updatedAt: new Date(),
        };

        semesters.value[index] = updatedSemester;
        error.value = null;
        return updatedSemester;
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
        semesters.value = semesters.value.filter((s) => s.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete semester";
        throw err;
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

    // Migration function to port old semester data
    function migrateOldSemesterData() {
      let hasChanges = false;

      semesters.value = semesters.value.map((semester) => {
        const oldSemester = semester as any;
        if (oldSemester.name && (!semester.shortName || !semester.fullName)) {
          hasChanges = true;
          return {
            ...semester,
            shortName: oldSemester.name,
            fullName: oldSemester.name,
            name: undefined,
          };
        }
        return semester;
      });

      if (hasChanges) {
        console.log(
          "Migrated old semester name fields to shortName/fullName structure"
        );
      }
    }

    // Migration function to handle legacy data from unified store
    function migrateLegacyPeriodData() {
      try {
        // Check if we have old period data with mixed types
        const oldPeriodsData = localStorage.getItem("semester");
        if (!oldPeriodsData) return { vacations: [], sessions: [] };

        const parsedData = JSON.parse(oldPeriodsData);
        const oldPeriods = parsedData?.periods || [];

        if (!Array.isArray(oldPeriods) || oldPeriods.length === 0) {
          return { vacations: [], sessions: [] };
        }

        // Check if any periods have the old unified structure with 'type' field
        const hasOldStructure = oldPeriods.some(
          (period: any) =>
            period.type &&
            ["vacation", "session", "semester"].includes(period.type)
        );

        if (!hasOldStructure) {
          return { vacations: [], sessions: [] };
        }

        console.log(
          "Found legacy period data, migrating to separate stores..."
        );

        // Separate periods by type and convert name field
        const vacations: any[] = [];
        const sessions: any[] = [];
        const updatedSemesters: any[] = [];

        oldPeriods.forEach((period: any) => {
          const migratedPeriod = {
            ...period,
            shortName: period.name || period.shortName || "Unnamed",
            fullName: period.name || period.fullName || "Unnamed",
            // Remove old fields
            name: undefined,
            type: undefined,
          };

          if (period.type === "vacation") {
            vacations.push(migratedPeriod);
          } else if (period.type === "session") {
            sessions.push(migratedPeriod);
          } else if (period.type === "semester") {
            updatedSemesters.push(migratedPeriod);
          }
        });

        // Update semester store with only semester data
        if (updatedSemesters.length > 0) {
          semesters.value = updatedSemesters;
          console.log(
            `Migrated ${updatedSemesters.length} semesters to semester store`
          );
        }

        return {
          vacations: vacations,
          sessions: sessions,
        };
      } catch (error) {
        console.error("Error during legacy data migration:", error);
        return { vacations: [], sessions: [] };
      }
    }

    return {
      semesters,
      loading,
      error,
      getSemesterById,
      sortedSemesters,
      isLoading,
      getError,
      addSemester,
      updateSemester,
      deleteSemester,
      clearError,
      reset,
      migrateOldSemesterData,
      migrateLegacyPeriodData,
    };
  },
  {
    persist: true,
  }
);
