import { defineStore } from "pinia";
import { ref, shallowRef, computed, triggerRef } from "vue";
import type { Mark, StudentMark, JournalMarks } from "@/types/marks";
import { useUserStore } from "./userStore";
import { convex } from "@/lib/convexClient";
import type { Id } from "@convex/_generated/dataModel";
import { api } from "@convex/_generated/api";
import {
  buildJournalMarksMatrix,
} from "@/lib/marksTemplateBuilder";
import {
  mergeBackendMarksIntoTemplate,
} from "@/lib/marksDataTransformer";
import {
  syncToParentJournals,
  syncToMainJournal,
} from "@/services/marksJournalSync";

export const useMarksStore = defineStore(
  "marks",
  () => {
    const journalMarks = shallowRef<Record<string, JournalMarks>>({});
    const backendJournalIdByCalendarEventId = ref<Record<string, string>>({});
    const loading = ref(false);
    const error = ref<string | null>(null);
    const initializedJournals = ref<Set<string>>(new Set());

    const cacheBackendJournalId = (calendarEventId: string, journalId: string) => {
      backendJournalIdByCalendarEventId.value = {
        ...backendJournalIdByCalendarEventId.value,
        [calendarEventId]: journalId,
      };
    };

    const resolveBackendJournalId = async (
      calendarEventId: string
    ): Promise<string | null> => {
      if (!calendarEventId) return null;
      const cached = backendJournalIdByCalendarEventId.value[calendarEventId];
      if (cached) return cached;

      try {
        const journal = await convex.query(api.journals.queries.getByCalendarEvent, {
          calendarEventId,
        });
        const journalId = journal?._id ? String(journal._id) : null;
        if (journalId) {
          cacheBackendJournalId(calendarEventId, journalId);
          return journalId;
        }
      } catch (err) {
        console.warn("[marksStore] Failed to resolve backend journal ID:", err);
      }

      return null;
    };

    const ensureBackendJournalId = async (
      calendarEventId: string
    ): Promise<string | null> => {
      const existing = await resolveBackendJournalId(calendarEventId);
      if (existing) return existing;

      try {
        const { useJournalStore } = await import("./journalStore");
        const { useCalendarStore } = await import("./calendarStore");
        const { useRupEntryStore } = await import("./rupEntryStore");
        const { useAcademicYearSemesterStore } = await import("./academicYearSemesterStore");

        const journalStore = useJournalStore();
        const calendarStore = useCalendarStore();
        const rupEntryStore = useRupEntryStore();
        const academicYearSemesterStore = useAcademicYearSemesterStore();

        const journalInfo = journalStore.getJournalById(calendarEventId);
        const event = calendarStore.getEventById(calendarEventId);

        if (!journalInfo) return null;

        const semesterId = event?.semester ? String(event.semester) : null;
        const semester = semesterId
          ? academicYearSemesterStore.getAcademicYearSemesterById(semesterId)
          : null;
        const academicYearId =
          semester?.academicYearId ||
          rupEntryStore.getRupEntryById(journalInfo.disciplineId)?.academicYearId ||
          "";

        if (!semesterId || !academicYearId) return null;

        const ok = await initializeJournalBackend(
          calendarEventId,
          journalInfo.disciplineId,
          journalInfo.group,
          academicYearId,
          semesterId,
          journalInfo.students
        );

        if (ok) {
          return await resolveBackendJournalId(calendarEventId);
        }
      } catch (err) {
        console.warn("[marksStore] Failed to auto-initialize backend journal:", err);
      }

      return null;
    };

    const preloadPromiseCache = ref<Record<string, Promise<any>>>({});

    const preloadJournalMarks = (journalId: string) => {
      if (journalId in preloadPromiseCache.value) return;

      const promise = (async () => {
        try {
          const backendJournalId = await ensureBackendJournalId(journalId);
          if (!backendJournalId) return null;

          const result = await convex.query(api.marks.queries.getJournalMarks, {
            journalId: backendJournalId as Id<"journals">,
          });
          return result;
        } catch (err) {
          console.warn("[marksStore] Preload failed for journal:", journalId, err);
          return null;
        }
      })();

      preloadPromiseCache.value = {
        ...preloadPromiseCache.value,
        [journalId]: promise,
      };
    };

    const loadJournalMarks = async (journalId: string): Promise<boolean> => {
      try {
        loading.value = true;
        error.value = null;

        let result = null;
        if (journalId in preloadPromiseCache.value) {
          result = await preloadPromiseCache.value[journalId];
          delete preloadPromiseCache.value[journalId];
        } else {
          const backendJournalId = await ensureBackendJournalId(journalId);
          if (!backendJournalId) {
            loading.value = false;
            return false;
          }

          result = await convex.query(api.marks.queries.getJournalMarks, {
            journalId: backendJournalId as Id<"journals">,
          });
        }

        if (!result) {
          loading.value = false;
          return false;
        }

        const existingJournal = journalMarks.value[journalId];
        if (!existingJournal) {
          loading.value = false;
          return false;
        }

        const hasChanges = mergeBackendMarksIntoTemplate(existingJournal, result.marks);
        if (hasChanges) {
          triggerRef(journalMarks);
          journalMarks.value = { ...journalMarks.value };
        }

        loading.value = false;
        return true;
      } catch (err) {
        console.error("[marksStore] Error loading journal marks:", err);
        error.value = "Failed to load marks";
        loading.value = false;
        return false;
      }
    };

    const initializeJournalBackend = async (
      journalId: string,
      disciplineId: string,
      groupName: string | undefined,
      academicYear: string,
      semester: string,
      students: string[]
    ): Promise<boolean> => {
      if (initializedJournals.value.has(journalId)) {
        return true;
      }

      try {
        const journal = await convex.mutation(api.marks.mutations.initializeJournal, {
          calendarEventId: journalId,
          disciplineId: disciplineId as Id<"rupEntries">,
          groupName,
          academicYearId: academicYear as Id<"academicYears">,
          semesterId: semester as Id<"academicYearSemesters">,
          studentIds: students,
        });

        const backendJournalId = journal?._id ? String(journal._id) : null;
        if (backendJournalId) {
          cacheBackendJournalId(journalId, backendJournalId);
          initializedJournals.value.add(journalId);
          return true;
        }

        return false;
      } catch (err) {
        console.error("[marksStore] Error initializing journal in backend:", err);
        return false;
      }
    };

    const getJournalMarks = computed(() => {
      return (journalId: string): JournalMarks | null => {
        return journalMarks.value[journalId] || null;
      };
    });

    const getStudentMarks = computed(() => {
      return (journalId: string, studentId: string): Mark[] | null => {
        const journal = journalMarks.value[journalId];
        if (!journal) return null;

        const studentMark = journal.studentMarks.find(
          (sm) => sm.studentId === studentId
        );
        return studentMark?.marks || null;
      };
    });

    const initializeJournalMarks = (
      journalId: string,
      studentIds: string[],
      markTemplate: Mark[]
    ) => {
      const existingJournal = journalMarks.value[journalId];
      const newJournalMarks = buildJournalMarksMatrix(
        journalId,
        studentIds,
        markTemplate,
        existingJournal
      );

      journalMarks.value[journalId] = newJournalMarks;
      journalMarks.value = { ...journalMarks.value };
    };

    const updateStudentMark = async (
      journalId: string,
      studentId: string,
      markIndex: number,
      valueIndex: number,
      value: string | null
    ): Promise<boolean> => {
      try {
        const journal = journalMarks.value[journalId];
        if (!journal) return false;

        const studentMark = journal.studentMarks.find(
          (sm) => sm.studentId === studentId
        );
        if (!studentMark) return false;

        if (
          markIndex >= 0 &&
          markIndex < studentMark.marks.length &&
          valueIndex >= 0 &&
          valueIndex < studentMark.marks[markIndex].values.length
        ) {
          const mark = studentMark.marks[markIndex];
          const userStore = useUserStore();
          const rawUserId = userStore.currentUser?.id;
          const userId = rawUserId ? (rawUserId as Id<"users">) : undefined;

          // Optimistic update
          studentMark.marks[markIndex].values[valueIndex] = value;
          journal.lastUpdated = new Date().toISOString();
          triggerRef(journalMarks);

          // Save to backend
          try {
            const backendJournalId = await ensureBackendJournalId(journalId);
            if (backendJournalId) {
              await convex.mutation(api.marks.mutations.updateMark, {
                journalId: backendJournalId as Id<"journals">,
                studentId,
                columnIndex: markIndex,
                rowIndex: valueIndex,
                value: value || undefined,
                columnType: mark.type,
                columnDate: mark.isoDate,
                columnLabel: mark.label,
                controlType: mark.controlType,
                controlId: mark.controlId,
                sessionId: mark.sessionId,
                scheduledControlId: mark.scheduledControlId,
                userId,
              });
            }
          } catch (updateError: any) {
            console.error("[marksStore] Error saving mark update to backend:", updateError);
            throw updateError;
          }

          // Sync to individual parent/main journals
          const syncCtx = {
            ensureBackendJournalId,
            journalMarksMap: journalMarks.value,
            userId,
          };
          await syncToParentJournals(journalId, studentId, markIndex, valueIndex, value, mark, syncCtx);
          await syncToMainJournal(journalId, studentId, valueIndex, value, mark, syncCtx);

          return true;
        }

        return false;
      } catch (err: any) {
        console.error("[marksStore] Error updating mark:", err);
        error.value = "Failed to save mark";
        return false;
      }
    };

    const updateStudentMarkRows = (
      journalId: string,
      studentId: string,
      markIndex: number,
      values: Array<string | null>
    ) => {
      const journal = journalMarks.value[journalId];
      if (!journal) return false;

      const studentMark = journal.studentMarks.find(
        (sm) => sm.studentId === studentId
      );
      if (!studentMark) return false;

      if (markIndex < 0 || markIndex >= studentMark.marks.length) return false;

      const targetLen = studentMark.marks[markIndex].values.length;
      const adjustedValues = values.slice(0, targetLen);
      while (adjustedValues.length < targetLen) adjustedValues.push(null);

      studentMark.marks[markIndex].values = adjustedValues;
      journal.lastUpdated = new Date().toISOString();
      triggerRef(journalMarks);
      return true;
    };

    const updateStudentMarks = (
      journalId: string,
      studentId: string,
      marks: Mark[]
    ) => {
      const journal = journalMarks.value[journalId];
      if (!journal) return false;

      const studentMarkIndex = journal.studentMarks.findIndex(
        (sm) => sm.studentId === studentId
      );
      if (studentMarkIndex === -1) return false;

      journal.studentMarks[studentMarkIndex].marks = JSON.parse(JSON.stringify(marks));
      journal.lastUpdated = new Date().toISOString();
      triggerRef(journalMarks);
      return true;
    };

    const updateMultipleStudentMarks = (
      journalId: string,
      studentMarks: { studentId: string; marks: Mark[] }[]
    ) => {
      const journal = journalMarks.value[journalId];
      if (!journal) return false;

      studentMarks.forEach(({ studentId, marks }) => {
        const studentMarkIndex = journal.studentMarks.findIndex(
          (sm) => sm.studentId === studentId
        );
        if (studentMarkIndex !== -1) {
          journal.studentMarks[studentMarkIndex].marks = JSON.parse(JSON.stringify(marks));
        }
      });

      journal.lastUpdated = new Date().toISOString();
      journalMarks.value = { ...journalMarks.value };
      return true;
    };

    const getJournalStudentMarks = computed(() => {
      return (journalId: string) => {
        const journal = journalMarks.value[journalId];
        if (!journal) return [];

        return journal.studentMarks.map((studentMark) => ({
          studentId: studentMark.studentId,
          marks: studentMark.marks,
        }));
      };
    });

    const deleteJournalMarks = (journalId: string) => {
      const exists = journalId in journalMarks.value;
      if (exists) {
        delete journalMarks.value[journalId];
        journalMarks.value = { ...journalMarks.value };
      }
      return exists;
    };

    const deleteStudentMarks = (journalId: string, studentId: string) => {
      const journal = journalMarks.value[journalId];
      if (!journal) return false;

      const index = journal.studentMarks.findIndex(
        (sm) => sm.studentId === studentId
      );
      if (index === -1) return false;

      journal.studentMarks.splice(index, 1);
      journal.lastUpdated = new Date().toISOString();
      journalMarks.value = { ...journalMarks.value };
      return true;
    };

    const clearAllMarks = () => {
      journalMarks.value = {};
      journalMarks.value = { ...journalMarks.value };
    };

    const getJournalStats = computed(() => {
      return (journalId: string) => {
        const journal = journalMarks.value[journalId];
        if (!journal) return null;

        const totalStudents = journal.studentMarks.length;
        const totalMarks = journal.studentMarks.reduce((total, sm) => {
          return (
            total +
            sm.marks.reduce((markTotal, mark) => {
              return (
                markTotal +
                mark.values.filter((v) => v !== null && v !== "").length
              );
            }, 0)
          );
        }, 0);

        return {
          totalStudents,
          totalMarks,
          lastUpdated: journal.lastUpdated,
        };
      };
    });

    return {
      journalMarks,
      loading,
      error,
      getJournalMarks,
      getStudentMarks,
      getJournalStudentMarks,
      initializeJournalMarks,
      preloadJournalMarks,
      loadJournalMarks,
      initializeJournalBackend,
      updateStudentMark,
      updateStudentMarks,
      updateStudentMarkRows,
      updateMultipleStudentMarks,
      deleteJournalMarks,
      deleteStudentMarks,
      clearAllMarks,
      getJournalStats,
    };
  },
  {}
);
