import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { Vacation } from "@/types/vacation";

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
          semesterId: v.semesterId,
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

    const getVacationsBySemester = computed(() => {
      return (semesterId: string) =>
        vacations.value.filter((v) => v.semesterId === semesterId);
    });

    async function addVacation(
      vacationData: Omit<Vacation, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.vacations.mutations.create, {
                  shortName: vacationData.shortName,
                  fullName: vacationData.fullName,
                  academicYearId: vacationData.academicYearId as any,
                  startDate: vacationData.startDate,
                  endDate: vacationData.endDate,
                  semesterId: vacationData.semesterId as Id<"academicYearSemesters">,
                });
                // Don't push to vacations.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to add vacation");
    }

    async function updateVacation(
      id: string,
      vacationData: Partial<Omit<Vacation, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.vacations.mutations.update, {
                  id: id as any,
                  shortName: vacationData.shortName,
                  fullName: vacationData.fullName,
                  academicYearId: vacationData.academicYearId as any,
                  startDate: vacationData.startDate,
                  endDate: vacationData.endDate,
                  semesterId: vacationData.semesterId as Id<"academicYearSemesters">,
                });
                // Don't update vacations.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to update vacation");
    }

    async function deleteVacation(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.vacations.mutations.remove, {
                  id: id as any,
                });
                // Don't filter vacations.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete vacation");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.vacations.queries.list, {});
                vacations.value = data.map((v) => ({
                  id: v._id,
                  shortName: v.shortName,
                  fullName: v.fullName,
                  startDate: v.startDate,
                  endDate: v.endDate,
                  academicYearId: v.academicYearId,
                  semesterId: v.semesterId,
                  createdAt: new Date(v.createdAt),
                  updatedAt: new Date(v.updatedAt),
                }));
                error.value = null;
        }, "Operation failed");
    }

    async function copyFromSemester(
      sourceSemesterId: string,
      targetSemesterId: string,
      targetAcademicYearId: string
    ) {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.vacations.mutations.copyFromSemester, {
          sourceSemesterId: sourceSemesterId as any,
          targetSemesterId: targetSemesterId as any,
          targetAcademicYearId: targetAcademicYearId as any,
        });
        error.value = null;
        return;
      }, "Failed to copy vacations from semester");
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
      getVacationsBySemester,
      addVacation,
      updateVacation,
      deleteVacation,
      clearError,
      copyFromSemester,
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
