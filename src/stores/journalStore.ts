import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useCalendarStore } from "./calendarStore";
import { useCourseStore } from "./courseStore";

export interface Journal {
  id: string;
  title: string;
  courseNumber: number;
  disciplineId: string;
  groupId: string;
  lessonType: string;
  technology: string;
  status: string;
  students: string[];
  isPlaceholder?: boolean;
}

export const useJournalStore = defineStore(
  "journal",
  () => {
    const journals = ref<Journal[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const calendarStore = useCalendarStore();
    const courseStore = useCourseStore();

    const journalsByCourse = computed(() => {
      const result: Record<number, Journal[]> = {};

      // Initialize with empty arrays for each course
      courseStore.courses.forEach((course) => {
        result[parseInt(course.number)] = [];
      });

      // Map calendar events to journals format
      calendarStore.events.forEach((event: any) => {
        const actualEvent = event._custom?.value || event;

        // Extract course number from the event title or participants
        if (actualEvent.participants && actualEvent.participants.length > 0) {
          let courseNumber = parseInt(actualEvent.participants[0].charAt(0));

          if (isNaN(courseNumber)) {
            courseNumber = 1; // Default to course 1 if parsing fails
          }

          if (result[courseNumber]) {
            const journal: Journal = {
              id: actualEvent.id,
              title: actualEvent.title,
              courseNumber: courseNumber,
              disciplineId: actualEvent.rup,
              groupId: actualEvent.participants.join(", "),
              lessonType: actualEvent.title.toLowerCase().includes("лекция")
                ? "lecture"
                : "practice",
              technology: actualEvent.title.toLowerCase().includes("онлайн")
                ? "online"
                : "offline",
              status: actualEvent.result ? "active" : "pending",
              students: actualEvent.participants,
            };

            result[courseNumber].push(journal);
          }
        }
      });

      // Add placeholder journals if needed
      courseStore.courses.forEach((course) => {
        const courseNumber = parseInt(course.number);
        if (result[courseNumber].length === 0) {
          result[courseNumber].push({
            id: `placeholder-${courseNumber}`,
            title: `Журнал для ${courseNumber} курса`,
            courseNumber: courseNumber,
            disciplineId: "",
            groupId: "",
            lessonType: "",
            technology: "",
            status: "",
            students: [],
            isPlaceholder: true,
          });
        }
      });

      return result;
    });

    const getJournalById = computed(() => {
      return (id: string) => {
        // First check in our local journal mappings
        for (const courseNumber in journalsByCourse.value) {
          const journal = journalsByCourse.value[courseNumber].find(
            (j) => j.id === id
          );
          if (journal) return journal;
        }

        // If not found, check if it's a calendar event
        const event: any = calendarStore.getEventById(id);
        if (event) {
          const actualEvent = event._custom?.value || event;
          // Convert to journal format
          let courseNumber = actualEvent.participants?.length
            ? parseInt(actualEvent.participants[0].charAt(0))
            : 1;

          if (isNaN(courseNumber)) {
            courseNumber = 1;
          }

          return {
            id: actualEvent.id,
            title: actualEvent.title,
            courseNumber: courseNumber,
            disciplineId: actualEvent.rup,
            groupId: actualEvent.participants?.join(", ") || "",
            lessonType: actualEvent.title.toLowerCase().includes("лекция")
              ? "lecture"
              : "practice",
            technology: actualEvent.title.toLowerCase().includes("онлайн")
              ? "online"
              : "offline",
            status: actualEvent.result ? "active" : "pending",
            students: actualEvent.participants || [],
          };
        }

        return null;
      };
    });

    async function fetchJournals() {
      loading.value = true;
      try {
        // We'll use the calendar events as our source of journal data
        await calendarStore.fetchEvents();
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to load journals";
      } finally {
        loading.value = false;
      }
    }

    async function addJournal(journalData: Omit<Journal, "id">) {
      loading.value = true;
      try {
        // Convert journal data to calendar event format
        const eventData = {
          title: journalData.title,
          result: journalData.status === "active" ? "Активен" : "",
          rup: journalData.disciplineId,
          file: null,
          startDate: new Date().toISOString().split("T")[0],
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            .toISOString()
            .split("T")[0],
          participants: journalData.students,
        };

        // Add the event to the calendar store
        const newEvent = await calendarStore.addEvent(eventData);
        error.value = null;
        return newEvent.id;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to add journal";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function updateJournal(
      id: string,
      journalData: Partial<Omit<Journal, "id">>
    ) {
      loading.value = true;
      try {
        // Convert journal data to calendar event format
        const eventData: any = {};

        if (journalData.title) eventData.title = journalData.title;
        if (journalData.status)
          eventData.result = journalData.status === "active" ? "Активен" : "";
        if (journalData.disciplineId) eventData.rup = journalData.disciplineId;
        if (journalData.students) eventData.participants = journalData.students;

        // Update the event in the calendar store
        await calendarStore.updateEvent(id, eventData);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to update journal";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function deleteJournal(id: string) {
      loading.value = true;
      try {
        // Delete the event from the calendar store
        await calendarStore.deleteEvent(id);
        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to delete journal";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    function reset() {
      journals.value = [];
      loading.value = false;
      error.value = null;
    }

    return {
      journals,
      loading,
      error,
      journalsByCourse,
      getJournalById,
      fetchJournals,
      addJournal,
      updateJournal,
      deleteJournal,
      reset,
    };
  },
  {
    persist: {
      paths: ["journals"],
    },
  }
);
