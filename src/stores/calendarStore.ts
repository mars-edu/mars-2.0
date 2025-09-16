import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useClass9Store } from "./class9Store";

export interface CalendarEvent {
  id: string;
  class9Id: string;
  rup: string;
  file: File | null;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  participants: string[];
  color?: string; // hex color code for the event
  weeklySchedules?: {
    weekId: number;
    startTime?: string;
    endTime?: string;
    startId?: string;
    endId?: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export const useCalendarStore = defineStore(
  "calendar",
  () => {
    const events = ref<CalendarEvent[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const getEventById = computed(() => {
      return (id: string) => events.value.find((e) => e.id === id);
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    const class9Store = useClass9Store();

    const class9Options = computed(() => {
      return class9Store.getAllClass9Items
        .filter(
          (item: any) =>
            item.learningOutcome && item.learningOutcome.trim() !== ""
        )
        .map((item: any) => ({
          value: item.id,
          text: `${item.moduleIndex} ${item.moduleName} - ${item.learningOutcome}`,
          moduleIndex: item.moduleIndex,
          moduleName: item.moduleName,
          learningOutcome: item.learningOutcome,
        }));
    });

    const getEventTitle = (event: CalendarEvent) => {
      const class9Item = class9Store.getClass9ById(event.class9Id);

      if (!class9Item || !class9Item.learningOutcome) return "";

      return `${class9Item.moduleIndex} ${class9Item.learningOutcome}`;
    };

    async function addEvent(
      eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">
    ) {
      loading.value = true;
      try {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        events.value.push(newEvent);
        error.value = null;
        return newEvent;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add event";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateEvent(
      id: string,
      eventData: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>
    ) {
      loading.value = true;
      try {
        const index = events.value.findIndex((e) => e.id === id);
        if (index === -1) {
          throw new Error("Event not found");
        }

        const updatedEvent = {
          ...events.value[index],
          ...eventData,
          updatedAt: new Date(),
        };

        events.value[index] = updatedEvent;
        error.value = null;
        return updatedEvent;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update event";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteEvent(id: string) {
      loading.value = true;
      try {
        events.value = events.value.filter((e) => e.id !== id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete event";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      events.value = [];
      loading.value = false;
      error.value = null;
    }

    return {
      events,
      loading,
      error,
      getEventById,
      isLoading,
      getError,
      class9Options,
      getEventTitle,
      addEvent,
      updateEvent,
      deleteEvent,
      clearError,
      reset,
    };
  },
  {
    persist: true,
  }
);
