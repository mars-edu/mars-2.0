import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { Mark, StudentMark, JournalMarks } from "@/types/marks";

export const useMarksStore = defineStore(
  "marks",
  () => {
    const journalMarks = ref<Map<string, JournalMarks>>(new Map());
    const loading = ref(false);
    const error = ref<string | null>(null);

    console.log("[marksStore] Store initialized");

    // Get marks for a specific journal
    const getJournalMarks = computed(() => {
      return (journalId: string): JournalMarks | null => {
        console.log("[marksStore] Getting journal marks for:", journalId);
        const result = journalMarks.value.get(journalId) || null;
        console.log("[marksStore] Journal marks result:", result);
        return result;
      };
    });

    // Get marks for a specific student in a journal
    const getStudentMarks = computed(() => {
      return (journalId: string, studentId: string): Mark[] | null => {
        console.log("[marksStore] Getting student marks for:", {
          journalId,
          studentId,
        });
        const journal = journalMarks.value.get(journalId);
        console.log("[marksStore] Found journal:", !!journal);
        if (!journal) {
          console.log("[marksStore] No journal found for ID:", journalId);
          return null;
        }

        const studentMark = journal.studentMarks.find(
          (sm) => sm.studentId === studentId
        );
        console.log("[marksStore] Found student mark:", !!studentMark);
        console.log(
          "[marksStore] Student marks result:",
          studentMark?.marks?.length || 0,
          "marks"
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
      console.log("[marksStore] Initializing journal marks:", {
        journalId,
        studentCount: studentIds.length,
        markTemplateLength: markTemplate.length,
      });
      console.log("[marksStore] Student IDs:", studentIds);
      console.log("[marksStore] Mark template:", markTemplate);

      const existingJournal = journalMarks.value.get(journalId);
      console.log("[marksStore] Existing journal found:", !!existingJournal);

      // If journal already exists, update marks template and add new students
      if (existingJournal) {
        const existingStudentIds = existingJournal.studentMarks.map(
          (sm) => sm.studentId
        );
        console.log("[marksStore] Existing student IDs:", existingStudentIds);

        // Check if we need to update marks template (e.g., when sessions are added)
        const currentMarksLength =
          existingJournal.studentMarks[0]?.marks.length || 0;
        const newMarksLength = markTemplate.length;

        console.log("[marksStore] Marks length comparison:", {
          current: currentMarksLength,
          new: newMarksLength,
          needsUpdate: currentMarksLength !== newMarksLength,
        });

        // Update existing students' marks if template has changed
        if (currentMarksLength !== newMarksLength) {
          console.log(
            "[marksStore] Updating marks template for existing students"
          );
          existingJournal.studentMarks.forEach((studentMark) => {
            // Preserve existing marks data while updating to new template
            const updatedMarks = JSON.parse(JSON.stringify(markTemplate));

            // Copy over existing marks where possible and align values length
            studentMark.marks.forEach((existingMark, index) => {
              if (
                index < updatedMarks.length &&
                updatedMarks[index].type === existingMark.type
              ) {
                const targetLen = updatedMarks[index].values.length;
                const adjustedValues = existingMark.values.slice(0, targetLen);
                while (adjustedValues.length < targetLen) {
                  adjustedValues.push(null);
                }
                updatedMarks[index].values = adjustedValues;
              }
            });

            studentMark.marks = updatedMarks;
          });
        } else {
          // Even if total marks length is same, ensure per-column values length match template
          existingJournal.studentMarks.forEach((studentMark) => {
            studentMark.marks = studentMark.marks.map((existingMark, index) => {
              const target = markTemplate[index];
              if (!target || target.type !== existingMark.type)
                return existingMark;
              const targetLen = target.values.length;
              if (existingMark.values.length === targetLen) return existingMark;
              const adjustedValues = existingMark.values.slice(0, targetLen);
              while (adjustedValues.length < targetLen) {
                adjustedValues.push(null);
              }
              return {
                ...existingMark,
                values: adjustedValues,
              };
            });
          });
        }

        // Add new students if any
        studentIds.forEach((studentId) => {
          if (!existingStudentIds.includes(studentId)) {
            console.log("[marksStore] Adding new student:", studentId);
            existingJournal.studentMarks.push({
              studentId,
              marks: JSON.parse(JSON.stringify(markTemplate)),
            });
          }
        });

        existingJournal.lastUpdated = new Date().toISOString();
        console.log(
          "[marksStore] Updated existing journal, total students:",
          existingJournal.studentMarks.length
        );
        // force reactivity for persistence
        journalMarks.value = new Map(journalMarks.value);
        return;
      }

      // Create new journal marks
      const newJournalMarks: JournalMarks = {
        journalId,
        studentMarks: studentIds.map((studentId) => ({
          studentId,
          marks: JSON.parse(JSON.stringify(markTemplate)),
        })),
        lastUpdated: new Date().toISOString(),
      };

      journalMarks.value.set(journalId, newJournalMarks);
      console.log("[marksStore] Created new journal marks:", {
        journalId,
        studentCount: newJournalMarks.studentMarks.length,
        totalJournals: journalMarks.value.size,
      });
      // force reactivity for persistence
      journalMarks.value = new Map(journalMarks.value);
    };

    // Update a specific mark for a student
    const updateStudentMark = (
      journalId: string,
      studentId: string,
      markIndex: number,
      valueIndex: number,
      value: string | null
    ) => {
      console.log("[marksStore] Updating student mark:", {
        journalId,
        studentId,
        markIndex,
        valueIndex,
        value,
      });

      const journal = journalMarks.value.get(journalId);
      if (!journal) {
        console.log("[marksStore] Journal not found for update:", journalId);
        return false;
      }

      const studentMark = journal.studentMarks.find(
        (sm) => sm.studentId === studentId
      );
      if (!studentMark) {
        console.log("[marksStore] Student not found for update:", studentId);
        return false;
      }

      if (
        markIndex >= 0 &&
        markIndex < studentMark.marks.length &&
        valueIndex >= 0 &&
        valueIndex < studentMark.marks[markIndex].values.length
      ) {
        const oldValue = studentMark.marks[markIndex].values[valueIndex];
        studentMark.marks[markIndex].values[valueIndex] = value;
        journal.lastUpdated = new Date().toISOString();
        console.log("[marksStore] Mark updated successfully:", {
          oldValue,
          newValue: value,
          timestamp: journal.lastUpdated,
        });
        // force reactivity for persistence
        journalMarks.value = new Map(journalMarks.value);
        return true;
      }

      console.log("[marksStore] Invalid mark indices:", {
        markIndex,
        valueIndex,
        maxMarkIndex: studentMark.marks.length - 1,
        maxValueIndex: studentMark.marks[markIndex]?.values.length - 1,
      });
      return false;
    };

    // Replace all row values for a specific mark (date/session/PK/etc)
    const updateStudentMarkRows = (
      journalId: string,
      studentId: string,
      markIndex: number,
      values: Array<string | null>
    ) => {
      const journal = journalMarks.value.get(journalId);
      if (!journal) return false;

      const studentMark = journal.studentMarks.find(
        (sm) => sm.studentId === studentId
      );
      if (!studentMark) return false;

      if (markIndex < 0 || markIndex >= studentMark.marks.length) return false;

      const targetLen = studentMark.marks[markIndex].values.length;
      const adjustedValues = values.slice(0, targetLen);
      while (adjustedValues.length < targetLen) adjustedValues.push(null);

      const oldValues = studentMark.marks[markIndex].values;
      studentMark.marks[markIndex].values = adjustedValues;
      journal.lastUpdated = new Date().toISOString();
      console.log("[marksStore] Replaced mark rows:", {
        studentId,
        markIndex,
        oldValues,
        newValues: adjustedValues,
      });
      // force reactivity for persistence
      journalMarks.value = new Map(journalMarks.value);
      return true;
    };

    // Update entire marks array for a student
    const updateStudentMarks = (
      journalId: string,
      studentId: string,
      marks: Mark[]
    ) => {
      console.log("[marksStore] Updating entire student marks:", {
        journalId,
        studentId,
        marksCount: marks.length,
      });

      const journal = journalMarks.value.get(journalId);
      if (!journal) {
        console.log(
          "[marksStore] Journal not found for student marks update:",
          journalId
        );
        return false;
      }

      const studentMarkIndex = journal.studentMarks.findIndex(
        (sm) => sm.studentId === studentId
      );
      if (studentMarkIndex === -1) {
        console.log(
          "[marksStore] Student not found for marks update:",
          studentId
        );
        return false;
      }

      journal.studentMarks[studentMarkIndex].marks = JSON.parse(
        JSON.stringify(marks)
      );
      journal.lastUpdated = new Date().toISOString();
      console.log("[marksStore] Student marks updated successfully:", {
        studentId,
        newMarksCount: marks.length,
        timestamp: journal.lastUpdated,
      });
      // force reactivity for persistence
      journalMarks.value = new Map(journalMarks.value);
      return true;
    };

    // Batch update multiple students' marks
    const updateMultipleStudentMarks = (
      journalId: string,
      studentMarks: { studentId: string; marks: Mark[] }[]
    ) => {
      const journal = journalMarks.value.get(journalId);
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
      // force reactivity for persistence
      journalMarks.value = new Map(journalMarks.value);
      return true;
    };

    // Get all marks for all students in a journal (formatted for table)
    const getJournalStudentMarks = computed(() => {
      return (journalId: string) => {
        console.log(
          "[marksStore] Getting all journal student marks for:",
          journalId
        );
        const journal = journalMarks.value.get(journalId);
        if (!journal) {
          console.log(
            "[marksStore] No journal found for student marks:",
            journalId
          );
          return [];
        }

        const result = journal.studentMarks.map((studentMark) => ({
          studentId: studentMark.studentId,
          marks: studentMark.marks,
        }));
        console.log(
          "[marksStore] Returning student marks for",
          result.length,
          "students"
        );
        return result;
      };
    });

    // Delete marks for a journal
    const deleteJournalMarks = (journalId: string) => {
      const result = journalMarks.value.delete(journalId);
      // force reactivity for persistence
      journalMarks.value = new Map(journalMarks.value);
      return result;
    };

    // Delete marks for a specific student in a journal
    const deleteStudentMarks = (journalId: string, studentId: string) => {
      const journal = journalMarks.value.get(journalId);
      if (!journal) return false;

      const index = journal.studentMarks.findIndex(
        (sm) => sm.studentId === studentId
      );
      if (index === -1) return false;

      journal.studentMarks.splice(index, 1);
      journal.lastUpdated = new Date().toISOString();
      // force reactivity for persistence
      journalMarks.value = new Map(journalMarks.value);
      return true;
    };

    // Clear all marks data
    const clearAllMarks = () => {
      journalMarks.value.clear();
      // force reactivity for persistence
      journalMarks.value = new Map(journalMarks.value);
    };

    // Get statistics for a journal
    const getJournalStats = computed(() => {
      return (journalId: string) => {
        const journal = journalMarks.value.get(journalId);
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
      console.log("[marksStore] Current state:", {
        totalJournals: journalMarks.value.size,
        journals: Array.from(journalMarks.value.keys()),
        loading: loading.value,
        error: error.value,
      });

      journalMarks.value.forEach((journal, journalId) => {
        console.log(`[marksStore] Journal ${journalId}:`, {
          studentCount: journal.studentMarks.length,
          lastUpdated: journal.lastUpdated,
        });
      });
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
    persist: {
      key: "marks",
      paths: ["journalMarks"],
    },
  }
);
