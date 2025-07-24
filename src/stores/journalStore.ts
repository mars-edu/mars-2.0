import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useCalendarStore } from "./calendarStore";
import { useCourseStore } from "./courseStore";
import { useStudentStore } from "./studentStore";
import { useSpecialtyStore } from "./specialtyStore";

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
  isMixedGroup?: boolean;
}

export const useJournalStore = defineStore(
  "journal",
  () => {
    const journals = ref<Journal[]>([]);
    const loading = ref(false);
    const error = ref<string | null>(null);

    const calendarStore = useCalendarStore();
    const courseStore = useCourseStore();
    const studentStore = useStudentStore();
    const specialtyStore = useSpecialtyStore();

    function generateJournalTitle(courseNumber: number, studentIds: string[]) {
      const codes = new Set<string>();
      studentIds.forEach((id) => {
        const student = studentStore.students.find((s) => s.id === id);
        if (!student) return;

        const specialty = specialtyStore.getSpecialtyByCode(student.specialty);
        if (specialty) {
          codes.add(specialty.codeName);
        } else {
          codes.add(student.specialty);
        }
      });
      const joinedCodes = Array.from(codes).join("");
      return `${courseNumber} ${joinedCodes}`.trim();
    }

    const journalsByCourse = computed(() => {
      const result: Record<number, Journal[]> = {};

      courseStore.courses.forEach((course) => {
        result[parseInt(course.number)] = [];
      });

      calendarStore.events.forEach((event: any) => {
        const actualEvent = event._custom?.value || event;

        // 1. Events WITHOUT participants → placeholder journals for UI
        if (
          !actualEvent.participants ||
          actualEvent.participants.length === 0
        ) {
          // Place the placeholder into the FIRST course (№1)
          const defaultCourseNumber = 1;

          const placeholderJournal: Journal = {
            id: `${actualEvent.id}-${defaultCourseNumber}`,
            title: actualEvent.title || "Журнал",
            courseNumber: defaultCourseNumber,
            disciplineId: actualEvent.rup,
            groupId: "",
            lessonType: actualEvent.title?.toLowerCase().includes("лекция")
              ? "lecture"
              : "practice",
            technology: actualEvent.title?.toLowerCase().includes("онлайн")
              ? "online"
              : "offline",
            status: actualEvent.result ? "active" : "pending",
            students: [],
            isPlaceholder: true,
          };

          result[defaultCourseNumber].push(placeholderJournal);
          return; // Skip further processing for this event
        }

        // 2. Events WITH participants → split by course
        const courseParticipantsMap: Record<number, string[]> = {};
        actualEvent.participants.forEach((studentId: string) => {
          const courseNumber =
            studentStore.getCourseByStudentId(studentId) ?? 1;
          if (!courseParticipantsMap[courseNumber]) {
            courseParticipantsMap[courseNumber] = [];
          }
          courseParticipantsMap[courseNumber].push(studentId);
        });

        const isMixed = Object.keys(courseParticipantsMap).length > 1;

        Object.entries(courseParticipantsMap).forEach(
          ([courseNumberStr, studentsInCourse]) => {
            const courseNumber = parseInt(courseNumberStr);

            if (!result[courseNumber]) result[courseNumber] = [];

            const journal: Journal = {
              id: `${actualEvent.id}-${courseNumber}`,
              title: generateJournalTitle(courseNumber, studentsInCourse),
              courseNumber: courseNumber,
              disciplineId: actualEvent.rup,
              groupId: studentsInCourse.join(", "),
              lessonType: actualEvent.title.toLowerCase().includes("лекция")
                ? "lecture"
                : "practice",
              technology: actualEvent.title.toLowerCase().includes("онлайн")
                ? "online"
                : "offline",
              status: actualEvent.result ? "active" : "pending",
              students: studentsInCourse,
              isMixedGroup: isMixed,
            };

            result[courseNumber].push(journal);
          }
        );
      });

      return result;
    });

    const mixedGroupJournals = computed(() => {
      const mixedJournals: Journal[] = [];

      calendarStore.events.forEach((event: any) => {
        const actualEvent = event._custom?.value || event;

        if (!actualEvent.participants || actualEvent.participants.length === 0)
          return;

        if (hasMixedGroups(actualEvent.participants)) {
          const courseNumbers = actualEvent.participants
            .map((id: string) => studentStore.getCourseByStudentId(id) ?? 1)
            .sort((a: number, b: number) => a - b);

          const primaryCourse = courseNumbers[0] ?? 1;

          const journal: Journal = {
            id: `${actualEvent.id}`,
            title: generateJournalTitle(
              primaryCourse,
              actualEvent.participants
            ),
            courseNumber: primaryCourse,
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
            isMixedGroup: true,
          };

          mixedJournals.push(journal);
        }
      });

      return mixedJournals;
    });

    function hasMixedGroups(participants: string[]): boolean {
      if (!participants || participants.length < 2) return false;

      const courseNumbers = participants
        .map((id) => studentStore.getCourseByStudentId(id))
        .filter((n): n is number => n !== null);

      const uniqueCourses = new Set(courseNumbers);
      return uniqueCourses.size > 1;
    }

    const getJournalById = computed(() => {
      return (id: string) => {
        for (const courseNumber in journalsByCourse.value) {
          const journal = journalsByCourse.value[courseNumber].find(
            (j) => j.id === id || j.id.startsWith(id.split("-")[0])
          );
          if (journal) return journal;
        }

        const event: any = calendarStore.getEventById(id);
        if (event) {
          const actualEvent = event._custom?.value || event;
          let courseNumber = actualEvent.participants?.length
            ? studentStore.getCourseByStudentId(actualEvent.participants[0]) ??
              1
            : 1;

          if (isNaN(courseNumber)) {
            courseNumber = 1;
          }

          return {
            id: actualEvent.id,
            title: generateJournalTitle(
              courseNumber,
              actualEvent.participants || []
            ),
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
        const eventData: any = {};

        if (journalData.title) eventData.title = journalData.title;
        if (journalData.status)
          eventData.result = journalData.status === "active" ? "Активен" : "";
        if (journalData.disciplineId) eventData.rup = journalData.disciplineId;
        if (journalData.students) eventData.participants = journalData.students;

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
      mixedGroupJournals,
      generateJournalTitle,
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
