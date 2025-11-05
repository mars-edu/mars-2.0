import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Mark, StudentMark, JournalMarks } from "@/types/marks";
import { useJournalHistoryStore } from "./journalHistoryStore";

export const useMarksStore = defineStore(
  "marks",
  () => {
    const journalMarks = ref<Record<string, JournalMarks>>({});
    const loading = ref(false);
    const error = ref<string | null>(null);

    // Get marks for a specific journal
    const getJournalMarks = computed(() => {
      return (journalId: string): JournalMarks | null => {
        const result = journalMarks.value[journalId] || null;
        return result;
      };
    });

    // Get marks for a specific student in a journal
    const getStudentMarks = computed(() => {
      return (journalId: string, studentId: string): Mark[] | null => {
        const journal = journalMarks.value[journalId];
        if (!journal) {
          return null;
        }

        const studentMark = journal.studentMarks.find(
          (sm) => sm.studentId === studentId
        );
        return studentMark?.marks || null;
      };
    });

    // Initialize marks for a journal with given students and mark structure
    const initializeJournalMarks = (
      journalId: string,
      studentIds: string[],
      markTemplate: Mark[]
    ) => {
      const uniqueStudentIds = Array.from(
        new Set(studentIds.filter((id): id is string => typeof id === "string" && id.length > 0))
      );

      const cloneTemplate = () =>
        markTemplate.map((mark) => JSON.parse(JSON.stringify(mark)) as Mark);

      const findMatchingMarkIndex = (
        templateMark: Mark,
        existingMarks: Mark[],
        usedIndices: Set<number>
      ): number => {
        const tryMatch = (predicate: (mark: Mark) => boolean) => {
          for (let i = 0; i < existingMarks.length; i += 1) {
            if (usedIndices.has(i)) continue;
            const candidate = existingMarks[i];
            if (predicate(candidate)) return i;
          }
          return -1;
        };

        if (templateMark.type === "date") {
          if (templateMark.isoDate) {
            const idx = tryMatch(
              (mark) => mark.type === "date" && mark.isoDate === templateMark.isoDate
            );
            if (idx !== -1) return idx;
          }
          const label = templateMark.label || templateMark.date;
          if (label) {
            const normalizedLabel = String(label).trim();
            const idx = tryMatch((mark) => {
              if (mark.type !== "date") return false;
              const matchLabel = String(mark.label || mark.date || "").trim();
              return matchLabel === normalizedLabel;
            });
            if (idx !== -1) return idx;
          }
        }

        if (templateMark.type === "session") {
          if (templateMark.scheduledControlId) {
            const idx = tryMatch(
              (mark) =>
                mark.type === "session" &&
                mark.scheduledControlId === templateMark.scheduledControlId
            );
            if (idx !== -1) return idx;
          }
          if (templateMark.sessionId) {
            const idx = tryMatch(
              (mark) => mark.type === "session" && mark.sessionId === templateMark.sessionId
            );
            if (idx !== -1) return idx;
          }
          if (templateMark.label) {
            const normalizedLabel = String(templateMark.label).trim();
            if (normalizedLabel.length) {
              const idx = tryMatch((mark) => {
                if (mark.type !== "session") return false;
                const matchLabel = String(mark.label || "").trim();
                return matchLabel === normalizedLabel;
              });
              if (idx !== -1) return idx;
            }
          }
        }

        return tryMatch((mark) => mark.type === templateMark.type);
      };

      const mergeValuesFromExisting = (templateMark: Mark, existingMark: Mark) => {
        if (!Array.isArray(templateMark.values)) {
          templateMark.values = [];
        }
        const templateValues = Array.isArray(templateMark.values)
          ? [...templateMark.values]
          : [];
        const existingValues = Array.isArray(existingMark.values)
          ? existingMark.values
          : [];

        const merged = templateValues.map((_, idx) => {
          if (idx < existingValues.length) {
            return existingValues[idx] ?? null;
          }
          return null;
        });

        return merged;
      };

      const buildStudentMarks = (
        studentId: string,
        existingStudent?: StudentMark
      ): StudentMark => {
        const templateMarks = cloneTemplate();
        const existingMarks = existingStudent?.marks ?? [];
        const usedIndices = new Set<number>();

        templateMarks.forEach((templateMark) => {
          const matchIndex = findMatchingMarkIndex(
            templateMark,
            existingMarks,
            usedIndices
          );
          if (matchIndex === -1) {
            if (Array.isArray(templateMark.values)) {
              templateMark.values = templateMark.values.map(() => null);
            }
            return;
          }

          usedIndices.add(matchIndex);
          const existingMark = existingMarks[matchIndex];
          const mergedValues = mergeValuesFromExisting(templateMark, existingMark);
          templateMark.values = mergedValues;
        });

        return {
          studentId,
          marks: templateMarks,
        };
      };

      const existingJournal = journalMarks.value[journalId];

      const nextStudentMarks = uniqueStudentIds.map((studentId) => {
        const existingStudent = existingJournal?.studentMarks.find(
          (sm) => sm.studentId === studentId
        );
        return buildStudentMarks(studentId, existingStudent);
      });

      const newJournalMarks: JournalMarks = {
        journalId,
        studentMarks: nextStudentMarks,
        lastUpdated: new Date().toISOString(),
      };

      journalMarks.value[journalId] = newJournalMarks;

      journalMarks.value = { ...journalMarks.value };
    };

    // Update a specific mark for a student
    const updateStudentMark = (
      journalId: string,
      studentId: string,
      markIndex: number,
      valueIndex: number,
      value: string | null
    ) => {
      const journal = journalMarks.value[journalId];
      if (!journal) {
        return false;
      }

      const studentMark = journal.studentMarks.find(
        (sm) => sm.studentId === studentId
      );
      if (!studentMark) {
        return false;
      }

      if (
        markIndex >= 0 &&
        markIndex < studentMark.marks.length &&
        valueIndex >= 0 &&
        valueIndex < studentMark.marks[markIndex].values.length
      ) {
        // Capture old value BEFORE changing
        const oldValue = studentMark.marks[markIndex].values[valueIndex];

        // Make the change
        studentMark.marks[markIndex].values[valueIndex] = value;
        journal.lastUpdated = new Date().toISOString();

        // Record history (only if value actually changed)
        if (oldValue !== value) {
          const historyStore = useJournalHistoryStore();
          const mark = studentMark.marks[markIndex];
          const columnLabel = mark.label || mark.date || `Column ${markIndex}`;
          const columnDate = mark.isoDate;

          historyStore.addRecord(
            journalId,
            studentId,
            markIndex,
            valueIndex,
            oldValue,
            value,
            columnLabel,
            columnDate
          );
        }

        // Trigger reactivity for persistence
        journalMarks.value = { ...journalMarks.value };
        return true;
      }

      return false;
    };

    // Replace all row values for a specific mark (date/session/PK/etc)
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
      // Trigger reactivity for persistence
      journalMarks.value = { ...journalMarks.value };
      return true;
    };

    // Update entire marks array for a student
    const updateStudentMarks = (
      journalId: string,
      studentId: string,
      marks: Mark[]
    ) => {
      const journal = journalMarks.value[journalId];
      if (!journal) {
        return false;
      }

      const studentMarkIndex = journal.studentMarks.findIndex(
        (sm) => sm.studentId === studentId
      );
      if (studentMarkIndex === -1) {
        return false;
      }

      journal.studentMarks[studentMarkIndex].marks = JSON.parse(
        JSON.stringify(marks)
      );
      journal.lastUpdated = new Date().toISOString();
      // Trigger reactivity for persistence
      journalMarks.value = { ...journalMarks.value };
      return true;
    };

    // Batch update multiple students' marks
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
          journal.studentMarks[studentMarkIndex].marks = JSON.parse(
            JSON.stringify(marks)
          );
        }
      });

      journal.lastUpdated = new Date().toISOString();
      // Trigger reactivity for persistence
      journalMarks.value = { ...journalMarks.value };
      return true;
    };

    // Get all marks for all students in a journal (formatted for table)
    const getJournalStudentMarks = computed(() => {
      return (journalId: string) => {
        const journal = journalMarks.value[journalId];
        if (!journal) {
          return [];
        }

        const result = journal.studentMarks.map((studentMark) => ({
          studentId: studentMark.studentId,
          marks: studentMark.marks,
        }));
        return result;
      };
    });

    // Delete marks for a journal
    const deleteJournalMarks = (journalId: string) => {
      const exists = journalId in journalMarks.value;
      if (exists) {
        delete journalMarks.value[journalId];
        // Trigger reactivity for persistence
        journalMarks.value = { ...journalMarks.value };
      }
      return exists;
    };

    // Delete marks for a specific student in a journal
    const deleteStudentMarks = (journalId: string, studentId: string) => {
      const journal = journalMarks.value[journalId];
      if (!journal) return false;

      const index = journal.studentMarks.findIndex(
        (sm) => sm.studentId === studentId
      );
      if (index === -1) return false;

      journal.studentMarks.splice(index, 1);
      journal.lastUpdated = new Date().toISOString();
      // Trigger reactivity for persistence
      journalMarks.value = { ...journalMarks.value };
      return true;
    };

    // Clear all marks data
    const clearAllMarks = () => {
      journalMarks.value = {};
      // Trigger reactivity for persistence
      journalMarks.value = { ...journalMarks.value };
    };

    // Get statistics for a journal
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

    // Debug method to log current state
    const debugState = () => {
      // Logging removed
    };

    return {
      journalMarks,
      loading,
      error,
      getJournalMarks,
      getStudentMarks,
      getJournalStudentMarks,
      initializeJournalMarks,
      updateStudentMark,
      updateStudentMarks,
      updateStudentMarkRows,
      updateMultipleStudentMarks,
      deleteJournalMarks,
      deleteStudentMarks,
      clearAllMarks,
      getJournalStats,
      debugState,
    };
  },
  {
    serverSync: {
      enabled: true,
    },
  }
);
