/**
 * Journal grid column/date-template building. Extracted from JournalTab.vue
 * (Cluster A). Behavior-preserving move.
 *
 * Owns no mutable state — pure derivation of the canonical column template and
 * headers from the current event/rup-entry/journal and the scheduled controls.
 * Stores are resolved internally; component-specific reactive context is passed
 * in.
 */
import { computed, type Ref } from "vue";
import { storeToRefs } from "pinia";
import dayjs from "dayjs";
import {
  DATE_DAY_MONTH_FORMAT,
  DATE_YEAR_FORMAT,
  DATE_STORAGE_FORMAT,
} from "@/constants/calendar";
import { getEventDays, type SemesterInfo } from "@/utils/eventDate";
import type { Mark } from "@/types/marks";
import {
  type EducationSchedule,
  useEducationScheduleStore,
} from "@/stores/educationScheduleStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import {
  initialValuesForType,
  headerLabelFor,
  resolveScheduleIds,
} from "@/components/journal/journalGrid.lib";

const FINAL_SUMMARY_LABEL = "Итог";

export interface UseJournalColumnsOptions {
  currentEvent: Ref<any>;
  currentRupEntry: Ref<any>;
  currentJournal: Ref<any>;
  journalId: Ref<string>;
}

export function useJournalColumns(opts: UseJournalColumnsOptions) {
  const { currentEvent, currentRupEntry, currentJournal, journalId } = opts;

  const academicYearSemesterStore = useAcademicYearSemesterStore();
  const educationScheduleStore = useEducationScheduleStore();
  const rupEntryStore = useRupEntryStore();
  const intermediateControlStore = useIntermediateControlStore();
  const finalControlStore = useFinalControlStore();
  const scheduledIntermediateControlStore =
    useScheduledIntermediateControlStore();
  const scheduledFinalControlStore = useScheduledFinalControlStore();

  const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
  const { getAcademicYearSemesterById } = storeToRefs(
    academicYearSemesterStore
  );
  const { getRupEntryById } = storeToRefs(rupEntryStore);
  const { getIntermediateControlById } = storeToRefs(intermediateControlStore);
  const { getFinalControlById } = storeToRefs(finalControlStore);
  const { scheduledIntermediateControls, getScheduledIntermediateControlsByAcademicYear } =
    storeToRefs(scheduledIntermediateControlStore);
  const { getScheduledFinalControlsByAcademicYear } = storeToRefs(
    scheduledFinalControlStore
  );

  const countLessonsInRange = (startId?: string, endId?: string): number => {
    const schedules = (getActiveYearSchedules.value || []) as EducationSchedule[];
    if (!schedules.length) return 2;
    if (!startId && !endId) return 2;
    if (startId && !endId) endId = startId;
    if (!startId && endId) startId = endId;
    const start = schedules.find((s) => s.id === startId)?.lessonNumber;
    const end = schedules.find((s) => s.id === endId)?.lessonNumber;
    if (start == null || end == null) return 2;
    return Math.max(1, Math.abs(end - start) + 1);
  };

  const generateDates = () => {
    if (!currentEvent.value) {
      return Array.from({ length: 17 }, () => ({
        type: "date" as const,
        date: "",
        values: initialValuesForType("date", 2),
      }));
    }

    const weeklySchedules = currentEvent.value.weeklySchedules || [];
    const dateMarks: Mark[] = [];

    // Get active semester info for fallback date range
    const activeSemester =
      academicYearSemesterStore.getActiveAcademicYearSemester;
    const semesterInfo: SemesterInfo | undefined = activeSemester
      ? {
          startDate: activeSemester.startDate,
          endDate: activeSemester.endDate,
        }
      : undefined;


    const days = getEventDays(currentEvent.value as any, semesterInfo);


    days.forEach(({ day, weekId }) => {
      const dateStr = `${day.format(DATE_DAY_MONTH_FORMAT)}\n${day.format(
        DATE_YEAR_FORMAT
      )}`;
      const isoDate = day.format(DATE_STORAGE_FORMAT);

      // determine rows per day from weekly schedule by lesson ids; fallback from times
      const daySchedule = weeklySchedules.find(
        (ws: any) => ws.weekId === weekId
      ) as any;
      const schedulesArr = (getActiveYearSchedules.value ||
        []) as EducationSchedule[];
      const { startId, endId } = resolveScheduleIds(daySchedule, schedulesArr);
      const rows = countLessonsInRange(startId, endId);


      dateMarks.push({
        type: "date",
        date: dateStr,
        values: initialValuesForType("date", rows),
        label: dateStr,
        isoDate,
      });
    });


    const marksWithSessions: Mark[] = [...dateMarks];
    const event = currentEvent.value;
    const rupEntryItem = currentRupEntry.value as
      | (ReturnType<NonNullable<typeof getRupEntryById.value>> & {
          distributionEntries?: any[];
        })
      | null;
    const semesterFilter = event?.semester ? String(event.semester) : null;

    // Get academic year from semester (for intermediate/final controls)
    // instead of from discipline/РУП (rupEntryItem)
    const currentSemester =
      semesterFilter && typeof getAcademicYearSemesterById.value === "function"
        ? getAcademicYearSemesterById.value(semesterFilter)
        : null;
    const academicYearId = currentSemester?.academicYearId || rupEntryItem?.academicYearId;
    const dateMeta = dateMarks.map((mark, datePos) => {
      const isoDate = mark.isoDate;
      const parsed = isoDate ? dayjs(isoDate, DATE_STORAGE_FORMAT, true) : null;
      return {
        isoDate,
        day: parsed && parsed.isValid() ? parsed : null,
        datePos,
      };
    });

    const parseControlDate = (value?: string | null) => {
      if (!value) return null;
      const parsed = dayjs(value, DATE_STORAGE_FORMAT, true);
      if (parsed.isValid()) return parsed;
      const fallback = dayjs(value);
      return fallback.isValid() ? fallback : null;
    };

    const controlInsertions: {
      mark: Mark;
      insertAfterDatePos: number;
      sortKey: number;
      secondarySortKey: string;
      debug?: Record<string, unknown>;
    }[] = [];

    const relevantDistributionEntries = (rupEntryItem?.distributionEntries || [])
      .filter((entry: any) => {
        if (!semesterFilter) return true;
        if (entry?.semesterId == null) return false;

        // Match by UUID only
        return String(entry.semesterId) === semesterFilter;
      })
      .filter((entry: any) => {
        if (!academicYearId) return true;
        return String(entry?.academicYearId ?? "") === String(academicYearId);
      })
      .map((entry: any) => entry);



    const distributionIntermediateControlIds = Array.from(
      new Set(
        relevantDistributionEntries
          .map((entry: any) => entry.intermediateControlId)
          .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      )
    );

    const distributionFinalControlIds = Array.from(
      new Set(
        relevantDistributionEntries
          .map((entry: any) => entry.finalControlId)
          .filter((id: unknown): id is string => typeof id === "string" && id.length > 0)
      )
    );


    const scheduledIntermediateForYear =
      academicYearId &&
      typeof getScheduledIntermediateControlsByAcademicYear.value === "function"
        ? getScheduledIntermediateControlsByAcademicYear.value(academicYearId) ||
          []
        : [];

    const scheduledFinalForYear =
      academicYearId &&
      typeof getScheduledFinalControlsByAcademicYear.value === "function"
        ? getScheduledFinalControlsByAcademicYear.value(academicYearId) || []
        : [];


    // ALWAYS show intermediate controls (РК1, РК2) regardless of distribution,
    // but only the ones for this journal's semester (avoids showing the other
    // semester's РК as duplicate columns).
    const filteredScheduledIntermediate = scheduledIntermediateForYear.filter(
      (control: any) =>
        !semesterFilter ||
        control?.semesterId == null ||
        String(control.semesterId) === semesterFilter
    );

    // Only show final controls that are specified in distribution, and only for
    // this journal's semester (same guard as intermediates — the year-level
    // getter returns both semesters, so without this the other semester's final
    // leaks in as a duplicate Итог column).
    const filteredScheduledFinal = scheduledFinalForYear.filter(
      (control: any) => {
        if (distributionFinalControlIds.length === 0) {
          return false;
        }
        const semesterOk =
          !semesterFilter ||
          control?.semesterId == null ||
          String(control.semesterId) === semesterFilter;
        if (!semesterOk) return false;
        return (
          distributionFinalControlIds.includes(control.id) ||
          distributionFinalControlIds.includes(control.finalControlId)
        );
      }
    );


    const uniqueIds = (values: Array<string | null | undefined>) =>
      Array.from(
        new Set(
          values.filter((v): v is string => typeof v === "string" && v.length > 0)
        )
      );

    const intermediateControlIds = uniqueIds(
      filteredScheduledIntermediate.map(
        (control: any) =>
          control.intermediateControlId as string | null | undefined
      )
    );
    const finalControlIds = uniqueIds(
      filteredScheduledFinal.map(
        (control: any) => control.finalControlId as string | null | undefined
      )
    );




    const seenSessionIds = new Set<string>();
    const lastAssignedDatePosByControlKey = new Map<string, number>();

    const lastDatePos = dateMeta.length > 0 ? dateMeta.length - 1 : -1;

    const computeInsertAfter = (
      start: dayjs.Dayjs | null,
      end: dayjs.Dayjs | null,
      fallback: number
    ) => {
      if (!dateMeta.length) return -1;
      const effectiveStart = start;
      const effectiveEnd = end ?? start;
      const inRange = dateMeta
        .filter((meta) => {
          if (!meta.day) return false;
          const startsOk =
            !effectiveStart || !effectiveStart.isValid()
              ? true
              : !meta.day.isBefore(effectiveStart, "day");
          const endsOk =
            !effectiveEnd || !effectiveEnd.isValid()
              ? true
              : !meta.day.isAfter(effectiveEnd, "day");
          return startsOk && endsOk;
        })
        .map((meta) => meta.datePos);

      if (inRange.length > 0) {
        return Math.max(...inRange);
      }

      if (effectiveStart && effectiveStart.isValid()) {
        const before = dateMeta
          .filter((meta) => meta.day && meta.day.isBefore(effectiveStart, "day"))
          .map((meta) => meta.datePos);
        if (before.length > 0) {
          const maxBefore = Math.max(...before);
          const allBefore = before.length === dateMeta.length;
          if (allBefore) {
            return maxBefore + 1000;
          }
          return maxBefore;
        }
        // Control dated entirely before the first lesson (e.g. РК carrying the
        // wrong semester's dates) — append it after the lessons instead of
        // forcing it to the front of the grid.
        return lastDatePos >= 0 ? lastDatePos + 1000 : -1;
      }

      return fallback;
    };

    const collectSessionDateIndices = (
      start: dayjs.Dayjs | null,
      end: dayjs.Dayjs | null
    ) => {
      if (!dateMeta.length) return [] as number[];
      if (!start && !end) return [] as number[];
      return dateMeta
        .filter((meta) => {
          if (!meta.day) return false;
          if (start && start.isValid() && meta.day.isBefore(start, "day")) {
            return false;
          }
          if (end && end.isValid() && meta.day.isAfter(end, "day")) {
            return false;
          }
          return true;
        })
        .map((meta) => meta.datePos);
    };

    const registerScheduledControl = (
      type: "intermediate" | "final",
      controlId: string,
      rawControl: any
    ) => {
      if (!rawControl) return;
      if (seenSessionIds.has(rawControl.id)) return;

      const start = parseControlDate(rawControl.startDate);
      const end = parseControlDate(rawControl.endDate) || start;
      const insertAfterDatePos = computeInsertAfter(start, end, lastDatePos);
      const controlKey = `${type}:${controlId}`;
      const previousMax = lastAssignedDatePosByControlKey.get(controlKey) ?? -1;


      let sessionDateIndices = collectSessionDateIndices(start, end)
        .filter((idx) => idx > previousMax)
        .filter((idx) => insertAfterDatePos < 0 || idx <= insertAfterDatePos);

      if (!sessionDateIndices.length && insertAfterDatePos >= 0) {
        sessionDateIndices = dateMeta
          .filter(
            (meta) =>
              meta.datePos > previousMax && meta.datePos <= insertAfterDatePos
          )
          .map((meta) => meta.datePos);
      }

      if (!sessionDateIndices.length) {
        sessionDateIndices = dateMeta
          .filter(
            (meta) =>
              meta.datePos > previousMax &&
              (insertAfterDatePos < 0 || meta.datePos <= insertAfterDatePos)
          )
          .map((meta) => meta.datePos);
      }

      if (!sessionDateIndices.length && insertAfterDatePos >= 0) {
        sessionDateIndices = [insertAfterDatePos];
      }

      if (!sessionDateIndices.length && dateMeta.length) {
        const nextMeta = dateMeta.find((meta) => meta.datePos > previousMax);
        sessionDateIndices = nextMeta
          ? [nextMeta.datePos]
          : [dateMeta[dateMeta.length - 1].datePos];
      }


      if (sessionDateIndices.length) {
        lastAssignedDatePosByControlKey.set(
          controlKey,
          Math.max(previousMax, ...sessionDateIndices)
        );
      }

      const baseControl =
        type === "intermediate"
          ? typeof getIntermediateControlById.value === "function"
            ? getIntermediateControlById.value(controlId)
            : null
          : typeof getFinalControlById.value === "function"
          ? getFinalControlById.value(controlId)
          : null;

      const label =
        (rawControl.shortName || "").trim() ||
        baseControl?.shortName ||
        baseControl?.name ||
        (type === "intermediate" ? "ПК" : "Итог");

      const mark: Mark = {
        type: "session",
        label,
        values: initialValuesForType("session", 1),
        sessionId: rawControl.id,
        sessionDateIndices,
        controlType: type,
        controlId,
        scheduledControlId: rawControl.id,
      };

      const sortKey =
        start?.valueOf?.() ??
        Number.MAX_SAFE_INTEGER - (type === "final" ? 1 : 2);

      controlInsertions.push({
        mark,
        insertAfterDatePos,
        sortKey,
        secondarySortKey: String(rawControl.id ?? ""),
        debug: {
          type,
          controlId,
          scheduledControlId: rawControl.id,
          dateRange: [rawControl.startDate, rawControl.endDate],
          sessionDateIndices,
          insertAfterDatePos,
          sortKey,
        },
      });

      seenSessionIds.add(rawControl.id);
    };

    intermediateControlIds.forEach((controlId) => {
      const scheduled = filteredScheduledIntermediate
        .filter((control) => control.intermediateControlId === controlId)
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

      if (!scheduled.length) {
        return;
      }


      scheduled.forEach((control) =>
        registerScheduledControl("intermediate", controlId, control)
      );
    });

    finalControlIds.forEach((controlId) => {
      const scheduled = filteredScheduledFinal
        .filter((control) => control.finalControlId === controlId)
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

      if (!scheduled.length) {
        return;
      }

      scheduled.forEach((control) =>
        registerScheduledControl("final", controlId, control)
      );
    });

    controlInsertions
      .sort((a, b) => {
        if (a.insertAfterDatePos !== b.insertAfterDatePos) {
          return a.insertAfterDatePos - b.insertAfterDatePos;
        }
        if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
        return a.secondarySortKey.localeCompare(b.secondarySortKey);
      })
      .forEach(({ mark, insertAfterDatePos, debug }) => {
        let insertIndex = 0;
        if (insertAfterDatePos < 0) {
          insertIndex = 0;
        } else {
          let seenDates = -1;
          insertIndex = marksWithSessions.findIndex((m) => {
            if (m.type === "date") {
              seenDates += 1;
              if (seenDates === insertAfterDatePos) {
                return true;
              }
            }
            return false;
          });
          insertIndex =
            insertIndex === -1 ? marksWithSessions.length : insertIndex + 1;
        }

        // Controls are processed in ascending sorted order. Advance past any
        // controls already inserted right after this same date anchor so equal-
        // anchor controls keep their sorted order instead of being reversed.
        while (
          insertIndex < marksWithSessions.length &&
          (marksWithSessions[insertIndex] as any).type !== "date"
        ) {
          insertIndex++;
        }


        marksWithSessions.splice(insertIndex, 0, mark);
      });



    return marksWithSessions;
  };

  // Canonical template derived from current event/sessions/schedules
  const canonicalTemplate = computed(() => generateDates());

  const getCanonicalRows = (canonicalCol: number): number => {
    if (canonicalCol < 0) return 1;
    const col = canonicalTemplate.value?.[canonicalCol];
    return Array.isArray(col?.values) ? col.values.length : 2;
  };

  const getRowIndices = (canonicalCol: number): number[] => {
    const n = getCanonicalRows(canonicalCol);
    return Array.from({ length: n }, (_, i) => i);
  };

  const tableHeaders = computed(() => {
    const canonical = canonicalTemplate.value || [];
    return canonical.map((mark: any, index: number) => ({
      type: mark.type,
      label: headerLabelFor(mark),
      index,
      dynamicRows: getCanonicalRows(index),
      isoDate: mark.isoDate,
    }));
  });

  const visibleHeaders = computed(() => {
    const baseHeaders = tableHeaders.value
      .map((header, displayIndex) => ({
        ...header,
        displayIndex,
        isFinalSummary: false,
      }))
      .filter(
        (h) => h.type !== "date" || (h.label && String(h.label).trim() !== "")
      );

    const finalHeader = {
      type: "final-summary",
      label: FINAL_SUMMARY_LABEL,
      index: -1,
      displayIndex: baseHeaders.length,
      isFinalSummary: true,
      dynamicRows: 1,
    };

    return [...baseHeaders, finalHeader];
  });

  const visibleColumnIndices = computed(() => {
    return visibleHeaders.value.map((h) => h.index);
  });

  return {
    generateDates,
    canonicalTemplate,
    getCanonicalRows,
    getRowIndices,
    tableHeaders,
    visibleHeaders,
    visibleColumnIndices,
  };
}
