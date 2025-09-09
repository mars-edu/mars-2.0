import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface EducationSchedule {
  id: string;
  lessonNumber: number;
  startTime: string;
  endTime: string;
  academicYearId: string;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SCHEDULES: EducationSchedule[] = [
  {
    id: "1",
    lessonNumber: 1,
    startTime: "08:30",
    endTime: "09:15",
    academicYearId: "1", // Default to first academic year
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    lessonNumber: 2,
    startTime: "09:25",
    endTime: "10:10",
    academicYearId: "1", // Default to first academic year
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    lessonNumber: 3,
    startTime: "10:20",
    endTime: "11:05",
    academicYearId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "4",
    lessonNumber: 4,
    startTime: "11:15",
    endTime: "12:00",
    academicYearId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "5",
    lessonNumber: 5,
    startTime: "12:20",
    endTime: "13:05",
    academicYearId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "6",
    lessonNumber: 6,
    startTime: "13:15",
    endTime: "14:00",
    academicYearId: "1",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const useEducationScheduleStore = defineStore(
  "educationSchedule",
  () => {
    const schedules = ref<EducationSchedule[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const sortSchedules = () => {
      schedules.value.sort((a, b) => a.lessonNumber - b.lessonNumber);
    };

    if (schedules.value.length === 0) {
      schedules.value = DEFAULT_SCHEDULES;
    }
    sortSchedules();

    const getScheduleById = computed(() => {
      return (id: string) => schedules.value.find((s) => s.id === id);
    });

    const getSchedules = computed(() => schedules.value);
    const getSchedulesByAcademicYear = computed(() => {
      return (academicYearId: string) =>
        schedules.value.filter((s) => s.academicYearId === academicYearId);
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

    function clearError() {
      error.value = null;
    }

    function reset() {
      schedules.value = [...DEFAULT_SCHEDULES];
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
      isLoading,
      getError,
      addSchedule,
      updateSchedule,
      deleteSchedule,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
