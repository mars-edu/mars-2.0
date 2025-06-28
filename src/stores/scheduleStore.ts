import { defineStore } from "pinia";
import { ref, computed } from "vue";

export interface Lesson {
  startTime: string;
  endTime: string;
  subject: string;
  room: string;
}

export interface ScheduleState {
  selectedDate: Date;
  scheduleData: Record<string, Lesson[]>;
}

const DEFAULT_SCHEDULE_DATA: Record<string, Lesson[]> = {
  "2025-03-09": [
    {
      startTime: "8:00",
      endTime: "9:35",
      subject: "История Казахстана",
      room: "305 каб.",
    },
    {
      startTime: "9:45",
      endTime: "11:20",
      subject: "Всемирная история",
      room: "205 каб.",
    },
    {
      startTime: "11:30",
      endTime: "13:05",
      subject: "Всемирная история",
      room: "404 каб.",
    },
    {
      startTime: "13:15",
      endTime: "14:50",
      subject: "Всемирная история",
      room: "404 каб.",
    },
  ],
  "2025-03-10": [
    {
      startTime: "8:00",
      endTime: "9:35",
      subject: "Культорология",
      room: "101 каб.",
    },
    {
      startTime: "9:45",
      endTime: "11:20",
      subject: "История Казахстана",
      room: "302 каб.",
    },
  ],
};

export const useScheduleStore = defineStore(
  "schedule",
  () => {
    const selectedDate = ref(new Date());
    const scheduleData = ref<Record<string, Lesson[]>>({
      ...DEFAULT_SCHEDULE_DATA,
    });

    const formattedSelectedDate = computed(() => {
      const date = selectedDate.value;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    });

    const selectedDateSchedule = computed((): Lesson[] => {
      if (!selectedDate.value) return [];
      const date = new Date(selectedDate.value);
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return scheduleData.value[formattedDate] || [];
    });

    function setSelectedDate(date: Date) {
      selectedDate.value = date;
    }

    function updateSchedule(date: Date, lessons: Lesson[]) {
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      scheduleData.value[formattedDate] = lessons;
    }

    function reset() {
      selectedDate.value = new Date();
      scheduleData.value = { ...DEFAULT_SCHEDULE_DATA };
    }

    return {
      selectedDate,
      scheduleData,
      formattedSelectedDate,
      selectedDateSchedule,
      setSelectedDate,
      updateSchedule,
      reset,
    };
  },
  {
    persist: {
      paths: ["scheduleData"],
    },
    serverSync: {
      enabled: false,
    },
  }
);
