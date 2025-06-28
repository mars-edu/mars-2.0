import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useClass9Store } from "./class9Store";

export interface CalendarEvent {
  id: string;
  title: string;
  result: string;
  rup: string;
  file: File | null;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  participants: string[];
  weeklySchedules?: {
    weekId: number;
    startTime: string;
    endTime: string;
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

    const moduleOptions = computed(() => {
      return class9Store.getAllModulesAndOutcomes.modules;
    });

    const learningOutcomeOptions = computed(() => {
      return class9Store.getAllModulesAndOutcomes.outcomes;
    });

    async function fetchEvents() {
      loading.value = true;
      try {
        // Mock async operation
        await new Promise((res) => setTimeout(res, 500));
        // In a real app, you'd fetch from an API
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load events";
      } finally {
        loading.value = false;
      }
    }

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
      moduleOptions,
      learningOutcomeOptions,
      fetchEvents,
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
