import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useAcademicYearStore } from "./academicYearStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface EducationSchedule {
  id: string;
  lessonNumber: number;
  startTime: string;
  endTime: string;
  academicYearId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const useEducationScheduleStore = defineStore(
  "educationSchedule",
  () => {
    const schedules = ref<EducationSchedule[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const academicYearStore = useAcademicYearStore();

    const sortSchedules = () => {
      schedules.value.sort((a, b) => a.lessonNumber - b.lessonNumber);
    };

    // Reactive subscription to Convex
    const { data: convexSchedules } = useConvexQuery(
      api.educationSchedules.queries.list,
      ref({})
    );

    watch(convexSchedules, (newData) => {
      if (newData) {
        schedules.value = newData.map((s) => ({
          id: s._id,
          lessonNumber: s.order,
          startTime: s.startTime,
          endTime: s.endTime,
          academicYearId: s.academicYearId,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        sortSchedules();
      }
    });

    const getScheduleById = computed(() => {
      return (id: string) => schedules.value.find((s) => s.id === id);
    });

    const getSchedules = computed(() => schedules.value);
    const getSchedulesByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        schedules.value.filter((s) => s.academicYearId === academicYearId);
    });

    const getActiveYearSchedules = computed(() => {
      const activeYear = academicYearStore.getActiveAcademicYear;
      if (!activeYear) return [];
      return schedules.value
        .filter((s) => s.academicYearId === activeYear.id)
        .sort((a, b) => a.lessonNumber - b.lessonNumber);
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    async function addSchedule(
      scheduleData: Omit<EducationSchedule, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.educationSchedules.mutations.create, {
          name: `Lesson ${scheduleData.lessonNumber}`,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          order: scheduleData.lessonNumber,
          academicYearId: scheduleData.academicYearId,
        });
        // Don't push to schedules.value - the reactive subscription will handle it
        error.value = null;
        return;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add schedule";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateSchedule(
      id: string,
      scheduleData: Partial<
        Omit<EducationSchedule, "id" | "createdAt" | "updatedAt">
      >
    ) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.educationSchedules.mutations.update, {
          id: id as any,
          name: scheduleData.lessonNumber ? `Lesson ${scheduleData.lessonNumber}` : undefined,
          startTime: scheduleData.startTime,
          endTime: scheduleData.endTime,
          order: scheduleData.lessonNumber,
        });
        // Don't update schedules.value - the reactive subscription will handle it
        error.value = null;
        return;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update schedule";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteSchedule(id: string) {
      loading.value = true;
      try {
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.educationSchedules.mutations.remove, {
          id: id as any,
        });
        // Don't filter schedules.value - the reactive subscription will handle it
        error.value = null;
        return;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete schedule";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function loadFromBackend() {

      loading.value = true;
      try {
        const data = await convex.query(api.educationSchedules.queries.list, {});
        schedules.value = data.map((s) => ({
          id: s._id,
          lessonNumber: s.order,
          startTime: s.startTime,
          endTime: s.endTime,
          academicYearId: s.academicYearId,
          createdAt: new Date(s.createdAt),
          updatedAt: new Date(s.updatedAt),
        }));
        sortSchedules();
        error.value = null;
      } catch (err) {
        console.error("[educationScheduleStore] Failed to load from Convex:", err);
        error.value = "Failed to load schedules";
      } finally {
        loading.value = false;
      }
    }

    async function copySchedulesFromYear(
      sourceAcademicYearId: string,
      targetAcademicYearId: string
    ) {
      loading.value = true;
      try {
        const sourceSchedules = schedules.value.filter(
          (s) => s.academicYearId === sourceAcademicYearId
        );

        if (sourceSchedules.length === 0) {
          throw new Error("No schedules found in source academic year");
        }

        const existingTargetSchedules = schedules.value.filter(
          (s) => s.academicYearId === targetAcademicYearId
        );

        if (existingTargetSchedules.length > 0) {
          schedules.value = schedules.value.filter(
            (s) => s.academicYearId !== targetAcademicYearId
          );
        }

        const copiedSchedules = sourceSchedules.map((schedule) => ({
          ...schedule,
          id: crypto.randomUUID(),
          academicYearId: targetAcademicYearId,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        schedules.value.push(...copiedSchedules);
        sortSchedules();
        error.value = null;
        return copiedSchedules;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to copy schedules";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      schedules.value = [];
      loading.value = false;
      error.value = null;
      sortSchedules();
    }

    return {
      schedules,
      loading,
      error,
      getScheduleById,
      getSchedules,
      getSchedulesByAcademicYear,
      getActiveYearSchedules,
      isLoading,
      getError,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      copySchedulesFromYear,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
