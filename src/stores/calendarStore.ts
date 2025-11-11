import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useClass9Store } from "./class9Store";
import { useKtpStore } from "./ktpStore";
import { useAcademicYearSemesterStore } from "./academicYearSemesterStore";

export interface WeeklySchedule {
  weekId: number;
  startTime?: string;
  endTime?: string;
  startId?: string;
  endId?: string;
}

export interface CalendarEvent {
  id: string;
  class9Id: string;
  ktpId?: string; // Direct reference to the event's dedicated KTP
  teacherId?: string;
  startDate: string;
  startTime?: string;
  endDate: string;
  endTime?: string;
  participants: string[];
  color?: string;
  semester: string;
  useCustomPeriod: boolean;
  weeklySchedules?: WeeklySchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export const useCalendarStore = defineStore(
  "calendar",
  () => {
    const events = ref<CalendarEvent[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const selectedTeacherId = ref<string | null>(null);

    const getEventById = computed(() => {
      return (id: string) => events.value.find((e) => e.id === id);
    });

    const filteredEvents = computed(() => {
      if (!selectedTeacherId.value) {
        return events.value;
      }
      return events.value.filter(
        (e) => e.teacherId === selectedTeacherId.value
      );
    });

    const isLoading = computed(() => loading.value);
    const getError = computed(() => error.value);

    const class9Store = useClass9Store();

    const getEventTitle = (event: CalendarEvent) => {
      const class9Item = class9Store.getClass9ById(event.class9Id);

      if (!class9Item || !class9Item.learningOutcome) return "";

      return `${class9Item.moduleIndex} ${class9Item.learningOutcome}`;
    };

    async function addEvent(
      eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
      preGeneratedId?: string
    ) {
      loading.value = true;
      try {
        const newEvent: CalendarEvent = {
          ...eventData,
          id: preGeneratedId || crypto.randomUUID(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Create event-specific KTP and link it
        const ktpStore = useKtpStore();
        const academicYearSemesterStore = useAcademicYearSemesterStore();
        const semester = academicYearSemesterStore.academicYearSemesters.find(
          (s: any) => s.id === newEvent.semester
        );

        if (semester && semester.academicYearId) {
          const ktp = ktpStore.ensureKtpForClass9(
            newEvent.class9Id,
            semester.academicYearId,
            newEvent.semester,
            newEvent.id // Link KTP to this specific event
          );
          newEvent.ktpId = ktp.id;
        }

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

        const originalEvent = events.value[index];
        const updatedEvent = {
          ...originalEvent,
          ...eventData,
          updatedAt: new Date(),
        };

        // If class9Id changed, create new event-specific KTP
        if (eventData.class9Id && eventData.class9Id !== originalEvent.class9Id) {
          const ktpStore = useKtpStore();
          const academicYearSemesterStore = useAcademicYearSemesterStore();
          const semesterId = eventData.semester || originalEvent.semester;
          const semester = academicYearSemesterStore.academicYearSemesters.find(
            (s: any) => s.id === semesterId
          );

          if (semester && semester.academicYearId) {
            const ktp = ktpStore.ensureKtpForClass9(
              eventData.class9Id,
              semester.academicYearId,
              semesterId,
              id // Link KTP to this specific event
            );
            updatedEvent.ktpId = ktp.id;
          }
        }

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

    function setSelectedTeacher(teacherId: string | null) {
      selectedTeacherId.value = teacherId;
    }

    function clearError() {
      error.value = null;
    }

    function reset() {
      events.value = [];
      loading.value = false;
      error.value = null;
      selectedTeacherId.value = null;
    }

    return {
      events,
      loading,
      error,
      selectedTeacherId,
      getEventById,
      filteredEvents,
      isLoading,
      getError,
      getEventTitle,
      addEvent,
      updateEvent,
      deleteEvent,
      setSelectedTeacher,
      clearError,
      reset,
    };
  },
  {
    persist: {
      paths: ["events", "loading", "error"],
    },
  }
);
