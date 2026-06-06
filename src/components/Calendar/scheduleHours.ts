/**
 * Pure hour math for event schedules and individual-journal budgets.
 * Extracted from useEventFormDerived.selectedHours so the wizard's
 * per-journal hour totals use the same units (hours per week × weeks)
 * as the «План» badge — fixing the old slot-count-vs-semester-total
 * mismatch.
 */

export interface ScheduleSlotLike {
  startId?: string;
  endId?: string;
}

export function computeWeeklySlotHours(
  slots: ScheduleSlotLike[],
  scheduleIds: string[]
): number {
  let hoursPerWeek = 0;
  for (const slot of slots) {
    if (!slot.startId || !slot.endId) continue;
    const startIndex = scheduleIds.indexOf(slot.startId);
    const endIndex = scheduleIds.indexOf(slot.endId);
    if (startIndex !== -1 && endIndex !== -1 && endIndex >= startIndex) {
      hoursPerWeek += endIndex - startIndex + 1;
    }
  }
  return hoursPerWeek;
}

export function computeScheduleHours(
  slots: ScheduleSlotLike[],
  scheduleIds: string[],
  weekCount: number
): number {
  if (weekCount <= 0) return 0;
  return computeWeeklySlotHours(slots, scheduleIds) * weekCount;
}

interface RupEntryLike {
  individualHours?: string;
  individualAdditionalHours?: string;
  distributionEntries?: Array<{
    semesterId?: string;
    academicYearId?: string;
    individualHours?: string;
  }>;
}

interface SemesterContext {
  semesterId: string;
  semesterNumber: string;
  academicYearId: string;
}

const num = (v: string | undefined | null): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Individual-hours budget for one semester. Same matching rules as
 * useEventFormDerived.semesterPlannedHours; falls back to the RUP entry's
 * top-level fields (individualAdditionalHours wins over individualHours,
 * mirroring RupEntryViewPopover's display convention).
 */
export function resolveIndividualBudget(
  entry: RupEntryLike | null | undefined,
  semester: SemesterContext
): number {
  if (!entry) return 0;

  const matched = (entry.distributionEntries || []).find((d) => {
    const entrySemesterId = String(d.semesterId ?? "");
    const matchesSemester =
      entrySemesterId === semester.semesterId ||
      entrySemesterId === semester.semesterNumber;
    if (!d.academicYearId || !semester.academicYearId) return matchesSemester;
    return d.academicYearId === semester.academicYearId && matchesSemester;
  });

  if (matched && num(matched.individualHours) > 0) {
    return num(matched.individualHours);
  }
  return num(entry.individualAdditionalHours) || num(entry.individualHours);
}
