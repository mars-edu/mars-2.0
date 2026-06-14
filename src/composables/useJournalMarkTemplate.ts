/**
 * useJournalMarkTemplate
 *
 * Extracts the "generate mark template" logic from JournalTab so that
 * IndividualJournalsInlineView (and any other consumer) can build the
 * same column structure for an arbitrary CalendarEvent without
 * duplicating the heavy store-plumbing code.
 *
 * Usage:
 *   const { buildMarkTemplate } = useJournalMarkTemplate();
 *   const template = buildMarkTemplate(childEvent);
 */

import dayjs from "dayjs";
import { storeToRefs } from "pinia";
import {
  DATE_DAY_MONTH_FORMAT,
  DATE_YEAR_FORMAT,
  DATE_STORAGE_FORMAT,
} from "@/constants/calendar";
import { getEventDays, type SemesterInfo } from "@/utils/eventDate";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import type { Mark } from "@/types/marks";
import type { EducationSchedule } from "@/types/education-schedule";
import type { CalendarEvent } from "@/types/calendar";

// ---------------------------------------------------------------------------
// Pure helpers (mirrors JournalTab helpers, kept private to this module)
// ---------------------------------------------------------------------------

type MarkType = "date" | "session";

const MARK_TYPE_MAP: Record<MarkType, { singleRow: boolean }> = {
  date: { singleRow: false },
  session: { singleRow: true },
};

const initialValuesForType = (type: MarkType, dynamicRows: number): Array<null> =>
  MARK_TYPE_MAP[type]?.singleRow
    ? [null]
    : Array.from({ length: Math.max(1, dynamicRows) }, () => null);

const timeToMinutes = (time: string | undefined | null): number | null => {
  if (!time || typeof time !== "string") return null;
  const parts = time.split(":");
  if (parts.length < 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
};

const normalizeTime = (time?: string): string | undefined => {
  if (!time) return time;
  const parts = time.split(":");
  if (parts.length < 2) return time;
  return `${String(Number(parts[0])).padStart(2, "0")}:${String(Number(parts[1])).padStart(2, "0")}`;
};

const findScheduleIdByStartTime = (
  schedules: EducationSchedule[],
  startTime: string
): string | undefined => {
  const normalized = normalizeTime(startTime);
  const exact = schedules.find((s) => normalizeTime(s.startTime) === normalized);
  if (exact) return exact.id;
  const targetMin = timeToMinutes(normalized) ?? 0;
  const candidate = schedules
    .map((s) => ({ s, start: timeToMinutes(s.startTime) ?? 0 }))
    .filter((x) => x.start >= targetMin)
    .sort((a, b) => a.start - b.start)[0]?.s;
  return candidate?.id || schedules[0]?.id;
};

const findScheduleIdByEndTime = (
  schedules: EducationSchedule[],
  endTime: string
): string | undefined => {
  const normalized = normalizeTime(endTime);
  const exact = schedules.find((s) => normalizeTime(s.endTime) === normalized);
  if (exact) return exact.id;
  const targetMin = timeToMinutes(normalized) ?? 24 * 60;
  const candidate = schedules
    .map((s) => ({ s, end: timeToMinutes(s.endTime) ?? 0 }))
    .filter((x) => x.end <= targetMin)
    .sort((a, b) => b.end - a.end)[0]?.s;
  return candidate?.id || schedules[schedules.length - 1]?.id;
};

const resolveScheduleIds = (
  daySchedule: any,
  schedules: EducationSchedule[]
): { startId?: string; endId?: string } => {
  let startId = daySchedule?.startId as string | undefined;
  let endId = daySchedule?.endId as string | undefined;
  if ((!startId || !endId) && daySchedule) {
    if (!startId && daySchedule?.startTime) {
      startId = findScheduleIdByStartTime(schedules, daySchedule.startTime);
    }
    if (!endId && daySchedule?.endTime) {
      endId = findScheduleIdByEndTime(schedules, daySchedule.endTime);
    }
  }
  return { startId, endId };
};

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useJournalMarkTemplate() {
  const educationScheduleStore = useEducationScheduleStore();
  const rupEntryStore = useRupEntryStore();
  const academicYearSemesterStore = useAcademicYearSemesterStore();
  const intermediateControlStore = useIntermediateControlStore();
  const finalControlStore = useFinalControlStore();
  const scheduledIntermediateControlStore = useScheduledIntermediateControlStore();
  const scheduledFinalControlStore = useScheduledFinalControlStore();

  const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);
  const { getRupEntryById } = storeToRefs(rupEntryStore);
  const { getAcademicYearSemesterById } = storeToRefs(academicYearSemesterStore);
  const { getIntermediateControlById } = storeToRefs(intermediateControlStore);
  const { getFinalControlById } = storeToRefs(finalControlStore);
  const { getScheduledIntermediateControlsByAcademicYear } = storeToRefs(
    scheduledIntermediateControlStore
  );
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

  /**
   * Build the mark-column template for a given CalendarEvent.
   * Mirrors the `generateDates()` function in JournalTab.vue exactly,
   * but reads the event from the argument instead of a component prop.
   */
  const buildMarkTemplate = (event: CalendarEvent): Mark[] => {
    const weeklySchedules = event.weeklySchedules || [];
    const dateMarks: Mark[] = [];

    // Semester info for fallback date range
    const activeSemester = academicYearSemesterStore.getActiveAcademicYearSemester;
    const semesterInfo: SemesterInfo | undefined = activeSemester
      ? { startDate: activeSemester.startDate, endDate: activeSemester.endDate }
      : undefined;

    const days = getEventDays(event as any, semesterInfo);

    days.forEach(({ day, weekId }) => {
      const dateStr = `${day.format(DATE_DAY_MONTH_FORMAT)}\n${day.format(DATE_YEAR_FORMAT)}`;
      const isoDate = day.format(DATE_STORAGE_FORMAT);

      const daySchedule = weeklySchedules.find((ws: any) => ws.weekId === weekId) as any;
      const schedulesArr = (getActiveYearSchedules.value || []) as EducationSchedule[];
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

    // --- resolve rupEntry and semester filter ---
    const rupEntryId = event.rupEntryId;
    const rupEntryItem = rupEntryId && typeof getRupEntryById.value === "function"
      ? (getRupEntryById.value(rupEntryId) as any)
      : null;

    const semesterFilter = event.semester ? String(event.semester) : null;
    const currentSemester =
      semesterFilter && typeof getAcademicYearSemesterById.value === "function"
        ? getAcademicYearSemesterById.value(semesterFilter)
        : null;
    const academicYearId =
      (currentSemester as any)?.academicYearId || rupEntryItem?.academicYearId;

    const dateMeta = dateMarks.map((mark, datePos) => {
      const iso = mark.isoDate;
      const parsed = iso ? dayjs(iso, DATE_STORAGE_FORMAT, true) : null;
      return {
        isoDate: iso,
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
    }[] = [];

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

      if (inRange.length > 0) return Math.max(...inRange);

      if (effectiveStart && effectiveStart.isValid()) {
        const before = dateMeta
          .filter((meta) => meta.day && meta.day.isBefore(effectiveStart, "day"))
          .map((meta) => meta.datePos);
        if (before.length > 0) {
          const maxBefore = Math.max(...before);
          if (before.length === dateMeta.length) return maxBefore + 1000;
          return maxBefore;
        }
        return -1;
      }

      return fallback;
    };

    const collectSessionDateIndices = (
      start: dayjs.Dayjs | null,
      end: dayjs.Dayjs | null
    ): number[] => {
      if (!dateMeta.length) return [];
      if (!start && !end) return [];
      return dateMeta
        .filter((meta) => {
          if (!meta.day) return false;
          if (start && start.isValid() && meta.day.isBefore(start, "day")) return false;
          if (end && end.isValid() && meta.day.isAfter(end, "day")) return false;
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
          .filter((meta) => meta.datePos > previousMax && meta.datePos <= insertAfterDatePos)
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
        (baseControl as any)?.shortName ||
        (baseControl as any)?.name ||
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
        start?.valueOf?.() ?? Number.MAX_SAFE_INTEGER - (type === "final" ? 1 : 2);

      controlInsertions.push({
        mark,
        insertAfterDatePos,
        sortKey,
        secondarySortKey: String(rawControl.id ?? ""),
      });

      seenSessionIds.add(rawControl.id);
    };

    // --- relevant distribution entries ---
    const relevantDistributionEntries = (rupEntryItem?.distributionEntries || [])
      .filter((entry: any) => {
        if (!semesterFilter) return true;
        if (entry?.semesterId == null) return false;
        return String(entry.semesterId) === semesterFilter;
      })
      .filter((entry: any) => {
        if (!academicYearId) return true;
        return String(entry?.academicYearId ?? "") === String(academicYearId);
      });

    const uniqueIds = (values: Array<string | null | undefined>) =>
      Array.from(
        new Set(
          values.filter((v): v is string => typeof v === "string" && v.length > 0)
        )
      );

    const distributionFinalControlIds = uniqueIds(
      relevantDistributionEntries.map((e: any) => e.finalControlId)
    );

    const scheduledIntermediateForYear =
      academicYearId &&
      typeof getScheduledIntermediateControlsByAcademicYear.value === "function"
        ? getScheduledIntermediateControlsByAcademicYear.value(academicYearId) || []
        : [];

    const scheduledFinalForYear =
      academicYearId &&
      typeof getScheduledFinalControlsByAcademicYear.value === "function"
        ? getScheduledFinalControlsByAcademicYear.value(academicYearId) || []
        : [];

    // All intermediate controls (no distribution filter — mirrors JournalTab)
    const filteredScheduledIntermediate = scheduledIntermediateForYear;

    // Only distribution-linked final controls
    const filteredScheduledFinal = distributionFinalControlIds.length > 0
      ? scheduledFinalForYear.filter(
          (c: any) =>
            distributionFinalControlIds.includes(c.id) ||
            distributionFinalControlIds.includes(c.finalControlId)
        )
      : [];

    const intermediateControlIds = uniqueIds(
      filteredScheduledIntermediate.map((c: any) => c.intermediateControlId as string | null | undefined)
    );
    const finalControlIds = uniqueIds(
      filteredScheduledFinal.map((c: any) => c.finalControlId as string | null | undefined)
    );

    intermediateControlIds.forEach((controlId) => {
      const scheduled = (filteredScheduledIntermediate as any[])
        .filter((c) => c.intermediateControlId === controlId)
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
      scheduled.forEach((c) => registerScheduledControl("intermediate", controlId, c));
    });

    finalControlIds.forEach((controlId) => {
      const scheduled = (filteredScheduledFinal as any[])
        .filter((c) => c.finalControlId === controlId)
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));
      scheduled.forEach((c) => registerScheduledControl("final", controlId, c));
    });

    controlInsertions
      .sort((a, b) => {
        if (a.insertAfterDatePos !== b.insertAfterDatePos)
          return a.insertAfterDatePos - b.insertAfterDatePos;
        if (a.sortKey !== b.sortKey) return a.sortKey - b.sortKey;
        return a.secondarySortKey.localeCompare(b.secondarySortKey);
      })
      .forEach(({ mark, insertAfterDatePos }) => {
        let insertIndex = 0;
        if (insertAfterDatePos < 0) {
          insertIndex = 0;
        } else {
          let seenDates = -1;
          insertIndex = marksWithSessions.findIndex((m) => {
            if (m.type === "date") {
              seenDates += 1;
              if (seenDates === insertAfterDatePos) return true;
            }
            return false;
          });
          insertIndex =
            insertIndex === -1 ? marksWithSessions.length : insertIndex + 1;
        }
        marksWithSessions.splice(insertIndex, 0, mark);
      });

    return marksWithSessions;
  };

  return { buildMarkTemplate };
}
