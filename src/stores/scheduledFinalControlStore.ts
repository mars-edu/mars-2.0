import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";

export interface ScheduledFinalControl {
  id: string;
  academicYearId: string;
  finalControlId: string;
  shortName: string;
  startDate: string;
  endDate: string;
  semesterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SCHEDULED_FINAL_CONTROLS: ScheduledFinalControl[] = [];

export const useScheduledFinalControlStore = defineStore(
  "scheduledFinalControl",
  () => {
    const scheduledFinalControls = ref<ScheduledFinalControl[]>([
      ...DEFAULT_SCHEDULED_FINAL_CONTROLS,
    ]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexControls } = useConvexQuery(
      api.scheduledControls.queries.listFinal,
      ref({})
    );

    watch(convexControls, (newData) => {
      if (newData) {
        scheduledFinalControls.value = newData.map((c) => ({
          id: c._id,
          academicYearId: c.academicYearId,
          finalControlId: c.finalControlId,
          shortName: c.shortName,
          startDate: c.startDate,
          endDate: c.endDate,
          semesterId: c.semesterId ?? undefined,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
      }
    });

    const getScheduledFinalControlById = computed(() => {
      return (id: string) =>
        scheduledFinalControls.value.find((c) => c.id === id);
    });

    const sortedScheduledFinalControls = computed(() => {
      return [...scheduledFinalControls.value].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
    });

    const getScheduledFinalControlsByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        scheduledFinalControls.value.filter(
          (c) => c.academicYearId === academicYearId
        );
    });

    const getScheduledFinalControlsBySemester = computed(() => {
      return (semesterId: string) =>
        scheduledFinalControls.value.filter(
          (c) => c.semesterId === semesterId
        );
    });

    async function addScheduledFinalControl(
      controlData: Omit<ScheduledFinalControl, "id" | "createdAt" | "updatedAt">
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.scheduledControls.mutations.createFinal, {
                  finalControlId: controlData.finalControlId,
                  academicYearId: controlData.academicYearId,
                  shortName: controlData.shortName,
                  startDate: controlData.startDate,
                  endDate: controlData.endDate,
                });
                // Don't push to scheduledFinalControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to add scheduled final control");
    }

    async function updateScheduledFinalControl(
      id: string,
      controlData: Partial<
        Omit<ScheduledFinalControl, "id" | "createdAt" | "updatedAt">
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.scheduledControls.mutations.updateFinal, {
                  id: id as any,
                  finalControlId: controlData.finalControlId,
                  academicYearId: controlData.academicYearId,
                  shortName: controlData.shortName,
                  startDate: controlData.startDate,
                  endDate: controlData.endDate,
                });
                // Don't update scheduledFinalControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to update scheduled final control");
    }

    async function deleteScheduledFinalControl(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.scheduledControls.mutations.removeFinal, {
                  id: id as any,
                });
                // Don't filter scheduledFinalControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete scheduled final control");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.scheduledControls.queries.listFinal, {});
                scheduledFinalControls.value = data.map((c) => ({
                  id: c._id,
                  academicYearId: c.academicYearId,
                  finalControlId: c.finalControlId,
                  shortName: c.shortName,
                  startDate: c.startDate,
                  endDate: c.endDate,
                  createdAt: new Date(c.createdAt),
                  updatedAt: new Date(c.updatedAt),
                }));
                error.value = null;
        }, "Operation failed");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      scheduledFinalControls.value = [...DEFAULT_SCHEDULED_FINAL_CONTROLS];
      loading.value = false;
      error.value = null;
    }

    return {
      scheduledFinalControls,
      loading,
      error,
      getScheduledFinalControlById,
      sortedScheduledFinalControls,
      getScheduledFinalControlsByAcademicYear,
      getScheduledFinalControlsBySemester,
      addScheduledFinalControl,
      updateScheduledFinalControl,
      deleteScheduledFinalControl,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);


