import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useCalendarStore } from "./calendarStore";
import { useCourseStore } from "./courseStore";
import { useStudentStore } from "./studentStore";
import { useSpecialtyStore } from "./specialtyStore";
import { useClass9Store } from "./class9Store";
import { WEEK_DAYS, DATE_STORAGE_FORMAT } from "@/constants/calendar";
import dayjs from "dayjs";

export interface Journal {
  id: string;
  courseNumber: number;
  disciplineId: string;
  group: string;
  students: string[];
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
    const class9Store = useClass9Store();

    function generateJournalTitle(courseNumber: number, studentIds: string[]) {
      const codeNames = new Set<string>();

      studentIds.forEach((id) => {
        const student = studentStore.students.find((s) => s.id === id);
        if (!student) return;

        const specialty = specialtyStore.getSpecialtyByCode(student.specialty);
        if (specialty?.codeName) {
          codeNames.add(specialty.codeName.trim());
        } else {
        }
      });

      const sortedCodeNames = Array.from(codeNames).sort();
      const mergedCodeNames = sortedCodeNames.join("");

      return `${courseNumber} ${mergedCodeNames}`.trim();
    }

    function generateGroupFromStudents(studentIds: string[]) {
      const codeNames = new Set<string>();

      studentIds.forEach((id) => {
        const student = studentStore.students.find((s) => s.id === id);
        if (!student) return;

        const specialty = specialtyStore.getSpecialtyByCode(student.specialty);
        if (specialty?.codeName) {
          codeNames.add(specialty.codeName.trim());
        }
      });

      const sortedCodeNames = Array.from(codeNames).sort();
      return sortedCodeNames.join("");
    }

    function createJournalFromEvent(
      actualEvent: any,
      courseNumber: number,
      students: string[],
      isMixed = false
    ): Journal {
      return {
        id: `${actualEvent.id}`,
        courseNumber,
        disciplineId: actualEvent.class9Id,
        group: generateJournalTitle(courseNumber, students),
        students,
        isMixedGroup: isMixed,
      };
    }

    const journalsByCourse = computed(() => {
      const result: Record<number, Journal[]> = {};

      courseStore.courses.forEach((course) => {
        result[parseInt(course.number)] = [];
      });

      calendarStore.events.forEach((event: any) => {
        const actualEvent = event._custom?.value || event;

        // Only process events WITH participants
        if (
          !actualEvent.participants ||
          actualEvent.participants.length === 0
        ) {
          return; // Skip events without participants
        }

        // Events WITH participants → split by course
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

            const journal = createJournalFromEvent(
              actualEvent,
              courseNumber,
              studentsInCourse,
              isMixed
            );

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

          mixedJournals.push(
            createJournalFromEvent(
              actualEvent,
              primaryCourse,
              actualEvent.participants || [],
              true
            )
          );
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

          return createJournalFromEvent(
            actualEvent,
            courseNumber,
            actualEvent.participants || [],
            false
          );
        }

        return null;
      };
    });

    async function addJournal(journalData: Omit<Journal, "id">) {
      loading.value = true;
      try {
        const eventData = {
          class9Id: journalData.disciplineId,
          rup: "",
          file: null,
          startDate: dayjs().format(DATE_STORAGE_FORMAT),
          endDate: dayjs().add(30, "day").format(DATE_STORAGE_FORMAT),
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

        if (journalData.disciplineId)
          eventData.class9Id = journalData.disciplineId;
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

    function getDisciplineTitle(journal: Journal) {
      const item = class9Store.getClass9ById(journal.disciplineId as any);
      if (!item)
        return generateJournalTitle(
          journal.courseNumber,
          journal.students || []
        );
      const outcome = item.learningOutcome?.trim() || "";
      const index = item.moduleIndex?.trim() || "";
      const result = `${index} ${outcome}`.trim();
      return result;
    }

    function getJournalSubtitle(journal: Journal) {
      return `${journal.courseNumber} курс // ${generateJournalTitle(
        journal.courseNumber,
        journal.students
      )}`;
    }

    function getJournalScheduleText(journal: Journal) {
      const calendarEvent = calendarStore.getEventById(journal.id);
      if (!calendarEvent) return "расписание не задано";
      const ws = calendarEvent.weeklySchedules?.[0];
      if (!ws) return "расписание не задано";
      const weekDay = WEEK_DAYS.find((day) => day.weekId === ws.weekId);
      const day = weekDay?.russianAbbreviation || "";
      const start = ws.startTime || "";
      const end = ws.endTime || "";
      return `${day} // ${start}-${end}`.trim();
    }

    function getJournalPercent(journal: Journal) {
      return 25;
    }

    function getJournalTitle(journal: Journal) {
      if (!journal.students || journal.students.length === 0) {
        return `Журнал курса ${journal.courseNumber}`;
      }
      return generateJournalTitle(journal.courseNumber, journal.students || []);
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
      generateGroupFromStudents,
      getDisciplineTitle,
      getJournalSubtitle,
      getJournalScheduleText,
      getJournalPercent,
      getJournalTitle,
      getJournalById,
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
