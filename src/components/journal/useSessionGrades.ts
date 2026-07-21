/**
 * Session-grade computation for the journal grid (РК / final-grade derivation,
 * day averages, calculated-mode detection, letter-grade monitoring stats).
 * Extracted from JournalTab.vue (Cluster E).
 *
 * Pure-ish derivation over the marks store + column template; computeAllSession
 * Grades writes computed session grades back to the marks store. Reactive grid
 * context is passed in; the marks store is resolved internally.
 */
import { computed, type Ref } from "vue";
import { debounce } from "es-toolkit";
import { useMarksStore } from "@/stores/marksStore";
import type { Mark } from "@/types/marks";
import {
  scoreToLetter,
  LETTER_GRADE_BUCKETS,
} from "@/components/journal/journalGrid.lib";

export interface UseSessionGradesOptions {
  canonicalTemplate: Ref<any[]>;
  getStoreIndexForCanonicalIndex: (canonicalCol: number) => number | null;
  getStoreIndexForDatePosition: (datePos: number) => number | null;
  marksByStudentId: Ref<Map<string, any>>;
  students: Ref<any[]>;
  localJournalSettings: Ref<any>;
  journalId: Ref<string>;
  journalSettings: Ref<any>;
}

export function useSessionGrades(opts: UseSessionGradesOptions) {
  const {
    canonicalTemplate,
    getStoreIndexForCanonicalIndex,
    getStoreIndexForDatePosition,
    marksByStudentId,
    students,
    localJournalSettings,
    journalId,
    journalSettings,
  } = opts;
  const marksStore = useMarksStore();

  const computeDayAverage = (
    studentId: string,
    datePos: number
  ): number | null => {
    if (!studentId || !journalId.value) return null;
    const storeColIndex = getStoreIndexForDatePosition(datePos);


    if (storeColIndex == null || storeColIndex < 0) {
      return null;
    }
    const studentMarks = marksStore.getStudentMarks(journalId.value, studentId);
    if (!studentMarks || storeColIndex >= studentMarks.length) {
      return null;
    }
    const values = studentMarks[storeColIndex]?.values || [];
    const nums = values
      .map((v) =>
        v !== null && v !== "" && !isNaN(Number(v)) ? Number(v) : null
      )
      .filter((v): v is number => v !== null);


    if (nums.length === 0) return null;
    const avg = nums.reduce((s, v) => s + v, 0) / nums.length;
    return avg;
  };

  const computeSessionGradeForStudent = (
    studentId: string,
    sessionDateIndices: number[],
    method: "only-assigned" | "all-days"
  ): string | null => {

    if (sessionDateIndices.length === 0) {
      return null;
    }

    if (method === "all-days") {
      const totalDays = sessionDateIndices.length;
      if (totalDays === 0) return null;
      let sum = 0;
      const dayAverages: Array<{ idx: number; avg: number | null }> = [];
      sessionDateIndices.forEach((idx) => {
        const dayAvg = computeDayAverage(studentId, idx);
        dayAverages.push({ idx, avg: dayAvg });
        sum += dayAvg ?? 0;
      });
      const grade = sum / totalDays;
      return grade.toFixed(1);
    }

    // only-assigned
    let sum = 0;
    let count = 0;
    const dayAverages: Array<{ idx: number; avg: number | null }> = [];
    sessionDateIndices.forEach((idx) => {
      const dayAvg = computeDayAverage(studentId, idx);
      dayAverages.push({ idx, avg: dayAvg });
      if (dayAvg !== null) {
        sum += dayAvg;
        count += 1;
      }
    });


    if (count === 0) {
      return null;
    }
    const grade = sum / count;
    return grade.toFixed(1);
  };

  const computeAllSessionGrades = async (opts?: {
    force?: boolean;
    labels?: Array<string | RegExp>;
    studentIds?: string[];
  }) => {
    const force = !!opts?.force;
    const calculationType =
      journalSettings.value?.calculationType ||
      localJournalSettings.value.calculationType ||
      "calculated";


    if (!journalId.value) {
      return;
    }
    if (!force && calculationType !== "calculated") {
      return;
    }

    // IMPORTANT: Intermediate controls (РК1, РК2) should ONLY be computed manually
    // when the user clicks the "Расчитать" button (force: true)
    // Automatic computation should NOT compute intermediate controls
    if (!force) {
      return;
    }

    const canonical = canonicalTemplate.value;
    if (!Array.isArray(canonical) || canonical.length === 0) {
      return;
    }

    const matchesLabel = (label: string | undefined) => {
      if (!opts?.labels || opts.labels.length === 0) return true;
      const safeLabel = label || "";
      return opts.labels.some((rule) =>
        typeof rule === "string" ? rule === safeLabel : rule.test(safeLabel)
      );
    };

    const calculationMethod =
      journalSettings.value?.calculationMethod ||
      localJournalSettings.value.calculationMethod ||
      "only-assigned";


    const sessionColumns = canonical
      .map((mark, canonicalIndex) => ({ mark, canonicalIndex }))
      .filter(({ mark }) =>
        mark?.type === "session" &&
        mark?.controlType === "intermediate" &&
        matchesLabel(mark.label)
      );


    if (sessionColumns.length === 0) {
      return;
    }

    let allStudents = marksStore.getJournalStudentMarks(journalId.value);
    if (!Array.isArray(allStudents) || allStudents.length === 0) {
      return;
    }

    // Filter by selected student IDs if provided
    const filteredStudents = opts?.studentIds
      ? allStudents.filter(s => opts.studentIds!.includes(s.studentId))
      : allStudents;


    // Collect all update promises to await them together
    const updatePromises: Promise<boolean>[] = [];

    sessionColumns.forEach(({ mark, canonicalIndex }) => {
      const sessionMark = mark as Mark;
      const dateIndices = Array.isArray(sessionMark.sessionDateIndices)
        ? sessionMark.sessionDateIndices
        : [];
      const storeIndex = getStoreIndexForCanonicalIndex(canonicalIndex);


      if (storeIndex == null || storeIndex < 0) {
        return;
      }

      filteredStudents.forEach((studentMark) => {
        const grade = computeSessionGradeForStudent(
          studentMark.studentId,
          dateIndices,
          calculationMethod
        );

        const existingValue =
          studentMark.marks?.[storeIndex]?.values?.[0] ?? null;


        if (existingValue === grade) return;

        // Queue the update and collect the promise
        const updatePromise = marksStore.updateStudentMark(
          journalId.value!,
          studentMark.studentId,
          storeIndex,
          0,
          grade
        );
        updatePromises.push(updatePromise);
      });
    });

    // Wait for all session grade updates to complete before returning
    await Promise.all(updatePromises);

  };

  /**
   * Check if all intermediate and final controls are calculated for a student.
   * A control is considered "calculated" if it has at least one non-empty value.
   * @param studentId - The ID of the student to check
   * @returns true if all controls have grades, false otherwise
   */
  const areAllControlsCalculated = (studentId: string): boolean => {
    if (!journalId.value) return false;

    // Get list of all controls from canonical template
    const canonical = canonicalTemplate.value;
    if (!Array.isArray(canonical) || canonical.length === 0) {
      // If no template, consider all calculated (nothing to check)
      return true;
    }

    // Filter only intermediate and final controls
    const controlColumns = canonical.filter((col): col is Mark => {
      return (
        col.type === "session" &&
        (col.controlType === "intermediate" || col.controlType === "final")
      );
    });

    // If no controls, consider all calculated
    if (controlColumns.length === 0) {
      return true;
    }

    // Get student's marks
    const studentMarks = marksStore.getStudentMarks(journalId.value, studentId);
    if (!studentMarks) {
      // No marks - controls not calculated
      return false;
    }

    // For each control, check if there's a non-empty grade
    for (const controlCol of controlColumns) {
      // Find corresponding mark in studentMarks
      const correspondingMark = studentMarks.find((mark: Mark) => {
        if (mark.type !== "session") return false;

        // Match by scheduledControlId (most accurate)
        if (
          controlCol.scheduledControlId &&
          mark.scheduledControlId === controlCol.scheduledControlId
        ) {
          return true;
        }

        // Alternatively by sessionId
        if (controlCol.sessionId && mark.sessionId === controlCol.sessionId) {
          return true;
        }

        // Alternatively by label (less reliable, but fallback)
        if (controlCol.label && mark.label === controlCol.label) {
          return true;
        }

        return false;
      });

      // If no corresponding mark found - control not calculated
      if (!correspondingMark) {
        return false;
      }

      // Check that there's at least one non-empty value
      const hasNonEmptyValue = correspondingMark.values.some(
        (value) => value !== null && value !== undefined && value !== ""
      );

      if (!hasNonEmptyValue) {
        return false;
      }
    }

    // All controls calculated
    return true;
  };

  const getStudentAverageScore = (studentId: string): string => {
    if (!journalId.value) return "—";

    const studentMarks = marksByStudentId.value.get(studentId);
    if (!studentMarks) return "—";

    const allMarks: (string | null)[] = [];

    // Collect all marks from all columns
    studentMarks.forEach((mark: any) => {
      mark.values.forEach((value: any) => {
        if (value !== null && value !== "") {
          allMarks.push(value);
        }
      });
    });

    // Filter out non-numeric values and convert to numbers
    const numericMarks = allMarks
      .filter((mark) => mark && !isNaN(Number(mark)))
      .map((mark) => Number(mark));

    if (numericMarks.length === 0) {
      return "—"; // Em dash for no scores
    }

    const average =
      numericMarks.reduce((sum, mark) => sum + mark, 0) / numericMarks.length;
    return average.toFixed(1);
  };

  const getStudentFinalGrade = (studentId: string): string => {
    if (!journalId.value) return "—";

    const studentMarks = marksByStudentId.value.get(studentId);
    if (!studentMarks) return "—";

    const canonical = canonicalTemplate.value || [];

    // Find all intermediate control columns (РК1, РК2, etc.)
    const intermediateControlColumns = canonical
      .map((mark: any, index: number) => ({ mark, index }))
      .filter(({ mark }) => mark?.type === "session" && mark?.controlType === "intermediate");

    // Find all final control columns (Экзамен/Зачет/etc.)
    const finalControlColumns = canonical
      .map((mark: any, index: number) => ({ mark, index }))
      .filter(({ mark }) => mark?.type === "session" && mark?.controlType === "final");

    // If no intermediate controls are scheduled, return "—"
    if (intermediateControlColumns.length === 0) {
      return "—";
    }

    // Check if student has values for ALL intermediate controls
    const rkGrades: number[] = [];

    for (const { mark, index: canonicalIndex } of intermediateControlColumns) {
      const storeColIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

      if (storeColIndex == null || storeColIndex < 0) {
        return "—";
      }

      if (storeColIndex >= studentMarks.length) {
        return "—";
      }

      const markValues = studentMarks[storeColIndex].values;
      const rkValue = markValues?.[0];

      if (rkValue === null || rkValue === "" || rkValue === undefined) {
        return "—";
      }

      // Try to parse as number
      const numericValue = Number(rkValue);
      if (isNaN(numericValue)) {
        return "—";
      }

      rkGrades.push(numericValue);
    }

    // If we collected fewer grades than expected, some РК are missing
    if (rkGrades.length < intermediateControlColumns.length) {
      return "—";
    }

    // 1) (РК1 + РК2) / 2 = итоговая (если нет экзамена/зачета)
    // 2) Если есть итоговый контроль (экзамен/зачет):
    //    итог = avg(РК) * 0.6 + оценка_экзамена * 0.4
    const rkAverage = rkGrades.reduce((sum, grade) => sum + grade, 0) / rkGrades.length;

    if (finalControlColumns.length === 0) {
      return rkAverage.toFixed(1);
    }

    const finalGrades: number[] = [];
    for (const { mark, index: canonicalIndex } of finalControlColumns) {
      const storeColIndex = getStoreIndexForCanonicalIndex(canonicalIndex);

      if (storeColIndex == null || storeColIndex < 0) continue;
      if (storeColIndex >= studentMarks.length) continue;

      const markValues = studentMarks[storeColIndex].values;
      const finalValue = markValues?.[0];

      if (finalValue === null || finalValue === "" || finalValue === undefined) {
        continue;
      }

      const numericValue = Number(finalValue);
      if (isNaN(numericValue)) {
        continue;
      }

      finalGrades.push(numericValue);
    }

    if (finalGrades.length === 0) {
      return "—";
    }

    const finalControlAverage =
      finalGrades.reduce((sum, grade) => sum + grade, 0) / finalGrades.length;

    const intWeight = localJournalSettings.value.finalGradeFormula?.intermediateWeight ?? 0.6;
    const finWeight = localJournalSettings.value.finalGradeFormula?.finalWeight ?? 0.4;
    const weighted = rkAverage * intWeight + finalControlAverage * finWeight;

    return weighted.toFixed(1);
  };

  const monitoringGradeStats = computed(() => {
    const counts: Record<string, number> = {};
    for (const bucket of LETTER_GRADE_BUCKETS) counts[bucket.letter] = 0;
    let totalGraded = 0;
    for (const student of students.value) {
      const finalRaw = getStudentFinalGrade(student.studentId);
      const finalNum = Number(finalRaw);
      if (!finalRaw || finalRaw === "—" || isNaN(finalNum)) continue;
      // Final grades are on the 0-5 scale; LETTER_GRADE_BUCKETS are 0-100.
      counts[scoreToLetter(finalNum * 20)] += 1;
      totalGraded += 1;
    }
    return {
      entries: LETTER_GRADE_BUCKETS.map((b) => ({
        letter: b.letter,
        count: counts[b.letter],
      })),
      totalGraded,
    };
  });

  // Increased delay from 150ms to 500ms to ensure user edits (300ms) complete first
  const scheduleRecomputeSessionGrades = debounce(async () => {
    await computeAllSessionGrades();
  }, 500);

  return {
    computeDayAverage,
    computeSessionGradeForStudent,
    computeAllSessionGrades,
    areAllControlsCalculated,
    getStudentAverageScore,
    getStudentFinalGrade,
    monitoringGradeStats,
    scheduleRecomputeSessionGrades,
  };
}
