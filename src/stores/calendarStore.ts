import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useClass9Store } from "./class9Store";
import { useKtpStore } from "./ktpStore";
import { useAcademicYearSemesterStore } from "./academicYearSemesterStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export interface WeeklySchedule {
  weekId: number;
  startTime?: string;
  endTime?: string;
  startId?: string;
  endId?: string;
}

export interface JournalSettings {
  calculationType: "calculated" | "manual";
  calculationMethod: "only-assigned" | "all-days";
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
  isIndividualJournal?: boolean;
  mergedJournalIds?: string[];
  parentIndividualJournalId?: string;
  isClosed?: boolean;
  journalSettings?: JournalSettings;
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

    // Reactive subscription to Convex
    const { data: convexEvents } = useConvexQuery(
      api.calendarEvents.queries.list,
      ref({})
    );

    watch(convexEvents, (newData) => {
      if (newData) {
        console.log("[calendarStore] Reactive subscription update:", {
          eventsCount: newData.length,
          firstEventSettings: newData[0]?.journalSettings,
          firstEventKeys: newData[0] ? Object.keys(newData[0]) : [],
          firstEventFull: newData[0],
        });
        events.value = newData.map((event) => {
          console.log("[calendarStore] Mapping event:", {
            id: event._id,
            hasJournalSettings: 'journalSettings' in event,
            journalSettings: event.journalSettings,
            eventKeys: Object.keys(event),
          });
          return {
            id: event._id,
            class9Id: event.class9Id,
            ktpId: event.ktpId,
            teacherId: event.teacherId,
            startDate: event.startDate,
            startTime: event.startTime,
            endDate: event.endDate,
            endTime: event.endTime,
            participants: event.participants,
            color: event.color,
            semester: event.semester,
            useCustomPeriod: event.useCustomPeriod,
            weeklySchedules: event.weeklySchedules,
            isIndividualJournal: event.isIndividualJournal,
            mergedJournalIds: event.mergedJournalIds,
            parentIndividualJournalId: event.parentIndividualJournalId,
            isClosed: event.isClosed,
            journalSettings: event.journalSettings,
            createdAt: new Date(event.createdAt),
            updatedAt: new Date(event.updatedAt),
          };
        });
      }
    });

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
        // Create event-specific KTP and link it
        const ktpStore = useKtpStore();
        const academicYearSemesterStore = useAcademicYearSemesterStore();
        const semester = academicYearSemesterStore.academicYearSemesters.find(
          (s: any) => s.id === eventData.semester
        );

        let ktpId = eventData.ktpId;
        if (semester && semester.academicYearId && !ktpId) {
          const eventId = preGeneratedId || crypto.randomUUID();
          const ktp = await ktpStore.ensureKtpForClass9(
            eventData.class9Id,
            semester.academicYearId,
            eventData.semester,
            eventId // Link KTP to this specific event
          );
          ktpId = ktp.id;
        }

        // Use Convex - the reactive subscription will handle updating the local state
        const id = await convex.mutation(api.calendarEvents.mutations.create, {
          class9Id: eventData.class9Id,
          ktpId,
          teacherId: eventData.teacherId,
          startDate: eventData.startDate,
          startTime: eventData.startTime,
          endDate: eventData.endDate,
          endTime: eventData.endTime,
          participants: eventData.participants,
          color: eventData.color,
          semester: eventData.semester,
          useCustomPeriod: eventData.useCustomPeriod,
          weeklySchedules: eventData.weeklySchedules,
          isIndividualJournal: eventData.isIndividualJournal,
          mergedJournalIds: eventData.mergedJournalIds,
          parentIndividualJournalId: eventData.parentIndividualJournalId,
          isClosed: eventData.isClosed,
          journalSettings: eventData.journalSettings,
        });

        const created = await convex.query(api.calendarEvents.queries.getById, { id });
        if (created) {
          const mapped: CalendarEvent = {
            id: created._id,
            class9Id: created.class9Id,
            ktpId: created.ktpId,
            teacherId: created.teacherId,
            startDate: created.startDate,
            startTime: created.startTime,
            endDate: created.endDate,
            endTime: created.endTime,
            participants: created.participants,
            color: created.color,
            semester: created.semester,
            useCustomPeriod: created.useCustomPeriod,
            weeklySchedules: created.weeklySchedules,
            isIndividualJournal: created.isIndividualJournal,
            mergedJournalIds: created.mergedJournalIds,
            parentIndividualJournalId: created.parentIndividualJournalId,
            isClosed: created.isClosed,
            journalSettings: created.journalSettings,
            createdAt: new Date(created.createdAt),
            updatedAt: new Date(created.updatedAt),
          };
          // Don't push to events.value - the reactive subscription will handle it
          error.value = null;
          return mapped;
        }
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

        console.log("[calendarStore] updateEvent called:", {
          id,
          eventData,
          hasJournalSettings: !!eventData.journalSettings,
          journalSettings: eventData.journalSettings,
        });

        // If class9Id changed, create new event-specific KTP
        let ktpId = eventData.ktpId;
        if (eventData.class9Id && eventData.class9Id !== originalEvent.class9Id) {
          const ktpStore = useKtpStore();
          const academicYearSemesterStore = useAcademicYearSemesterStore();
          const semesterId = eventData.semester || originalEvent.semester;
          const semester = academicYearSemesterStore.academicYearSemesters.find(
            (s: any) => s.id === semesterId
          );

          if (semester && semester.academicYearId) {
            const ktp = await ktpStore.ensureKtpForClass9(
              eventData.class9Id,
              semester.academicYearId,
              semesterId,
              id // Link KTP to this specific event
            );
            ktpId = ktp.id;
          }
        }

        // Use Convex - the reactive subscription will handle updating the local state
        const updated = await convex.mutation(api.calendarEvents.mutations.update, {
          id: id as any,
          class9Id: eventData.class9Id,
          ktpId,
          teacherId: eventData.teacherId,
          startDate: eventData.startDate,
          startTime: eventData.startTime,
          endDate: eventData.endDate,
          endTime: eventData.endTime,
          participants: eventData.participants,
          color: eventData.color,
          semester: eventData.semester,
          useCustomPeriod: eventData.useCustomPeriod,
          weeklySchedules: eventData.weeklySchedules,
          isIndividualJournal: eventData.isIndividualJournal,
          mergedJournalIds: eventData.mergedJournalIds,
          parentIndividualJournalId: eventData.parentIndividualJournalId,
          isClosed: eventData.isClosed,
          journalSettings: eventData.journalSettings,
        });

        console.log("[calendarStore] Convex mutation result:", {
          updated,
          hasJournalSettings: !!updated?.journalSettings,
          journalSettings: updated?.journalSettings,
        });

        if (updated) {
          const mapped: CalendarEvent = {
            id: updated._id,
            class9Id: updated.class9Id,
            ktpId: updated.ktpId,
            teacherId: updated.teacherId,
            startDate: updated.startDate,
            startTime: updated.startTime,
            endDate: updated.endDate,
            endTime: updated.endTime,
            participants: updated.participants,
            color: updated.color,
            semester: updated.semester,
            useCustomPeriod: updated.useCustomPeriod,
            weeklySchedules: updated.weeklySchedules,
            isIndividualJournal: updated.isIndividualJournal,
            mergedJournalIds: updated.mergedJournalIds,
            parentIndividualJournalId: updated.parentIndividualJournalId,
            isClosed: updated.isClosed,
            journalSettings: updated.journalSettings,
            createdAt: new Date(updated.createdAt),
            updatedAt: new Date(updated.updatedAt),
          };
          // Don't update events.value - the reactive subscription will handle it
          error.value = null;
          return mapped;
        }
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
        // Use Convex - the reactive subscription will handle updating the local state
        await convex.mutation(api.calendarEvents.mutations.remove, {
          id: id as any,
        });
        // Don't filter events.value - the reactive subscription will handle it
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete event";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function loadFromBackend() {
      loading.value = true;
      try {
        const data = await convex.query(api.calendarEvents.queries.list, {});
        events.value = data.map((event) => ({
          id: event._id,
          class9Id: event.class9Id,
          ktpId: event.ktpId,
          teacherId: event.teacherId,
          startDate: event.startDate,
          startTime: event.startTime,
          endDate: event.endDate,
          endTime: event.endTime,
          participants: event.participants,
          color: event.color,
          semester: event.semester,
          useCustomPeriod: event.useCustomPeriod,
          weeklySchedules: event.weeklySchedules,
          isIndividualJournal: event.isIndividualJournal,
          mergedJournalIds: event.mergedJournalIds,
          parentIndividualJournalId: event.parentIndividualJournalId,
          isClosed: event.isClosed,
          journalSettings: event.journalSettings,
          createdAt: new Date(event.createdAt),
          updatedAt: new Date(event.updatedAt),
        }));
        error.value = null;
      } catch (err) {
        console.error("[calendarStore] Failed to load from Convex:", err);
        error.value = "Failed to load calendar events";
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
      loadFromBackend,
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
