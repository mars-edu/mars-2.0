import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useAcademicYearStore } from "./academicYearStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";
import { withLoading } from "@/utils/storeAction";

export interface EducationSchedule {
  id: string;
  lessonNumber: number;
  startTime: string;
  endTime: string;
  academicYearId: string;
  semesterId: string;
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
          semesterId: s.semesterId,
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

    const getSchedulesBySemester = computed(() => {
      return (semesterId: string) =>
        schedules.value.filter((s) => s.semesterId === semesterId);
    });

    const getActiveYearSchedules = computed(() => {
      const activeYear = academicYearStore.getActiveAcademicYear;
      if (!activeYear) return [];
      return schedules.value
        .filter((s) => s.academicYearId === activeYear.id)
        .sort((a, b) => a.lessonNumber - b.lessonNumber);
    });

    async function addSchedule(
      scheduleData: Omit<EducationSchedule, "id" | "createdAt" | "updatedAt" | "lessonNumber">
    ) {
      return await withLoading(loading, error, async () => {
        const currentSchedules = getSchedulesByAcademicYear.value(scheduleData.academicYearId);
                const nextLessonNumber = currentSchedules.length > 0 
                  ? Math.max(...currentSchedules.map(s => s.lessonNumber)) + 1 
                  : 1;

                // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.educationSchedules.mutations.create, {
                  name: `Lesson ${nextLessonNumber}`,
                  startTime: scheduleData.startTime,
                  endTime: scheduleData.endTime,
                  order: nextLessonNumber,
                  academicYearId: scheduleData.academicYearId,
                  semesterId: scheduleData.semesterId,
                });
                // Don't push to schedules.value - the reactive subscription will handle it
                error.value = null;
                return;
        }, "Failed to add schedule");
    }

    async function updateSchedule(
      id: string,
      scheduleData: Partial<
        Omit<EducationSchedule, "id" | "createdAt" | "updatedAt">
      >
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.educationSchedules.mutations.update, {
                  id: id as any,
                  name: scheduleData.lessonNumber ? `Lesson ${scheduleData.lessonNumber}` : undefined,
                  startTime: scheduleData.startTime,
                  endTime: scheduleData.endTime,
                  order: scheduleData.lessonNumber,
                  semesterId: scheduleData.semesterId,
                });
                // Don't update schedules.value - the reactive subscription will handle it
                error.value = null;
                return;
        }, "Failed to update schedule");
    }

    async function deleteSchedule(id: string) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.educationSchedules.mutations.remove, {
                  id: id as any,
                });
                // Don't filter schedules.value - the reactive subscription will handle it
                error.value = null;
                return;
        }, "Failed to delete schedule");
    }

    async function reorderSchedules(newOrderIds: string[]) {
      // Optimistically update the local state to match the new order immediately
      const currentActiveSchedules = [...getActiveYearSchedules.value];
      
      // We map the incoming new order of IDs to orders 1, 2, 3...
      const updates = newOrderIds.map((id, index) => {
        const schedule = currentActiveSchedules.find(s => s.id === id);
        if (schedule) {
          schedule.lessonNumber = index + 1;
        }
        return {
          id: id as any,
          order: index + 1,
        };
      });

      // Update the main schedules value for optimistic UI update
      sortSchedules();

      try {
        // Dispatch to convex
        await convex.mutation(api.educationSchedules.mutations.reorder, {
          updates,
        });
        error.value = null;
      } catch (err) {
        error.value = err instanceof Error ? err.message : "Failed to reorder schedules";
        // Let the reactive subscription from Convex revert any optimistic update
        throw err;
      }
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.educationSchedules.queries.list, {});
                schedules.value = data.map((s) => ({
                  id: s._id,
                  lessonNumber: s.order,
                  startTime: s.startTime,
                  endTime: s.endTime,
                  academicYearId: s.academicYearId,
                  semesterId: s.semesterId,
                  createdAt: new Date(s.createdAt),
                  updatedAt: new Date(s.updatedAt),
                }));
                sortSchedules();
                error.value = null;
        }, "Operation failed");
    }

    async function copySchedulesFromYear(
      sourceAcademicYearId: string,
      targetAcademicYearId: string
    ) {
      return await withLoading(loading, error, async () => {
        // Use Convex - the reactive subscription will handle updating the local state
                await convex.mutation(api.educationSchedules.mutations.copySchedulesFromYear, {
                  sourceAcademicYearId,
                  targetAcademicYearId,
                });
                error.value = null;
                return;
        }, "Failed to copy schedules");
    }

    async function copySchedulesFromSemester(
      sourceSemesterId: string,
      targetSemesterId: string,
      targetAcademicYearId: string
    ) {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.educationSchedules.mutations.copySchedulesFromSemester, {
          sourceSemesterId: sourceSemesterId as any,
          targetSemesterId: targetSemesterId as any,
          targetAcademicYearId,
        });
        error.value = null;
        return;
      }, "Failed to copy schedules from semester");
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
      getSchedulesBySemester,
      getActiveYearSchedules,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      reorderSchedules,
      copySchedulesFromYear,
      copySchedulesFromSemester,
      clearError,
      reset,
      loadFromBackend,
    };
  },
  {
    persist: true,
  }
);
