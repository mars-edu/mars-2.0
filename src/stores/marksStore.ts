import { defineStore } from "pinia";
import { ref, computed, watch } from "vue";
import type { Mark, StudentMark, JournalMarks } from "@/types/marks";
import { useJournalHistoryStore } from "./journalHistoryStore";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import { useConvexQuery } from "convex-vue";

export const useMarksStore = defineStore(
  "marks",
  () => {
    const journalMarks = ref<Record<string, JournalMarks>>({});
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
        const journalId = (journal as any)?._id ? String((journal as any)._id) : null;
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
        const { useClass9Store } = await import("./class9Store");
        const { useAcademicYearSemesterStore } = await import("./academicYearSemesterStore");

        const journalStore = useJournalStore();
        const calendarStore = useCalendarStore();
        const class9Store = useClass9Store();
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
          String(class9Store.getClass9ById(journalInfo.disciplineId)?.academicYearId || "");

        if (!semesterId || semesterId === "" || !academicYearId || academicYearId === "") return null;

        const ok = await initializeJournalBackend(
          calendarEventId,
          journalInfo.disciplineId,
          journalInfo.group,
          academicYearId,
          semesterId,
          journalInfo.students
        );

        if (!ok) return null;
      } catch (err) {
        console.warn("[marksStore] Failed to ensure backend journal:", err);
        return null;
      }

      return await resolveBackendJournalId(calendarEventId);
    };

    // No more queue or debounce logic - direct API calls

    // Load journal marks from backend and merge with existing template
    const loadJournalMarks = async (journalId: string): Promise<boolean> => {
      try {
        loading.value = true;
        error.value = null;

        console.log("[marksStore] Fetching marks from backend for journal:", journalId);

        const backendJournalId = await ensureBackendJournalId(journalId);
        if (!backendJournalId) {
          console.warn("[marksStore] Backend journal not found; cannot load marks:", journalId);
          loading.value = false;
          return false;
        }

        const result = await convex.query(api.marks.queries.getJournalMarks, {
          journalId: backendJournalId as any,
        });

        console.log("[marksStore] Received marks from backend:", {
          journalId,
          marksCount: result.marks.length,
          studentCount: result.journal?.students?.length || 0
        });

        // Get existing journal marks (which should have the template already)
        const existingJournal = journalMarks.value[journalId];
        if (!existingJournal) {
          console.warn("[marksStore] No existing journal template found, cannot merge marks");
          loading.value = false;
          return false;
        }

        // Build a map of backend marks: studentId -> columnIndex -> rowIndex -> value
        const backendMarksMap = new Map<string, Map<number, Map<number, string | null>>>();
        
        result.marks.forEach((mark) => {
          if (!backendMarksMap.has(mark.studentId)) {
            backendMarksMap.set(mark.studentId, new Map());
          }
          const studentMap = backendMarksMap.get(mark.studentId)!;
          if (!studentMap.has(mark.columnIndex)) {
            studentMap.set(mark.columnIndex, new Map());
          }
          studentMap.get(mark.columnIndex)!.set(mark.rowIndex, mark.value);
        });

        // Merge backend marks into the existing template
        existingJournal.studentMarks.forEach((studentMark) => {
          const backendStudentMarks = backendMarksMap.get(studentMark.studentId);
          if (!backendStudentMarks) return;

          studentMark.marks.forEach((mark, columnIndex) => {
            const backendColumnMarks = backendStudentMarks.get(columnIndex);
            if (!backendColumnMarks) return;

            mark.values.forEach((_, rowIndex) => {
              if (backendColumnMarks.has(rowIndex)) {
                mark.values[rowIndex] = backendColumnMarks.get(rowIndex)!;
              }
            });
          });
        });

        existingJournal.lastUpdated = new Date().toISOString();
        
        // Trigger reactivity
        journalMarks.value = { ...journalMarks.value };
        
        console.log("[marksStore] Marks merged successfully into template");
        loading.value = false;
        return true;
      } catch (err) {
        console.error("[marksStore] Error loading journal marks:", err);
        error.value = "Failed to load marks";
        loading.value = false;
        return false;
      }
    };

    // Initialize journal in backend
    const initializeJournalBackend = async (
      journalId: string,
      disciplineId: string,
      groupName: string | undefined,
      academicYear: string,
      semester: string,
      students: string[]
    ): Promise<boolean> => {
      try {
        console.log("[marksStore] Initializing journal in backend:", {
          journalId,
          disciplineId,
          groupName,
          academicYear,
          semester,
          studentCount: students.length
        });
        
        const journal = await convex.mutation(api.marks.mutations.initializeJournal, {
          calendarEventId: journalId,
          disciplineId,
          groupName,
          academicYearId: academicYear,
          semesterId: semester,
          studentIds: students,
        });
        
        const backendJournalId = (journal as any)?._id
          ? String((journal as any)._id)
          : null;
        if (backendJournalId) {
          cacheBackendJournalId(journalId, backendJournalId);
        }
        
        initializedJournals.value.add(journalId);
        console.log("[marksStore] Journal initialized successfully");
        return true;
      } catch (err) {
        console.error("[marksStore] Error initializing journal:", err);
        error.value = "Failed to initialize journal";
        return false;
      }
    };

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

    // Update a specific mark for a student - now uses tRPC directly
    const updateStudentMark = async (
      journalId: string,
      studentId: string,
      markIndex: number,
      valueIndex: number,
      value: string | null
    ): Promise<boolean> => {
      try {
        const journal = journalMarks.value[journalId];
        if (!journal) {
          console.error("[marksStore] Journal not found in local state:", journalId);
          return false;
        }

        const studentMark = journal.studentMarks.find(
          (sm) => sm.studentId === studentId
        );
        if (!studentMark) {
          console.error("[marksStore] Student not found in journal:", studentId);
          return false;
        }

        if (
          markIndex >= 0 &&
          markIndex < studentMark.marks.length &&
          valueIndex >= 0 &&
          valueIndex < studentMark.marks[markIndex].values.length
        ) {
          const oldValue = studentMark.marks[markIndex].values[valueIndex];
          const mark = studentMark.marks[markIndex];

          // Optimistic update - update UI immediately
          studentMark.marks[markIndex].values[valueIndex] = value;
          journal.lastUpdated = new Date().toISOString();

          // Record history locally
          if (oldValue !== value) {
            const historyStore = useJournalHistoryStore();
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

          // Save to backend
          try {
            const backendJournalId = await ensureBackendJournalId(journalId);
            if (!backendJournalId) {
              console.warn(
                "[marksStore] Skipping backend update; journal not initialized:",
                journalId
              );
              return true;
            }

            console.log("[marksStore] Using Convex to update mark");
            await convex.mutation(api.marks.mutations.updateMark, {
              journalId: backendJournalId as any,
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
            });
          } catch (updateError: any) {
            // If foreign key constraint error, journal needs initialization
            if (
              updateError?.message?.includes("Foreign key constraint") ||
              updateError?.message?.includes("does not exist")
            ) {
              console.warn("[marksStore] Journal not initialized in backend, attempting auto-initialization...");
              
              // Try to get journal info from other stores
              const { useJournalStore } = await import("./journalStore");
              const { useCalendarStore } = await import("./calendarStore");
              const { useClass9Store } = await import("./class9Store");
              const { useAcademicYearSemesterStore } = await import("./academicYearSemesterStore");
              
              const journalStore = useJournalStore();
              const calendarStore = useCalendarStore();
              const class9Store = useClass9Store();
              const academicYearSemesterStore = useAcademicYearSemesterStore();
              
              const journalInfo = journalStore.getJournalById(journalId);
              const event = calendarStore.getEventById(journalId);
              
              if (!journalInfo) {
                console.error("[marksStore] Cannot auto-initialize - journal not found in store:", journalId);
                throw updateError;
              }
              
              const semesterId = event?.semester ? String(event.semester) : null;
              const semester = semesterId
                ? academicYearSemesterStore.getAcademicYearSemesterById(semesterId)
                : null;
              const academicYear = semester?.academicYearId
                ? String(semester.academicYearId)
                : String(
                    class9Store.getClass9ById(journalInfo.disciplineId)
                      ?.academicYearId || ""
                  );

              if (!semesterId || semesterId === "" || !academicYear || academicYear === "") {
                console.error(
                  "[marksStore] Cannot auto-initialize - missing semesterId/academicYearId:",
                  { semesterId, academicYear }
                );
                throw updateError;
              }
              
              console.log("[marksStore] Auto-initializing journal with:", {
                journalId,
                disciplineId: journalInfo.disciplineId,
                group: journalInfo.group,
                academicYear,
                semesterId,
                studentCount: journalInfo.students.length
              });
              
              const initialized = await initializeJournalBackend(
                journalId,
                journalInfo.disciplineId,
                journalInfo.group,
                academicYear,
                semesterId,
                journalInfo.students
              );
              
              if (initialized) {
                const backendJournalId = await resolveBackendJournalId(journalId);
                if (!backendJournalId) {
                  throw updateError;
                }
                // Retry the mark update
                console.log("[marksStore] Retrying mark update after initialization...");
                await convex.mutation(api.marks.mutations.updateMark, {
                  journalId: backendJournalId as any,
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
                });
                console.log("[marksStore] Mark updated successfully after auto-initialization");
                return true;
              }
            }
            throw updateError;
          }

          // After successfully saving the mark, sync to parent journals if this is an individual journal
          await syncToParentJournals(journalId, studentId, markIndex, valueIndex, value, mark);

          return true;
        }

        return false;
      } catch (err: any) {
        console.error("[marksStore] Error updating mark:", err);
        error.value = "Failed to save mark";
        return false;
      }
    };

    // Sync marks from individual journal to parent journals (internal helper)
    const syncToParentJournals = async (
      individualJournalId: string,
      studentId: string,
      markIndex: number,
      valueIndex: number,
      value: string | null,
      mark: Mark
    ): Promise<void> => {
      try {
        const { useCalendarStore } = await import("./calendarStore");
        const calendarStore = useCalendarStore();

        const individualEvent = calendarStore.getEventById(individualJournalId);

        // Check if this is an individual journal
        if (!individualEvent?.isIndividualJournal || !individualEvent.mergedJournalIds) {
          return; // Not an individual journal, no sync needed
        }

        console.log("[marksStore] Syncing mark from individual journal to parent journals:", {
          individualJournalId,
          studentId,
          parentJournals: individualEvent.mergedJournalIds,
        });

        // Find which parent journal this student belongs to
        for (const parentJournalId of individualEvent.mergedJournalIds) {
          const parentEvent = calendarStore.getEventById(parentJournalId);

          // Check if this student is in this parent journal
          if (parentEvent?.participants?.includes(studentId)) {
            console.log("[marksStore] Syncing to parent journal:", {
              parentJournalId,
              studentId,
            });

            // Get parent journal marks
            const parentJournal = journalMarks.value[parentJournalId];
            if (!parentJournal) {
              console.warn("[marksStore] Parent journal not loaded in state, skipping sync");
              continue;
            }

            const parentStudentMark = parentJournal.studentMarks.find(
              (sm) => sm.studentId === studentId
            );

            if (!parentStudentMark) {
              console.warn("[marksStore] Student not found in parent journal");
              continue;
            }

            // Update local state
            if (
              markIndex >= 0 &&
              markIndex < parentStudentMark.marks.length &&
              valueIndex >= 0 &&
              valueIndex < parentStudentMark.marks[markIndex].values.length
            ) {
              parentStudentMark.marks[markIndex].values[valueIndex] = value;
              parentJournal.lastUpdated = new Date().toISOString();

            // Save to backend
            try {
              const backendParentJournalId = await ensureBackendJournalId(parentJournalId);
              if (!backendParentJournalId) {
                console.warn(
                  "[marksStore] Skipping backend sync; parent journal not initialized:",
                  parentJournalId
                );
                continue;
              }
              await convex.mutation(api.marks.mutations.updateMark, {
                journalId: backendParentJournalId as any,
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
                });
                console.log("[marksStore] Successfully synced mark to parent journal");
              } catch (syncError) {
                console.error("[marksStore] Error saving synced mark to parent journal:", syncError);
              }
            }
          }
        }
      } catch (err) {
        console.error("[marksStore] Error syncing individual journal marks:", err);
      }
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
      debugState,
    };
  },
  {}
);
