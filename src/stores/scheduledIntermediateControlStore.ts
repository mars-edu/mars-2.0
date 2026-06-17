import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";
import type { ScheduledIntermediateControl } from "@/types/scheduled-intermediate-control";

const DEFAULT_SCHEDULED_INTERMEDIATE_CONTROLS: ScheduledIntermediateControl[] =
  [];

export const useScheduledIntermediateControlStore = defineStore(
  "scheduledIntermediateControl",
  () => {
    const scheduledIntermediateControls = ref<ScheduledIntermediateControl[]>([
      ...DEFAULT_SCHEDULED_INTERMEDIATE_CONTROLS,
    ]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Reactive subscription to Convex
    const { data: convexControls } = useConvexQuery(
      api.scheduledControls.queries.listIntermediate,
      ref({})
    );

    watch(convexControls, (newData) => {
      if (newData) {
        scheduledIntermediateControls.value = newData.map((c) => ({
          id: c._id,
          academicYearId: c.academicYearId,
          intermediateControlId: c.intermediateControlId,
          shortName: c.shortName,
          startDate: c.startDate,
          endDate: c.endDate,
          semesterId: c.semesterId ?? undefined,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
      }
    });

    const _scheduledIntermediateControlById = computed(() => {
      const m = new Map<
        string,
        (typeof scheduledIntermediateControls.value)[number]
      >();
      for (const c of scheduledIntermediateControls.value) m.set(c.id, c);
      return m;
    });
    const getScheduledIntermediateControlById = computed(() => {
      return (id: string) => _scheduledIntermediateControlById.value.get(id);
    });

    const sortedScheduledIntermediateControls = computed(() => {
      return [...scheduledIntermediateControls.value].sort((a, b) =>
        a.startDate.localeCompare(b.startDate)
      );
    });

    const getScheduledIntermediateControlsByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        scheduledIntermediateControls.value.filter(
          (c) => c.academicYearId === academicYearId
        );
    });

    const getScheduledIntermediateControlsBySemester = computed(() => {
      return (semesterId: string) =>
        scheduledIntermediateControls.value.filter(
          (c) => c.semesterId === semesterId
        );
    });

    async function addScheduledIntermediateControl(
      controlData: Omit<
        ScheduledIntermediateControl,
        "id" | "createdAt" | "updatedAt"
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.scheduledControls.mutations.createIntermediate, {
                  intermediateControlId: controlData.intermediateControlId,
                  academicYearId: controlData.academicYearId,
                  shortName: controlData.shortName,
                  startDate: controlData.startDate,
                  endDate: controlData.endDate,
                  semesterId: controlData.semesterId as string,
                });
                // Don't push to scheduledIntermediateControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to add scheduled intermediate control");
    }

    async function updateScheduledIntermediateControl(
      id: string,
      controlData: Partial<
        Omit<ScheduledIntermediateControl, "id" | "createdAt" | "updatedAt">
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.scheduledControls.mutations.updateIntermediate, {
                  id: id as any,
                  intermediateControlId: controlData.intermediateControlId,
                  academicYearId: controlData.academicYearId,
                  shortName: controlData.shortName,
                  startDate: controlData.startDate,
                  endDate: controlData.endDate,
                  semesterId: controlData.semesterId as string,
                });
                // Don't update scheduledIntermediateControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to update scheduled intermediate control");
    }

    async function deleteScheduledIntermediateControl(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.scheduledControls.mutations.removeIntermediate, {
                  id: id as any,
                });
                // Don't filter scheduledIntermediateControls.value - the reactive subscription will handle it
                error.value = null;
        }, "Failed to delete scheduled intermediate control");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.scheduledControls.queries.listIntermediate, {});
                scheduledIntermediateControls.value = data.map((c) => ({
                  id: c._id,
                  academicYearId: c.academicYearId,
                  intermediateControlId: c.intermediateControlId,
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
        await convex.mutation(api.scheduledControls.mutations.copyIntermediateFromSemester, {
          sourceSemesterId: sourceSemesterId as any,
          targetSemesterId: targetSemesterId as any,
          targetAcademicYearId,
        });
        error.value = null;
        return;
      }, "Failed to copy intermediate controls from semester");
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      scheduledIntermediateControls.value = [
        ...DEFAULT_SCHEDULED_INTERMEDIATE_CONTROLS,
      ];
      loading.value = false;
      error.value = null;
    }

    return {
      scheduledIntermediateControls,
      loading,
      error,
      getScheduledIntermediateControlById,
      sortedScheduledIntermediateControls,
      getScheduledIntermediateControlsByAcademicYear,
      getScheduledIntermediateControlsBySemester,
      addScheduledIntermediateControl,
      updateScheduledIntermediateControl,
      deleteScheduledIntermediateControl,
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


