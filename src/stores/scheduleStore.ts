import { defineStore } from "pinia";

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

const DEFAULT_SCHEDULE_DATA = {
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

export const useScheduleStore = defineStore("schedule", {
  state: (): ScheduleState => ({
    selectedDate: new Date(),
    scheduleData: { ...DEFAULT_SCHEDULE_DATA },
  }),

  getters: {
    // Format date as YYYY-MM-DD for lookup
    formattedSelectedDate: (state) => {
      const date = state.selectedDate;
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`;
    },

    // Get schedule for the selected date
    selectedDateSchedule: (state): Lesson[] => {
      if (!state.selectedDate) return [];
      const date = new Date(state.selectedDate);
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return state.scheduleData[formattedDate] || [];
    },
  },

  actions: {
    // Set the selected date
    setSelectedDate(date: Date) {
      this.selectedDate = date;
    },

    // Add or update schedule for a specific date
    updateSchedule(date: Date, lessons: Lesson[]) {
      const formattedDate = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      this.scheduleData[formattedDate] = lessons;
    },

    // Reset the store to its initial state
    reset() {
      this.selectedDate = new Date();
      this.scheduleData = { ...DEFAULT_SCHEDULE_DATA };
    },
  },
});
