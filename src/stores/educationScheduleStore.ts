import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAcademicYearStore } from "./academicYearStore";

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

    sortSchedules();

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
        const newSchedule: EducationSchedule = {
          ...scheduleData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        schedules.value.push(newSchedule);
        sortSchedules();
        error.value = null;
        return newSchedule;
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
        const index = schedules.value.findIndex((s) => s.id === id);
        if (index === -1) {
          throw new Error("Schedule not found");
        }

        const updatedSchedule = {
          ...schedules.value[index],
          ...scheduleData,
          updatedAt: new Date(),
        };

        schedules.value[index] = updatedSchedule;
        sortSchedules();
        error.value = null;
        return updatedSchedule;
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
        schedules.value = schedules.value.filter((s) => s.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete schedule";
        throw err;
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
    };
  },
  {
    persist: true,
  }
);
