/**
 * Student roster + marks lookup for the journal grid. Extracted from
 * JournalTab.vue (the cohesive, low-coupling part of "Cluster B").
 *
 * Builds the per-student rows (name + marks) from the journal's student ids,
 * the resolved participant records, and the marks store, plus the time-sliced
 * chunked-rendering window. Stores are resolved internally; grid context
 * (current journal, journal id, resolved participants) is passed in.
 *
 * The marks-matrix / rebuild / per-student-update logic stays in the component
 * for now — it is coupled to the not-yet-extracted store-index mapping and
 * session-grade computation.
 */
import { ref, computed, onUnmounted, type Ref } from "vue";
import { useMarksStore } from "@/stores/marksStore";
import { useStudentStore } from "@/stores/studentStore";

interface ResolvedParticipant {
  id: string;
  surname: string;
  firstName: string;
  patronymic: string;
}

export interface UseJournalStudentsOptions {
  currentJournal: Ref<any>;
  journalId: Ref<string>;
  resolvedParticipants: Ref<ResolvedParticipant[] | undefined>;
}

export function useJournalStudents(opts: UseJournalStudentsOptions) {
  const { currentJournal, journalId, resolvedParticipants } = opts;

  const marksStore = useMarksStore();
  const studentStore = useStudentStore();
  const { getStudentFullName } = studentStore;

  const getStudentIdByIndex = (index: number): string | null => {
    if (
      !currentJournal.value?.students ||
      index < 0 ||
      index >= currentJournal.value.students.length
    ) {
      return null;
    }
    return currentJournal.value.students[index];
  };

  const students = computed(() => {
    if (!journalId.value || !currentJournal.value?.students?.length) return [];

    const resolvedById = new Map(
      (resolvedParticipants.value ?? []).map((p) => [p.id, p]),
    );

    // O(1) lookup map for student marks to prevent O(N^2) fetching overhead
    const journalMarksEntry = marksStore.journalMarks[journalId.value];
    const marksMap = new Map();
    if (journalMarksEntry && journalMarksEntry.studentMarks) {
      for (const sm of journalMarksEntry.studentMarks) {
        marksMap.set(sm.studentId, sm.marks);
      }
    }

    return currentJournal.value.students.map(
      (studentId: string, index: number) => {
        const studentMarks = marksMap.get(studentId) || [];
        const resolved = resolvedById.get(studentId);
        const name = resolved
          ? `${resolved.surname} ${resolved.firstName} ${resolved.patronymic}`.trim()
          : getStudentFullName(studentId);
        return {
          id: index + 1,
          name: name === studentId ? "" : name,
          marks: studentMarks,
          studentId: studentId,
        };
      }
    );
  });

  // --- TIME SLICING OPTIMIZATION ---
  const visibleStudentsCount = ref(15);
  const displayedStudents = computed(() => {
    return students.value.slice(0, visibleStudentsCount.value);
  });

  let renderInterval: any = null;
  const startChunkedRendering = () => {
    if (renderInterval) clearInterval(renderInterval);
    renderInterval = setInterval(() => {
      if (visibleStudentsCount.value >= students.value.length) {
        clearInterval(renderInterval);
        return;
      }
      visibleStudentsCount.value += 15;
    }, 50); // Yield thread every 15 students
  };
  // ---------------------------------

  // Cleanup moved here with the interval it owns (was in JournalTab's
  // onUnmounted before extraction).
  onUnmounted(() => {
    if (renderInterval) clearInterval(renderInterval);
  });

  const marksByStudentId = computed(() => {
    const map = new Map<string, any>();
    for (const student of students.value) {
      map.set(student.studentId, student.marks);
    }
    return map;
  });

  return {
    students,
    displayedStudents,
    visibleStudentsCount,
    startChunkedRendering,
    marksByStudentId,
    getStudentIdByIndex,
  };
}
