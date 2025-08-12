import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface AcademicYear {
  id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_ACADEMIC_YEARS: AcademicYear[] = [
  {
    id: "1",
    name: "2023-2024",
    startYear: 2023,
    endYear: 2024,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "2024-2025",
    startYear: 2024,
    endYear: 2025,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useAcademicYearStore = defineStore(
  "academicYear",
  () => {
    const academicYears = ref<AcademicYear[]>([...DEFAULT_ACADEMIC_YEARS]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getAcademicYearById = computed(() => {
      return (id: string) => academicYears.value.find((ay) => ay.id === id);
    });

    const getActiveAcademicYear = computed(() => {
      return academicYears.value.find((ay) => ay.isActive) || null;
    });

    const getSortedAcademicYears = computed(() => {
      return [...academicYears.value].sort((a, b) => a.startYear - b.startYear);
    });

    const academicYearsAsNumbers = computed(() => {
      const years = new Set<number>();
      academicYears.value.forEach((year) => {
        years.add(year.startYear);
        years.add(year.endYear);
      });
      return Array.from(years).sort((a, b) => b - a);
    });

    const academicYearOptions = computed(() =>
      academicYears.value.map((year) => ({
        value: year.id,
        text: year.startYear.toString(),
      }))
    );

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addAcademicYear(
      academicYearData: Omit<AcademicYear, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newAcademicYear: AcademicYear = {
          ...academicYearData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // If the new academic year is active, deactivate all others
        if (newAcademicYear.isActive) {
          academicYears.value.forEach((year) => {
            if (year.id !== newAcademicYear.id) {
              year.isActive = false;
              year.updatedAt = new Date();
            }
          });
        }

        academicYears.value.push(newAcademicYear);
        error.value = null;
        return newAcademicYear;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add academic year";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateAcademicYear(
      id: string,
      academicYearData: Partial<
        Omit<AcademicYear, "id" | "createdAt" | "updatedAt">
      >
    ) {
      loading.value = true;
      try {
        const index = academicYears.value.findIndex((ay) => ay.id === id);
        if (index === -1) {
          throw new Error("Academic year not found");
        }

        const updatedAcademicYear = {
          ...academicYears.value[index],
          ...academicYearData,
          updatedAt: new Date(),
        };

        // If this academic year is being set to active, deactivate all others
        if (academicYearData.isActive) {
          academicYears.value.forEach((year) => {
            if (year.id !== id) {
              year.isActive = false;
              year.updatedAt = new Date();
            }
          });
        }

        academicYears.value[index] = updatedAcademicYear;
        error.value = null;
        return updatedAcademicYear;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update academic year";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteAcademicYear(id: string) {
      loading.value = true;
      try {
        const yearToDelete = academicYears.value.find((year) => year.id === id);
        if (yearToDelete?.isActive) {
          throw new Error("Cannot delete active academic year");
        }

        academicYears.value = academicYears.value.filter((ay) => ay.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete academic year";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function setActiveAcademicYear(id: string) {
      loading.value = true;
      try {
        academicYears.value = academicYears.value.map((year) => ({
          ...year,
          isActive: year.id === id,
          updatedAt: new Date(),
        }));
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to set active academic year";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      academicYears.value = [...DEFAULT_ACADEMIC_YEARS];
      loading.value = false;
      error.value = null;
    }

    return {
      academicYears,
      loading,
      error,
      getAcademicYearById,
      getActiveAcademicYear,
      getSortedAcademicYears,
      academicYearsAsNumbers,
      academicYearOptions,
      isLoading,
      getError,
      addAcademicYear,
      updateAcademicYear,
      deleteAcademicYear,
      setActiveAcademicYear,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
