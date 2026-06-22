/**
 * Interactive marks grid + cell editing for the journal. Extracted from
 * JournalTab.vue — the most connected cluster (grid matrix, edit state,
 * keyboard navigation, rebuild lifecycle). Owns editingCell / editedValue /
 * userEditInProgress; resolves the marks + academic-year-semester stores
 * internally. All other reactive context is passed in.
 */
import { ref, computed, nextTick, onMounted, onUnmounted, type Ref } from "vue";
import { debounce } from "es-toolkit";
import { f7 } from "framework7-vue";
import { confirmMarkEdit } from "@/utils/dialogs";
import { useMarksStore } from "@/stores/marksStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";

export interface UseJournalMarksOptions {
  currentEvent: Ref<any>;
  currentJournal: Ref<any>;
  canonicalTemplate: Ref<any[]>;
  generateDates: () => any[];
  getCanonicalRows: (canonicalCol: number) => number;
  visibleHeaders: Ref<any[]>;
  getStoreIndexForCanonicalIndex: (canonicalCol: number) => number | null;
  students: Ref<any[]>;
  getStudentIdByIndex: (index: number) => string | null;
  getStudentFinalGrade: (studentId: string) => string;
  scheduleRecomputeSessionGrades: () => void;
  localJournalSettings: Ref<any>;
  journalId: Ref<string>;
  journalSettings: Ref<any>;
  emit: (event: string, ...args: any[]) => void;
}

export function useJournalMarks(opts: UseJournalMarksOptions) {
  const {
    currentEvent,
    currentJournal,
    canonicalTemplate,
    generateDates,
    getCanonicalRows,
    visibleHeaders,
    getStoreIndexForCanonicalIndex,
    students,
    getStudentIdByIndex,
    getStudentFinalGrade,
    scheduleRecomputeSessionGrades,
    localJournalSettings,
    journalId,
    journalSettings,
    emit,
  } = opts;
  const marksStore = useMarksStore();
  const academicYearSemesterStore = useAcademicYearSemesterStore();

  const editingCell = ref<{
    studentIndex: number;
    colIndex: number;
    markIndex: number;
  } | null>(null);
  const editedValue = ref("");
  const userEditInProgress = ref(false);

  const isViewOnly = computed(() => !!currentEvent.value?.isClosed);

  const notifyViewOnly = () => {
    f7.toast
      .create({
        text: "Журнал закрыт. Редактирование недоступно.",
        position: "center",
        closeTimeout: 2000,
      })
      .open();
  };

  const withEditPermission = <T extends (...args: any[]) => any>(fn: T): T => {
    return ((...args: any[]) => {
      if (isViewOnly.value) {
        editingCell.value = null;
        notifyViewOnly();
        return;
      }
      return fn(...args);
    }) as T;
  };

  const getMark = (studentIndex: number, colIndex: number, markIndex: number) => {
    return marksMatrix.value[studentIndex]?.[colIndex]?.[markIndex] ?? "";
  };

  const marksMatrix = computed(() => {
    const matrix: Record<number, Record<number, string[]>> = {};
    const canonical = canonicalTemplate.value;
    const numCols = canonical ? canonical.length : 0;

    // Precompute storeColIndex for each cIdx
    const colIndexMap: Record<number, number | null> = {};
    for (let cIdx = 0; cIdx < numCols; cIdx++) {
      colIndexMap[cIdx] = getStoreIndexForCanonicalIndex(cIdx);
    }

    const currentStudents = students.value;
    for (let sIdx = 0; sIdx < currentStudents.length; sIdx++) {
      const student = currentStudents[sIdx];
      matrix[sIdx] = {};
      if (!student || !journalId.value) continue;

      // Fill final summary column (-1)
      matrix[sIdx][-1] = [getStudentFinalGrade(student.studentId)];

      // Fill standard columns
      for (let cIdx = 0; cIdx < numCols; cIdx++) {
        matrix[sIdx][cIdx] = [];
        const storeColIndex = colIndexMap[cIdx];
        const studentMarks = student.marks;
        if (!studentMarks || storeColIndex == null || storeColIndex < 0 || storeColIndex >= studentMarks.length) {
          continue;
        }

        const values = studentMarks[storeColIndex].values;
        for (let mIdx = 0; mIdx < values.length; mIdx++) {
          const val = values[mIdx];
          matrix[sIdx][cIdx][mIdx] = val === null ? "" : String(val ?? "");
        }
      }
    }
    return matrix;
  });

  // Direct mark update function - no debounce, immediate save
  const updateMark = withEditPermission(async (
    studentIndex: number,
    colIndex: number,
    markIndex: number,
    value: string | null
  ) => {
    userEditInProgress.value = true;

    const studentId = getStudentIdByIndex(studentIndex);
    if (!studentId || !journalId.value) {
      userEditInProgress.value = false;
      return;
    }

    const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
    if (storeColIndex == null || storeColIndex < 0) {
      userEditInProgress.value = false;
      scheduleRebuildMarks();
      return;
    }

    await marksStore.updateStudentMark(
      journalId.value,
      studentId,
      storeColIndex,
      markIndex,
      value
    );

    emit("update-students", students.value);
    userEditInProgress.value = false;
  });

  const setMark = (
    studentIndex: number,
    colIndex: number,
    markIndex: number,
    value: string
  ) => {
    const studentId = getStudentIdByIndex(studentIndex);
    if (!studentId || !journalId.value) return;
    if (colIndex < 0) return;

    const newValue = value === "+" || value === "" ? null : value;

    // Direct store update - no debounce
    updateMark(studentIndex, colIndex, markIndex, newValue);
  };

  const handleCellClick = withEditPermission((
    studentIndex: number,
    colIndex: number,
    markIndex: number
  ) => {
    const currentMark = getMark(studentIndex, colIndex, markIndex);
    const hasExistingValue = currentMark !== "" && currentMark !== null;

    if (hasExistingValue) {
      confirmMarkEdit(currentMark, () => editCell(studentIndex, colIndex, markIndex));
    } else {
      // Empty cell, edit directly
      editCell(studentIndex, colIndex, markIndex);
    }
  });

  const editCell = withEditPermission((
    studentIndex: number,
    colIndex: number,
    markIndex: number
  ) => {
    const studentId = getStudentIdByIndex(studentIndex);
    if (!studentId || !journalId.value) return;
    if (colIndex < 0) return;

    const studentMarks = marksStore.getStudentMarks(journalId.value, studentId);
    const storeColIndex = getStoreIndexForCanonicalIndex(colIndex);
    if (!studentMarks || storeColIndex == null || storeColIndex < 0) return;

    const mark = studentMarks[storeColIndex];
    const markType = mark.type;
    const calculationType =
      journalSettings.value?.calculationType ||
      localJournalSettings.value.calculationType;
    // Only block editing for intermediate controls when in calculated mode
    // Final controls (like Экзамен) can always be edited manually
    if (markType === "session" && mark.controlType === "intermediate" && calculationType === "calculated") {
      return;
    }

    editingCell.value = { studentIndex, colIndex, markIndex };
    editedValue.value = getMark(studentIndex, colIndex, markIndex);
  });

  const confirmEdit = withEditPermission(() => {
    if (!editingCell.value) return;
    const { studentIndex, colIndex, markIndex } = editingCell.value;
    setMark(studentIndex, colIndex, markIndex, editedValue.value);
    editingCell.value = null;
  });

  const cancelEdit = () => {
    editingCell.value = null;
  };

  const navigate = withEditPermission(async (direction: "up" | "down" | "left" | "right") => {
    if (!editingCell.value) return;

    const {
      studentIndex: startStudent,
      colIndex: startCol,
      markIndex: startMark,
    } = editingCell.value;
    setMark(startStudent, startCol, startMark, editedValue.value);

    editingCell.value = null;

    nextTick(() => {
      let nextStudent = startStudent;
      let nextCol = startCol;
      let nextMark = startMark;

      const numStudents = students.value.length;
      const numCols = visibleHeaders.value.length;
      const getColRows = (col: number) => getCanonicalRows(col);
      const currentColRows = getColRows(startCol);

      switch (direction) {
        case "up":
          nextStudent -= 1;
          break;
        case "down":
          nextStudent += 1;
          break;
        case "right":
          if (nextMark < currentColRows - 1) {
            nextMark += 1;
          } else {
            nextMark = 0;
            nextCol += 1;
          }
          break;
        case "left":
          if (nextMark > 0) {
            nextMark -= 1;
          } else {
            nextCol -= 1;
            const targetRows = getColRows(
              ((nextCol % numCols) + numCols) % numCols
            );
            nextMark = Math.max(0, targetRows - 1);
          }
          break;
      }

      if (nextStudent < 0) nextStudent = numStudents - 1;
      if (nextStudent >= numStudents) nextStudent = 0;
      if (nextCol < 0) nextCol = numCols - 1;
      if (nextCol >= numCols) nextCol = 0;

      editCell(nextStudent, nextCol, nextMark);
    });
  });

  const handleGlobalKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape" && editingCell.value) {
      cancelEdit();
    }
  };

  // Rebuild marks when sessions list changes (ensures session columns appear on load)
  const rebuildMarks = async () => {
    if (!(journalId.value && currentJournal.value?.students?.length)) return;

    // If user is editing, wait for completion
    if (userEditInProgress.value) {
      console.log("[JournalTab] Deferring rebuildMarks - user edit in progress");
      // Wait for current update to complete
      await nextTick();
    }

    // Initialize journal in backend if needed
    const event = currentEvent.value;
    const semester = academicYearSemesterStore.getActiveAcademicYearSemester;

    if (event && semester) {
      try {
        await marksStore.initializeJournalBackend(
          journalId.value,
          currentJournal.value.disciplineId,
          currentJournal.value.group,
          semester.academicYearId,
          semester.id,
          currentJournal.value.students
        );
      } catch (err) {
        console.warn("[JournalTab] Failed to initialize journal in backend:", err);
        // Continue anyway - marks will work locally
      }
    }

    const markTemplate = generateDates();
    marksStore.initializeJournalMarks(
      journalId.value,
      currentJournal.value.students,
      markTemplate
    );

    // Load marks from backend to merge with the template
    try {
      console.log("[JournalTab] Loading marks from backend for journal:", journalId.value);
      console.time(`journal-tab-load-marks-${journalId.value}`);
      await marksStore.loadJournalMarks(journalId.value);
      console.timeEnd(`journal-tab-load-marks-${journalId.value}`);
      console.log("[JournalTab] Marks loaded successfully from backend");
    } catch (err) {
      console.timeEnd(`journal-tab-load-marks-${journalId.value}`);
      console.warn("[JournalTab] Failed to load marks from backend:", err);
      // Continue - marks will work with local template
    }

    scheduleRecomputeSessionGrades();
    console.timeEnd(`journal-tab-mounted-${journalId.value}`);
  };

  const scheduleRebuildMarks = debounce(() => {
    rebuildMarks();
  }, 250);

  const updateStudent = async (updatedStudent: any) => {
    if (!updatedStudent || !journalId.value) return;

    // Update marks in store
    if (updatedStudent.marks) {
      marksStore.updateStudentMarks(
        journalId.value,
        updatedStudent.studentId,
        updatedStudent.marks
      );
    }
    scheduleRecomputeSessionGrades();
  };

  const updateStudents = async (updatedStudents: any[]) => {
    if (updatedStudents && journalId.value) {
      // Update all students' marks in store
      const studentMarksToUpdate = updatedStudents.map((student) => ({
        studentId: student.studentId,
        marks: student.marks,
      }));

      marksStore.updateMultipleStudentMarks(
        journalId.value,
        studentMarksToUpdate
      );
      scheduleRecomputeSessionGrades();
    }
  };

  onMounted(() => {
    window.addEventListener("keydown", handleGlobalKeydown);
  });
  onUnmounted(() => {
    window.removeEventListener("keydown", handleGlobalKeydown);
  });

  return {
    editingCell,
    editedValue,
    userEditInProgress,
    isViewOnly,
    notifyViewOnly,
    withEditPermission,
    getMark,
    marksMatrix,
    updateMark,
    setMark,
    handleCellClick,
    editCell,
    confirmEdit,
    cancelEdit,
    navigate,
    rebuildMarks,
    scheduleRebuildMarks,
    updateStudent,
    updateStudents,
  };
}
