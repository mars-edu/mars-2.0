import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { convex, useConvexFeatures } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface ScheduledFinalControl {
  id: string;
  academicYearId: string;
  finalControlId: string;
  shortName: string;
  startDate: string;
  endDate: string;
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
    if (useConvexFeatures() && convex) {
      const { data: convexControls } = useConvexQuery(
        api.scheduledControls.queries.listFinal,
        ref({})
      );

      watch(convexControls, (newData) => {
        if (newData) {
          scheduledFinalControls.value = newData.map((c) => ({
            id: c._id,
            academicYearId: c.academicYearId,
            finalControlId: c.controlId,
            shortName: c.shortName,
            startDate: c.startDate,
            endDate: c.endDate,
            createdAt: new Date(c.createdAt),
            updatedAt: new Date(c.updatedAt),
          }));
        }
      });
    }

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

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addScheduledFinalControl(
      controlData: Omit<ScheduledFinalControl, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.scheduledControls.mutations.createFinal, {
            finalControlId: controlData.finalControlId,
            class9Id: "", // Store doesn't have this, would need to be added or derived
            semesterId: "", // Store doesn't have this, would need to be added or derived
            date: controlData.startDate,
          });
          // Don't push to scheduledFinalControls.value - the reactive subscription will handle it
          error.value = null;
          return;
        }

        const newControl: ScheduledFinalControl = {
          ...controlData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        scheduledFinalControls.value.push(newControl);
        error.value = null;
        return newControl;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to add scheduled final control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateScheduledFinalControl(
      id: string,
      controlData: Partial<
        Omit<ScheduledFinalControl, "id" | "createdAt" | "updatedAt">
      >
    ) {
      loading.value = true;
      try {
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.scheduledControls.mutations.updateFinal, {
            id: id as any,
            finalControlId: controlData.finalControlId,
            date: controlData.startDate,
          });
          // Don't update scheduledFinalControls.value - the reactive subscription will handle it
          error.value = null;
          return;
        }

        const index = scheduledFinalControls.value.findIndex(
          (c) => c.id === id
        );
        if (index === -1) {
          throw new Error("Scheduled final control not found");
        }

        const updatedControl = {
          ...scheduledFinalControls.value[index],
          ...controlData,
          updatedAt: new Date(),
        };

        scheduledFinalControls.value[index] = updatedControl;
        error.value = null;
        return updatedControl;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to update scheduled final control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteScheduledFinalControl(id: string) {
      loading.value = true;
      try {
        if (useConvexFeatures() && convex) {
          // Use Convex - the reactive subscription will handle updating the local state
          await convex.mutation(api.scheduledControls.mutations.removeFinal, {
            id: id as any,
          });
          // Don't filter scheduledFinalControls.value - the reactive subscription will handle it
          error.value = null;
          return;
        }
        // Fallback: local-only
        scheduledFinalControls.value = scheduledFinalControls.value.filter(
          (c) => c.id !== id
        );
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error
            ? err.message
            : "Failed to delete scheduled final control";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function loadFromBackend() {
      if (!useConvexFeatures() || !convex) return;

      loading.value = true;
      try {
        const data = await convex.query(api.scheduledControls.queries.listFinal, {});
        scheduledFinalControls.value = data.map((c) => ({
          id: c._id,
          academicYearId: "", // Schema doesn't have this, would need mapping
          finalControlId: c.finalControlId,
          shortName: "", // Schema doesn't have this
          startDate: c.date || "",
          endDate: "", // Schema doesn't have this
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
        }));
        error.value = null;
      } catch (err) {
        console.error("[scheduledFinalControlStore] Failed to load from Convex:", err);
        error.value = "Failed to load scheduled final controls";
      } finally {
        loading.value = false;
      }
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
      isLoading,
      getError,
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


