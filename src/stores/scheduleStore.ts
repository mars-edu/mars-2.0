import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Lesson, ScheduleState } from "@/types/schedule";

const DEFAULT_SCHEDULE_DATA: Record<string, Lesson[]> = {
  "2025-03-09": [
    {
      id: 1,
      startTime: "09:00",
      endTime: "10:15",
      subject: "История Казахстана",
      group: "2 ВаВэСФ",
      room: "213",
      type: "lecture",
      color: "bg-primary",
    },
    {
      id: 2,
      startTime: "10:30",
      endTime: "11:45",
      subject: "Философия",
      group: "3 РЭХТ",
      room: "101",
      type: "seminar",
      color: "bg-orange-500",
    },
  ],
  "2025-03-10": [
    {
      id: 3,
      startTime: "13:00",
      endTime: "14:15",
      subject: "Культурология",
      group: "1 ИС",
      room: "205",
      type: "lecture",
      color: "bg-purple-500",
    },
    {
      id: 4,
      startTime: "14:30",
      endTime: "15:45",
      subject: "История (Консультация)",
      group: "2 ВаВэСФ",
      room: "Кафедра",
      type: "lab",
      color: "bg-green-500",
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
  }
);
