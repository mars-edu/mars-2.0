import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useCalendarStore } from "./calendarStore";
import { useCourseStore } from "./courseStore";
import { useStudentStore } from "./studentStore";
import { useSpecialtyStore } from "./specialtyStore";
import { useLanguageStore } from "./languageStore";
import { useRupEntryStore } from "./rupEntryStore";
import { useAcademicYearSemesterStore } from "./academicYearSemesterStore";
import { useEducationScheduleStore } from "./educationScheduleStore";
import { getWeekDays, DATE_STORAGE_FORMAT } from "@/constants/calendar";
import dayjs from "dayjs";

export interface Journal {
  id: string;
  courseNumber: number;
  disciplineId: string;
  group: string;
  students: string[];
  isMixedGroup?: boolean;
  isIndividualJournal?: boolean;
  mergedJournalIds?: string[];
  parentIndividualJournalId?: string;
  sourceGroupEventId?: string;
  customTitle?: string;
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
    const languageStore = useLanguageStore();
    const rupEntryStore = useRupEntryStore();
    const academicYearSemesterStore = useAcademicYearSemesterStore();
    const educationScheduleStore = useEducationScheduleStore();

    function getLanguageNameByCode(code: string): string {
      const found = languageStore.languages.find((l) => l.code === code);
      return found?.name || code;
    }

    function getJournalGroupLanguage(journal: Journal): string {
      const codes = (journal.students || [])
        .map((id) => studentStore.getStudentById(id)?.language || "")
        .filter((code): code is string => Boolean(code));

      const uniqueCodes = Array.from(new Set(codes)).sort();
      if (uniqueCodes.length === 0) return "—";

      return uniqueCodes.map(getLanguageNameByCode).join(" / ");
    }

    function generateJournalTitle(
      courseNumbers: number[],
      studentIds: string[]
    ) {
      const codeNames = new Set<string>();

      studentIds.forEach((id) => {
        const student = studentStore.students.find((s) => s.id === id);
        if (!student) return;

        const specialty = specialtyStore.getSpecialtyById(student.specialty);
        if (specialty?.codeName) {
          codeNames.add(specialty.codeName.trim());
        }
      });

      const sortedCodeNames = Array.from(codeNames).sort();
      const mergedCodeNames = sortedCodeNames.join("");

      // Generate course display
      const uniqueCourses = Array.from(new Set(courseNumbers)).sort(
        (a, b) => a - b
      );

      let courseDisplay: string;
      if (uniqueCourses.length > 1) {
        // Check if consecutive for range format
        const isConsecutive = uniqueCourses.every(
          (num, idx) => idx === 0 || num === uniqueCourses[idx - 1] + 1
        );
        courseDisplay = isConsecutive
          ? `${uniqueCourses[0]}-${uniqueCourses[uniqueCourses.length - 1]}`
          : uniqueCourses.join(", ");
      } else {
        courseDisplay = uniqueCourses[0]?.toString() || "";
      }

      return `${courseDisplay} ${mergedCodeNames}`.trim();
    }

    function generateGroupFromStudents(studentIds: string[]) {
      const codeNames = new Set<string>();

      studentIds.forEach((id) => {
        const student = studentStore.students.find((s) => s.id === id);
        if (!student) return;

        const specialty = specialtyStore.getSpecialtyById(student.specialty);
        if (specialty?.codeName) {
          codeNames.add(specialty.codeName.trim());
        }
      });

      const sortedCodeNames = Array.from(codeNames).sort();
      return sortedCodeNames.join("");
    }

    function createJournalFromEvent(
      actualEvent: any,
      courseNumbers: number[],
      students: string[],
      isMixed = false
    ): Journal {
      return {
        id: `${actualEvent.id}`,
        courseNumber: courseNumbers[0] || 1, // Primary course for sorting/filtering
        disciplineId: actualEvent.rupEntryId,
        group: generateJournalTitle(courseNumbers, students),
        students,
        isMixedGroup: isMixed,
      };
    }

    const journalsByCourse = computed(() => {
      const result: Record<number, Journal[]> = {};

      courseStore.courses.forEach((course) => {
        result[parseInt(course.number)] = [];
      });

      calendarStore.filteredEvents.forEach((event: any) => {
        const actualEvent = event._custom?.value || event;

        // Skip journals that are part of a merge
        if (actualEvent.parentIndividualJournalId) {
          return;
        }

        // Skip unmerged individual journals (they belong strictly in the Individual tab)
        if (actualEvent.isIndividualJournal && (!actualEvent.mergedJournalIds || actualEvent.mergedJournalIds.length === 0)) {
          return;
        }

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
              [courseNumber],
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

      calendarStore.filteredEvents.forEach((event: any) => {
        const actualEvent = event._custom?.value || event;

        // Skip journals that are part of a merge
        if (actualEvent.parentIndividualJournalId) {
          return;
        }

        // Skip unmerged individual journals (they belong strictly in the Individual tab)
        if (actualEvent.isIndividualJournal && (!actualEvent.mergedJournalIds || actualEvent.mergedJournalIds.length === 0)) {
          return;
        }

        if (!actualEvent.participants || actualEvent.participants.length === 0)
          return;

        if (hasMixedGroups(actualEvent.participants)) {
          const courseNumbers = actualEvent.participants
            .map((id: string) => studentStore.getCourseByStudentId(id) ?? 1)
            .sort((a: number, b: number) => a - b);

          // Get unique course numbers for mixed group
          const uniqueCourses = Array.from(new Set(courseNumbers)).sort(
            (a, b) => a - b
          );

          mixedJournals.push(
            createJournalFromEvent(
              actualEvent,
              uniqueCourses,
              actualEvent.participants || [],
              true
            )
          );
        }
      });

      return mixedJournals;
    });

    const individualJournals = computed(() => {
      const result: Journal[] = [];

      calendarStore.filteredEvents.forEach((event: any) => {
        const actualEvent = event._custom?.value || event;

        // Only include events marked as individual journals
        if (!actualEvent.isIndividualJournal) return;

        // Skip joined/merged individual journals (they should appear in Mixed or Course tabs)
        if (actualEvent.mergedJournalIds && actualEvent.mergedJournalIds.length > 0) return;

        if (!actualEvent.participants || actualEvent.participants.length === 0)
          return;

        const courseNumbers = actualEvent.participants
          .map((id: string) => studentStore.getCourseByStudentId(id) ?? 1)
          .filter((num): num is number => num !== null);

        const uniqueCourses = Array.from(new Set(courseNumbers)).sort(
          (a, b) => a - b
        );

        const journal = createJournalFromEvent(
          actualEvent,
          uniqueCourses,
          actualEvent.participants || [],
          false
        );

        journal.isIndividualJournal = true;
        journal.mergedJournalIds = actualEvent.mergedJournalIds || [];
        journal.sourceGroupEventId = actualEvent.sourceGroupEventId;
        journal.customTitle = actualEvent.customTitle;

        result.push(journal);
      });

      return result;
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
        // Check individual/merged journals first
        const indJournal = individualJournals.value.find((j) => j.id === id);
        if (indJournal) return indJournal;

        // Check mixed group journals to get all students
        const mixedJournal = mixedGroupJournals.value.find((j) => j.id === id);
        if (mixedJournal) return mixedJournal;

        // Then check course-specific journals
        for (const courseNumber in journalsByCourse.value) {
          const journal = journalsByCourse.value[courseNumber].find(
            (j) => j.id === id
          );
          if (journal) return journal;
        }

        // Fallback: create from event if not found in computed lists
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
            [courseNumber],
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
        const activeSemester = academicYearSemesterStore.getActiveAcademicYearSemester;

        const eventData = {
          rupEntryId: journalData.disciplineId,
          startDate: dayjs().format(DATE_STORAGE_FORMAT),
          endDate: dayjs().add(30, "day").format(DATE_STORAGE_FORMAT),
          participants: journalData.students,
          semester: activeSemester?.id || "",
          useCustomPeriod: false,
          weeklySchedules: [],
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

    async function mergeJournals(journalIds: string[], customTitle?: string) {
      loading.value = true;
      try {
        const journalsToMerge = journalIds
          .map((id) => getJournalById.value(id))
          .filter((j): j is Journal => !!j);

        if (journalsToMerge.length === 0) return;

        // Collect all unique students
        const allStudents = [
          ...new Set(journalsToMerge.flatMap((j) => j.students)),
        ];

        // Take discipline and other props from the first journal
        const firstJournal = journalsToMerge[0];
        const event = calendarStore.getEventById(firstJournal.id);
        if (!event) throw new Error("Source event not found");

        const newEvent = await calendarStore.addEvent({
          rupEntryId: firstJournal.disciplineId,
          participants: allStudents,
          semester: event.semester,
          isIndividualJournal: true,
          mergedJournalIds: journalIds,
          customTitle: customTitle || undefined,
          teacherId: event.teacherId,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          weeklySchedules: event.weeklySchedules || [],
          useCustomPeriod: event.useCustomPeriod,
          color: event.color,
        });

        // Update children with parent ID
        await Promise.all(
          journalIds.map((id) =>
            calendarStore.updateEvent(id, {
              parentIndividualJournalId: newEvent.id,
            })
          )
        );

        error.value = null;
        return newEvent.id;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to merge journals";
        throw err;
      } finally {
        loading.value = false;
      }
    }

    async function splitJournal(id: string) {
      loading.value = true;
      try {
        const journal = getJournalById.value(id);
        if (!journal || !journal.mergedJournalIds) return;

        // Clear parent reference on children
        await Promise.all(
          journal.mergedJournalIds.map((childId) =>
            calendarStore.updateEvent(childId, {
              parentIndividualJournalId: undefined,
            })
          )
        );

        // Delete the merged journal
        await calendarStore.deleteEvent(id);

        error.value = null;
      } catch (err) {
        error.value =
          err instanceof Error ? err.message : "Failed to split journal";
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
          eventData.rupEntryId = journalData.disciplineId;
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
      if (journal.customTitle) return journal.customTitle;
      const item = rupEntryStore.getRupEntryById(journal.disciplineId as any);
      if (!item)
        return generateJournalTitle(
          [journal.courseNumber],
          journal.students || []
        );
      const outcome = item.learningOutcome?.trim() || "";
      const index = item.moduleIndex?.trim() || "";
      const result = `${index} ${outcome}`.trim();
      return result;
    }

    function getJournalSubtitle(journal: Journal) {
      // Extract course numbers from students
      const courseNumbers = journal.students.length > 0
        ? journal.students
            .map((id) => studentStore.getCourseByStudentId(id) ?? 1)
            .filter((num): num is number => num !== null)
        : [journal.courseNumber];

      const uniqueCourses = Array.from(new Set(courseNumbers)).sort(
        (a, b) => a - b
      );

      const courseDisplay =
        uniqueCourses.length > 1
          ? `${uniqueCourses[0]}-${uniqueCourses[uniqueCourses.length - 1]}`
          : uniqueCourses[0]?.toString() || journal.courseNumber.toString();

      return `${courseDisplay} курс // ${generateJournalTitle(
        uniqueCourses,
        journal.students
      )}`;
    }

    function getJournalScheduleText(journal: Journal) {
      const calendarEvent = calendarStore.getEventById(journal.id);
      if (!calendarEvent) return "расписание не задано";

      // Check for weeklySchedules first
      const ws = calendarEvent.weeklySchedules?.[0];
      if (ws) {
        const weekDay = getWeekDays().find((day) => day.weekId === ws.weekId);
        const day = weekDay?.abbreviation || "";

        // Get start and end times - either from direct time strings or by looking up schedule IDs
        let start = ws.startTime || "";
        let end = ws.endTime || "";

        // If times are not directly stored, look them up by ID
        if (!start && ws.startId) {
          const schedule = educationScheduleStore.getScheduleById(ws.startId);
          start = schedule?.startTime || "";
        }
        if (!end && ws.endId) {
          const schedule = educationScheduleStore.getScheduleById(ws.endId);
          end = schedule?.endTime || "";
        }

        if (start || end) {
          return `${day} // ${start}-${end}`.trim();
        }
      }

      // Fallback to direct startTime/endTime if weeklySchedules not present
      const start = calendarEvent.startTime || "";
      const end = calendarEvent.endTime || "";

      if (!start && !end) {
        return "расписание не задано";
      }

      // Get day of week from startDate
      const startDate = dayjs(calendarEvent.startDate, DATE_STORAGE_FORMAT);
      // Get JavaScript day (0=Sunday, 1=Monday, etc.) and convert to weekId (0=Monday, 1=Tuesday, etc.)
      const jsDay = startDate.day();
      const weekId = jsDay === 0 ? 6 : jsDay - 1; // Convert Sunday from 0 to 6, and shift others down by 1
      const weekDay = getWeekDays().find((day) => day.weekId === weekId);
      const day = weekDay?.abbreviation || "";

      return `${day} // ${start}-${end}`.trim();
    }

    function getJournalPercent(journal: Journal) {
      return 25;
    }

    function getJournalTitle(journal: Journal) {
      if (!journal.students || journal.students.length === 0) {
        return `Журнал курса ${journal.courseNumber}`;
      }
      return generateJournalTitle([journal.courseNumber], journal.students || []);
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
      individualJournals,
      generateJournalTitle,
      generateGroupFromStudents,
      getDisciplineTitle,
      getJournalSubtitle,
      getJournalGroupLanguage,
      getJournalScheduleText,
      getJournalPercent,
      getJournalTitle,
      getJournalById,
      addJournal,
      mergeJournals,
      splitJournal,
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
