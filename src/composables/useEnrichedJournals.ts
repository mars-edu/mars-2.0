import { computed, type Ref } from "vue";
import { useConvexQuery } from "convex-vue";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export type JournalFilterTabId =
  | "all"
  | "course-1"
  | "course-2"
  | "course-3"
  | "course-4"
  | "mixed"
  | "individual";

export interface EnrichedJournalCard {
  id: string;
  _id: Id<"journals">;
  calendarEventId?: string;
  disciplineId: Id<"rupEntries">;
  title: string;
  subtitle: string;
  courseNumber: number;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  isIndividualJournal: boolean;
  isMixedGroup: boolean;
  mergedJournalIds: string[];
  color?: string;
}

export interface UseEnrichedJournalsOptions {
  selectedAcademicYearId: Ref<string | null>;
  selectedSemesterId: Ref<string | null>;
  selectedTeacherId: Ref<string | null>;
  activeFilter: Ref<JournalFilterTabId>;
}

export function useEnrichedJournals(options: UseEnrichedJournalsOptions) {
  const queryArgs = computed(() => ({
    academicYearId: options.selectedAcademicYearId.value
      ? (options.selectedAcademicYearId.value as Id<"academicYears">)
      : undefined,
    semesterId: options.selectedSemesterId.value
      ? (options.selectedSemesterId.value as Id<"academicYearSemesters">)
      : undefined,
    teacherId:
      options.selectedTeacherId.value && options.selectedTeacherId.value !== "all"
        ? options.selectedTeacherId.value
        : undefined,
  }));

  const { data: serverJournals, isPending } = useConvexQuery(
    api.journals.queries.listEnriched,
    queryArgs
  );

  const enrichedCards = computed<EnrichedJournalCard[]>(() => {
    const list = serverJournals.value || [];
    return list.map((j: any) => {
      const courseNum = parseInt(j.course, 10) || 1;
      const title = j.moduleIndex
        ? `${j.moduleIndex} ${j.disciplineName}`.trim()
        : j.disciplineName;
      const subtitle = j.groupName
        ? `${courseNum} курс // ${j.groupName}`
        : `${courseNum} курс`;

      return {
        id: j.calendarEventId || String(j._id),
        _id: j._id,
        calendarEventId: j.calendarEventId,
        disciplineId: j.disciplineId,
        title,
        subtitle,
        courseNumber: courseNum,
        teacherId: j.teacherId,
        teacherName: j.teacherName,
        studentCount: j.studentCount || 0,
        isIndividualJournal: j.isIndividualJournal || false,
        isMixedGroup: j.isMixedGroup || false,
        mergedJournalIds: j.mergedJournalIds || [],
        color: j.color,
      };
    });
  });

  const filteredByTab = computed<EnrichedJournalCard[]>(() => {
    const list = enrichedCards.value;
    const filter = options.activeFilter.value;

    if (filter === "all") {
      return list;
    }
    if (filter === "mixed") {
      return list.filter((j) => j.isMixedGroup);
    }
    if (filter === "individual") {
      return list.filter((j) => j.isIndividualJournal);
    }

    const courseNum = parseInt(filter.split("-")[1], 10);
    return list.filter(
      (j) => !j.isMixedGroup && !j.isIndividualJournal && j.courseNumber === courseNum
    );
  });

  return {
    serverJournals: enrichedCards,
    filteredByTab,
    isPending,
  };
}
