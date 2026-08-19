import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { ScheduledFinalControl } from "@/types/scheduled-final-control";

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

    const _scheduledFinalControlById = computed(() => {
      const m = new Map<
        string,
        (typeof scheduledFinalControls.value)[number]
      >();
      for (const c of scheduledFinalControls.value) m.set(c.id, c);
      return m;
    });
    const getScheduledFinalControlById = computed(() => {
      return (id: string) => _scheduledFinalControlById.value.get(id);
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
                  academicYearId: controlData.academicYearId as any,
                  shortName: controlData.shortName,
                  startDate: controlData.startDate,
                  endDate: controlData.endDate,
                  semesterId: controlData.semesterId as Id<"academicYearSemesters">,
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
                  academicYearId: controlData.academicYearId as any,
                  shortName: controlData.shortName,
                  startDate: controlData.startDate,
                  endDate: controlData.endDate,
                  semesterId: controlData.semesterId as Id<"academicYearSemesters">,
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

    async function copyFromSemester(
      sourceSemesterId: string,
      targetSemesterId: string,
      targetAcademicYearId: string
    ) {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.scheduledControls.mutations.copyFinalFromSemester, {
          sourceSemesterId: sourceSemesterId as any,
          targetSemesterId: targetSemesterId as any,
          targetAcademicYearId: targetAcademicYearId as any,
        });
        error.value = null;
        return;
      }, "Failed to copy final controls from semester");
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
      copyFromSemester,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);


