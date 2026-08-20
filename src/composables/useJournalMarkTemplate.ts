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

import dayjs from "@/lib/dayjs";
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
import {
  initialValuesForType,
  resolveScheduleIds,
  countLessonsInRange,
  computeInsertAfter,
  insertControlMarks,
} from "@/lib/journalDateMatrix";
import type { Mark } from "@/types/marks";
import type { EducationSchedule } from "@/types/education-schedule";
import type { CalendarEvent } from "@/types/calendar";

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
      const rows = countLessonsInRange(schedulesArr, startId, endId);

      dateMarks.push({
        type: "date",
        date: dateStr,
        values: initialValuesForType("date", rows),
        label: dateStr,
        isoDate,
      });
    });

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
      const insertAfterDatePos = computeInsertAfter(dateMeta, start, end, lastDatePos);
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

    return insertControlMarks(dateMarks, controlInsertions);
  };

  return { buildMarkTemplate };
}
