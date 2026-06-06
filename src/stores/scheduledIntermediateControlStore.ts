import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface ScheduledIntermediateControl {
  id: string;
  academicYearId: string;
  intermediateControlId: string;
  shortName: string;
  startDate: string;
  endDate: string;
  semesterId?: string;
  createdAt: Date;
  updatedAt: Date;
}

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

    const getScheduledIntermediateControlById = computed(() => {
      return (id: string) =>
        scheduledIntermediateControls.value.find((c) => c.id === id);
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

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addScheduledIntermediateControl(
      controlData: Omit<
        ScheduledIntermediateControl,
        "id" | "createdAt" | "updatedAt"
      >
    ) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.scheduledControls.mutations.createIntermediate, {
          intermediateControlId: controlData.intermediateControlId,
          academicYearId: controlData.academicYearId,
          shortName: controlData.shortName,
          startDate: controlData.startDate,
          endDate: controlData.endDate,
        });
        // Don't push to scheduledIntermediateControls.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to add scheduled intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateScheduledIntermediateControl(
      id: string,
      controlData: Partial<
        Omit<ScheduledIntermediateControl, "id" | "createdAt" | "updatedAt">
      >
    ) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.scheduledControls.mutations.updateIntermediate, {
          id: id as any,
          intermediateControlId: controlData.intermediateControlId,
          academicYearId: controlData.academicYearId,
          shortName: controlData.shortName,
          startDate: controlData.startDate,
          endDate: controlData.endDate,
        });
        // Don't update scheduledIntermediateControls.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to update scheduled intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteScheduledIntermediateControl(id: string) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.scheduledControls.mutations.removeIntermediate, {
          id: id as any,
        });
        // Don't filter scheduledIntermediateControls.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to delete scheduled intermediate control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function loadFromBackend() {
      loading.value = true;
      try {
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
      } catch (err) {
        console.error("[scheduledIntermediateControlStore] Failed to load from Convex:", err);
        error.value = "Failed to load scheduled intermediate controls";
      } finally {
        loading.value = false;
      }
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
      isLoading,
      getError,
      addScheduledIntermediateControl,
      updateScheduledIntermediateControl,
      deleteScheduledIntermediateControl,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);


