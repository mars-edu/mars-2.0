import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import { useRupEntryStore } from "./rupEntryStore";
import { useKtpStore } from "./ktpStore";
import { useAcademicYearSemesterStore } from "./academicYearSemesterStore";
import { useUserStore } from "./userStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { withLoading } from "@/utils/storeAction";
import type { WeeklySchedule, JournalSettings, CalendarEvent } from "@/types/calendar";

export const useCalendarStore = defineStore(
  "calendar",
  () => {
    const events = ref<CalendarEvent[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);
    const selectedTeacherId = ref<string | null>(null);

    const userStore = useUserStore();

    /**
     * Fetch events from the backend with JWT-based role access control.
     * The backend validates the JWT token and enforces role-based filtering:
     * - Admins can see all events or filter by selectedTeacherId
     * - Teachers can only see their own events (enforced by backend)
     */
    async function fetchEventsWithRoleAccess() {
      const token = userStore.token;
      if (!token) {
        events.value = [];
        return;
      }
      return await withLoading(loading, error, async () => {
        const data = await convex.action(api.calendarEvents.queries.listWithRoleAccess, {
                  token,
                  selectedTeacherId: selectedTeacherId.value,
                });

                console.log("[calendarStore] Fetched events with role access:", {
                  eventsCount: data.length,
                  firstEventSettings: data[0]?.journalSettings,
                });

                events.value = data.map((event: any) => ({
                  id: event._id,
                  rupEntryId: event.rupEntryId,
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
                  sourceGroupEventId: event.sourceGroupEventId,
                  gradingType: event.gradingType,
                  customTitle: event.customTitle,
                  isClosed: event.isClosed,
                  journalSettings: event.journalSettings,
                  createdAt: new Date(event.createdAt),
                  updatedAt: new Date(event.updatedAt),
                }));
                error.value = null;
        }, "Failed to fetch events");
    }

    // Watch for changes that should trigger a refetch
    watch(
      [() => userStore.token, () => userStore.isAuthenticated, selectedTeacherId],
      ([token, isAuthenticated]) => {
        if (token && isAuthenticated) {
          fetchEventsWithRoleAccess();
        } else {
          events.value = [];
        }
      },
      { immediate: true }
    );

    const getEventById = computed(() => {
      return (id: string) => events.value.find((e) => e.id === id);
    });

    // Events are already filtered at the backend level via queryArgs
    const filteredEvents = computed(() => events.value);
    const rupEntryStore = useRupEntryStore();

    const getEventTitle = (event: CalendarEvent) => {
      const rupEntry = rupEntryStore.getRupEntryById(event.rupEntryId);

      if (!rupEntry || !rupEntry.learningOutcome) return "";

      return `${rupEntry.moduleIndex} ${rupEntry.learningOutcome}`;
    };

    async function addEvent(
      eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
      preGeneratedId?: string
    ) {
      return await withLoading(loading, error, async () => {
        // Create event-specific KTP and link it
                const ktpStore = useKtpStore();
                const academicYearSemesterStore = useAcademicYearSemesterStore();
                const semester = academicYearSemesterStore.academicYearSemesters.find(
                  (s: any) => s.id === eventData.semester
                );

                let ktpId = eventData.ktpId;
                if (semester && semester.academicYearId && !ktpId) {
                  const eventId = preGeneratedId || crypto.randomUUID();
                  const ktp = await ktpStore.ensureKtpForRupEntry(
                    eventData.rupEntryId,
                    semester.academicYearId,
                    eventData.semester,
                    eventId // Link KTP to this specific event
                  );
                  ktpId = ktp.id;
                }

                // Use Convex - the reactive subscription will handle updating the local state
                const id = await convex.mutation(api.calendarEvents.mutations.create, {
                  rupEntryId: eventData.rupEntryId,
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
                  sourceGroupEventId: eventData.sourceGroupEventId,
                  gradingType: eventData.gradingType,
                  customTitle: eventData.customTitle,
                  isClosed: eventData.isClosed,
                  journalSettings: eventData.journalSettings,
                });

                const created = await convex.query(api.calendarEvents.queries.getById, { id });
                if (created) {
                  const mapped: CalendarEvent = {
                    id: created._id,
                    rupEntryId: created.rupEntryId,
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
                    sourceGroupEventId: created.sourceGroupEventId,
                    gradingType: created.gradingType,
                    customTitle: created.customTitle,
                    isClosed: created.isClosed,
                    journalSettings: created.journalSettings,
                    createdAt: new Date(created.createdAt),
                    updatedAt: new Date(created.updatedAt),
                  };
                  // Refresh events list after adding
                  await fetchEventsWithRoleAccess();
                  error.value = null;
                  return mapped;
                }
        }, "Failed to add event");
    }

    async function addEventWithIndividualJournals(
      eventData: Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">,
      gradingType: "combined" | "separate",
      individualJournals: Array<{
        studentIds: string[];
        weeklySchedules: WeeklySchedule[];
      }>,
      preGeneratedId?: string
    ) {
      return await withLoading(loading, error, async () => {
        // Same KTP bootstrap as addEvent
                const ktpStore = useKtpStore();
                const academicYearSemesterStore = useAcademicYearSemesterStore();
                const semester = academicYearSemesterStore.academicYearSemesters.find(
                  (s: any) => s.id === eventData.semester
                );

                let ktpId = eventData.ktpId;
                if (semester && semester.academicYearId && !ktpId) {
                  const eventId = preGeneratedId || crypto.randomUUID();
                  const ktp = await ktpStore.ensureKtpForRupEntry(
                    eventData.rupEntryId,
                    semester.academicYearId,
                    eventData.semester,
                    eventId
                  );
                  ktpId = ktp.id;
                }

                const result = await convex.mutation(
                  api.calendarEvents.mutations.createWithIndividualJournals,
                  {
                    rupEntryId: eventData.rupEntryId,
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
                    gradingType,
                    individualJournals,
                  }
                );

                await fetchEventsWithRoleAccess();
                error.value = null;
                return events.value.find((e) => e.id === result.mainId) ?? null;
        }, "Failed to add event");
    }

    async function updateEvent(
      id: string,
      eventData: Partial<Omit<CalendarEvent, "id" | "createdAt" | "updatedAt">>
    ) {
      return await withLoading(loading, error, async () => {
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

                // If RUP entry ID changed, create new event-specific KTP
                let ktpId = eventData.ktpId;
                if (eventData.rupEntryId && eventData.rupEntryId !== originalEvent.rupEntryId) {
                  const ktpStore = useKtpStore();
                  const academicYearSemesterStore = useAcademicYearSemesterStore();
                  const semesterId = eventData.semester || originalEvent.semester;
                  const semester = academicYearSemesterStore.academicYearSemesters.find(
                    (s: any) => s.id === semesterId
                  );

                  if (semester && semester.academicYearId) {
                    const ktp = await ktpStore.ensureKtpForRupEntry(
                      eventData.rupEntryId,
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
                  rupEntryId: eventData.rupEntryId,
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
                  sourceGroupEventId: eventData.sourceGroupEventId,
                  gradingType: eventData.gradingType,
                  customTitle: eventData.customTitle,
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
                    rupEntryId: updated.rupEntryId,
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
                    sourceGroupEventId: updated.sourceGroupEventId,
                    gradingType: updated.gradingType,
                    customTitle: updated.customTitle,
                    isClosed: updated.isClosed,
                    journalSettings: updated.journalSettings,
                    createdAt: new Date(updated.createdAt),
                    updatedAt: new Date(updated.updatedAt),
                  };
                  // Refresh events list after updating
                  await fetchEventsWithRoleAccess();
                  error.value = null;
                  return mapped;
                }
        }, "Failed to update event");
    }

    async function deleteEvent(id: string) {
      return await withLoading(loading, error, async () => {
        await convex.mutation(api.calendarEvents.mutations.remove, {
                  id: id as any,
                });
                // Refresh events list after deleting
                await fetchEventsWithRoleAccess();
                error.value = null;
        }, "Failed to delete event");
    }

    async function loadFromBackend() {
      return await withLoading(loading, error, async () => {
        const data = await convex.query(api.calendarEvents.queries.list, {});
                events.value = data.map((event) => ({
                  id: event._id,
                  rupEntryId: event.rupEntryId,
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
                  sourceGroupEventId: event.sourceGroupEventId,
                  gradingType: event.gradingType,
                  customTitle: event.customTitle,
                  isClosed: event.isClosed,
                  journalSettings: event.journalSettings,
                  createdAt: new Date(event.createdAt),
                  updatedAt: new Date(event.updatedAt),
                }));
                error.value = null;
        }, "Operation failed");
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
      getEventTitle,
      addEvent,
      addEventWithIndividualJournals,
      updateEvent,
      deleteEvent,
      loadFromBackend,
      fetchEventsWithRoleAccess,
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
