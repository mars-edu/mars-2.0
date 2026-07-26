import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import type { Student } from "@/types/student";
import { getEventDays, parseEventDate } from "@/utils/eventDate";
import type {
  WorkloadEntry,
  WorkloadSummaryEntry,
  MonthlyDistributionEntry,
  MonthInfo,
  MonthWorkloadData,
} from "@/lib/excel/workloadExport.types";
import type { JournalMarks } from "@/types/marks";
import type { CalendarEvent, WeeklySchedule } from "@/types/calendar";
import type { RupEntry } from "@/types/rup-entry";
import type { AcademicYearSemester } from "@/types/academic-year-semester";
import type { Journal } from "@/types/journal";
import type { AcademicYear } from "@/types/academic-year";
import { DEFAULT_ACADEMIC_HOUR_MINUTES } from "@/types/academic-year";

/**
 * Resolve the academic-hour length (in minutes) for a given RUP entry's
 * academic year. Falls back to the KZ standard (45 min) when the year
 * list wasn't supplied or the entry's year has no override set — this is
 * distinct from the lower-level `calculateLessonHours` default of 60
 * (astronomic minutes), which is used only by callers that never opt in
 * to per-year resolution.
 */
function resolveAcademicHourMinutes(
  rupEntry: { academicYearId?: string },
  academicYears?: AcademicYear[]
): number {
  if (!academicYears || !rupEntry.academicYearId) {
    return DEFAULT_ACADEMIC_HOUR_MINUTES;
  }
  const year = academicYears.find((y) => y.id === rupEntry.academicYearId);
  return year?.academicHourMinutes ?? DEFAULT_ACADEMIC_HOUR_MINUTES;
}

/**
 * Calculate lesson hours from time range
 * @param startTime Time string in format "HH:mm" (e.g., "09:00")
 * @param endTime Time string in format "HH:mm" (e.g., "10:30")
 * @returns Number of hours (can be fractional, e.g., 1.5)
 */
export function calculateLessonHours(
  startTime?: string,
  endTime?: string,
  academicHourMinutes: number = 60
): number {
  if (!startTime || !endTime) {
    // Default to 1 hour if times not specified
    return 1;
  }

  try {
    const start = dayjs(`2000-01-01 ${startTime}`, "YYYY-MM-DD HH:mm");
    const end = dayjs(`2000-01-01 ${endTime}`, "YYYY-MM-DD HH:mm");

    if (!start.isValid() || !end.isValid()) {
      console.warn(
        `Invalid time format: ${startTime} - ${endTime}, defaulting to 1 hour`
      );
      return 1;
    }

    const diffMinutes = end.diff(start, "minute");
    if (diffMinutes <= 0) {
      console.warn(
        `Invalid time range: ${startTime} - ${endTime}, defaulting to 1 hour`
      );
      return 1;
    }

    // Convert minutes to hours (e.g., 90 minutes = 1.5 hours)
    return diffMinutes / academicHourMinutes;
  } catch (error) {
    console.error("Error calculating lesson hours:", error);
    return 1;
  }
}

/**
 * Calculate specific lesson dates from calendar event with weekly schedules
 * @param event Calendar event with date range and weekly schedules
 * @param filterStartDate Optional start date to filter results
 * @param filterEndDate Optional end date to filter results
 * @returns Array of lesson occurrences with date, weekId, and hours
 */
export function calculateLessonDates(
  event: CalendarEvent,
  filterStartDate?: Date,
  filterEndDate?: Date,
  academicHourMinutes: number = 60
): { date: dayjs.Dayjs; weekId: number; hours: number }[] {
  // Generate all event days based on weekly schedules
  const eventDays = getEventDays(event);

  // Apply date filtering if provided
  let filteredDays = eventDays;
  if (filterStartDate || filterEndDate) {
    const start = filterStartDate ? dayjs(filterStartDate) : null;
    const end = filterEndDate ? dayjs(filterEndDate) : null;

    filteredDays = eventDays.filter((eventDay) => {
      if (start && eventDay.day.isBefore(start, "day")) return false;
      if (end && eventDay.day.isAfter(end, "day")) return false;
      return true;
    });
  }

  // Calculate hours for each lesson occurrence
  return filteredDays.map((eventDay) => {
    // Find the corresponding weekly schedule for this day
    const weeklySchedule = event.weeklySchedules?.find(
      (ws) => ws.weekId === eventDay.weekId
    );

    // Calculate hours from the weekly schedule's time range
    const hours = calculateLessonHours(
      weeklySchedule?.startTime,
      weeklySchedule?.endTime,
      academicHourMinutes
    );

    return {
      date: eventDay.day,
      weekId: eventDay.weekId,
      hours,
    };
  });
}

/**
 * Generate group name from students
 * Similar logic to journal store's generateJournalTitle
 */
function generateGroupName(students: Student[]): string {
  if (students.length === 0) return "Без группы";

  // Get unique courses
  const courses = [...new Set(students.map((s) => (s as any).course))].sort();

  if (courses.length === 1) {
    // Single course group
    const firstStudent = students[0];
    const courseStr = `${courses[0]}к`;
    const specialty = firstStudent.specialty || "";
    const language = firstStudent.language === "kaz" ? " (каз)" : "";
    return `${courseStr} ${specialty}${language}`.trim();
  } else {
    // Mixed course group
    return `${courses[0]}-${courses[courses.length - 1]}к Смешанная`;
  }
}

/**
 * Calculate actual taught hours from journal marks
 * Returns daily breakdown, monthly actual hours, and cumulative year-to-date hours
 */
function calculateActualHours(
  event: CalendarEvent,
  rupEntry: RupEntry,
  groupName: string,
  lessonDates: { date: dayjs.Dayjs; weekId: number; hours: number }[],
  journals: Journal[],
  journalMarks: Record<string, JournalMarks>,
  month: number,
  year: number,
  academicYearStart: number,
  daysInMonth: number,
  academicHourMinutes: number = 60
): { dailyActualHours: (number | null)[]; actualHoursMonth: number; cumulativeHoursYear: number } {
  console.log(`[calculateActualHours] Looking for journal: event.id=${event.id}, rupEntry.id=${rupEntry.id}`);

  // Find the journal for this event
  const journal = journals.find(
    (j) => j.disciplineId === rupEntry.id && j.id === event.id.toString()
  );

  if (journal) {
    console.log(`[calculateActualHours] Journal found: id=${journal.id}, disciplineId=${journal.disciplineId}, group=${journal.group}`);
  } else {
    console.log(`[calculateActualHours] No journal found. Looking for event.id=${event.id.toString()}, rupEntry.id=${rupEntry.id}`);
    console.log(`[calculateActualHours] Available journals:`, journals.map(j => ({
      id: j.id,
      disciplineId: j.disciplineId,
      group: j.group,
      matchesEvent: j.id === event.id.toString(),
      matchesRupEntry: j.disciplineId === rupEntry.id
    })));
  }

  // Initialize daily hours array (null for all days)
  const dailyActualHours: (number | null)[] = Array(daysInMonth).fill(null);

  if (!journal) {
    // No journal found - fall back to scheduled hours
    console.warn(`[calculateActualHours] No journal found for event ${event.id}, rupEntry ${rupEntry.id}, using scheduled hours`);

    // Fill daily hours with scheduled hours
    lessonDates.forEach((lesson) => {
      const dayIndex = lesson.date.date() - 1;
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        dailyActualHours[dayIndex] = (dailyActualHours[dayIndex] || 0) + lesson.hours;
      }
    });

    const monthTotal = lessonDates.reduce((sum, lesson) => sum + lesson.hours, 0);
    return {
      dailyActualHours,
      actualHoursMonth: monthTotal,
      cumulativeHoursYear: monthTotal,
    };
  }

  // Get marks for this journal
  const marks = journalMarks[journal.id];
  console.log(`[calculateActualHours] Marks lookup for journal ${journal.id}:`, marks ? `found, ${marks.studentMarks?.length || 0} students` : 'not found');

  if (!marks || !marks.studentMarks || marks.studentMarks.length === 0) {
    // No marks found - fall back to scheduled hours
    console.warn(`[calculateActualHours] No marks for journal ${journal.id}, using scheduled hours`);
    lessonDates.forEach((lesson) => {
      const dayIndex = lesson.date.date() - 1;
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        dailyActualHours[dayIndex] = (dailyActualHours[dayIndex] || 0) + lesson.hours;
      }
    });

    const monthTotal = lessonDates.reduce((sum, lesson) => sum + lesson.hours, 0);
    return {
      dailyActualHours,
      actualHoursMonth: monthTotal,
      cumulativeHoursYear: monthTotal,
    };
  }

  // (Dead lessonDateMap dropped — never read downstream; actual-hours math
  // uses markedDates + per-day accumulator further below.)

  // Get all marked dates (dates where lesson was held based on journal marks)
  const markedDates = new Set<string>();
  marks.studentMarks.forEach((studentMark) => {
    studentMark.marks.forEach((mark) => {
      if (mark.type === "date" && mark.isoDate) {
        // Check if this mark has any non-null values (indicating lesson was held)
        const hasAttendance = mark.values && mark.values.some((v) => v !== null);
        if (hasAttendance) {
          markedDates.add(mark.isoDate);
        }
      }
    });
  });

  console.log(`[calculateActualHours] Marked dates (lessons held): ${markedDates.size}`, Array.from(markedDates).slice(0, 5));

  // Calculate actual hours for the current month AND fill daily hours array
  let actualHoursMonth = 0;
  lessonDates.forEach((lesson) => {
    const dateKey = lesson.date.format(DATE_STORAGE_FORMAT);
    if (markedDates.has(dateKey)) {
      // Lesson was taught (has marks in journal)
      actualHoursMonth += lesson.hours;

      // Fill in the daily hours array for this day
      const dayIndex = lesson.date.date() - 1; // 0-based day index
      if (dayIndex >= 0 && dayIndex < daysInMonth) {
        dailyActualHours[dayIndex] = (dailyActualHours[dayIndex] || 0) + lesson.hours;
      }
    }
    // If no marks, leave dailyActualHours[dayIndex] as null
  });

  // Calculate cumulative hours from September through current month
  // Need to recalculate ALL lesson dates from Sept-current month (not just current month)
  let cumulativeHoursYear = 0;
  const septemberStart = dayjs(new Date(academicYearStart, 8, 1)).startOf("day"); // Sept 1
  const currentMonthEnd = dayjs(new Date(year, month + 1, 0)).endOf("day"); // Last day of current month

  // Calculate all lesson dates for Sept through current month
  const allLessonDates = calculateLessonDates(
    event,
    septemberStart.toDate(),
    currentMonthEnd.toDate(),
    academicHourMinutes
  );

  // Create map of all lesson dates to hours for cumulative calculation
  const allLessonDateMap = new Map<string, number>();
  allLessonDates.forEach((lesson) => {
    const dateKey = lesson.date.format(DATE_STORAGE_FORMAT);
    allLessonDateMap.set(dateKey, (allLessonDateMap.get(dateKey) || 0) + lesson.hours);
  });

  // Sum hours for marked dates within Sept-current month
  markedDates.forEach((dateKey) => {
    const hours = allLessonDateMap.get(dateKey);
    if (hours) {
      const lessonDate = dayjs(dateKey);
      if (
        lessonDate.valueOf() >= septemberStart.valueOf() &&
        lessonDate.valueOf() <= currentMonthEnd.valueOf()
      ) {
        cumulativeHoursYear += hours;
      }
    }
  });

  const nonNullDays = dailyActualHours.filter(h => h !== null).length;
  console.log(`[calculateActualHours] Result: actualMonth=${actualHoursMonth}, cumulative=${cumulativeHoursYear}, nonNullDays=${nonNullDays}`);

  return {
    dailyActualHours,
    actualHoursMonth,
    cumulativeHoursYear,
  };
}

/**
 * Generate daily workload entries for a specific month
 * This populates Form 1 of the Excel report
 */
export function generateDailyWorkload(
  events: CalendarEvent[],
  rupEntryItems: RupEntry[],
  students: Student[],
  month: number, // 0-11 (JS month)
  year: number,
  academicYearStart: number, // Academic year start year (e.g., 2024 for 2024/2025)
  journals: Journal[],
  journalMarks: Record<string, JournalMarks>,
  academicYears?: AcademicYear[]
): WorkloadEntry[] {
  const entries: WorkloadEntry[] = [];

  console.log(`[Calculator] generateDailyWorkload called: month=${month}, year=${year}, events=${events.length}, journals=${journals.length}`);

  // Get month boundaries
  const monthStart = dayjs(new Date(year, month, 1)).startOf("day");
  const monthEnd = dayjs(new Date(year, month + 1, 0)).endOf("day"); // Last day of month
  const daysInMonth = monthEnd.date();

  console.log(`[Calculator] Month boundaries: ${monthStart.format(DATE_STORAGE_FORMAT)} to ${monthEnd.format(DATE_STORAGE_FORMAT)}, days: ${daysInMonth}`);

  // Group events by subject/group combination
  const eventGroups = new Map<
    string,
    {
      event: CalendarEvent;
      rupEntry: RupEntry;
      groupName: string;
      lessonDates: { date: dayjs.Dayjs; weekId: number; hours: number }[];
      academicHourMinutes: number;
    }
  >();

  for (const event of events) {
    // Get subject/module info
    const rupEntry = rupEntryItems.find((c) => c.id === event.rupEntryId);
    if (!rupEntry) {
      console.log(`[Calculator] Skipping event ${event.id}: no rupEntry found for rupEntryId=${event.rupEntryId}`);
      continue;
    }

    // Get group name from participants
    const eventStudents = students.filter((s) =>
      event.participants.includes(s.id)
    );
    const groupName = generateGroupName(eventStudents);

    const academicHourMinutes = resolveAcademicHourMinutes(rupEntry, academicYears);

    // Calculate lesson dates within the month
    const lessonDates = calculateLessonDates(
      event,
      monthStart.toDate(),
      monthEnd.toDate(),
      academicHourMinutes
    );

    if (lessonDates.length === 0) {
      console.log(`[Calculator] Event ${event.id} (${rupEntry.moduleName} - ${groupName}): no lessons in this month`);
      continue;
    }

    console.log(`[Calculator] Event ${event.id} (${rupEntry.moduleName} - ${groupName}): ${lessonDates.length} lessons found`);

    // Create unique key for subject/group combination
    const key = `${rupEntry.id}-${groupName}`;

    if (!eventGroups.has(key)) {
      eventGroups.set(key, {
        event,
        rupEntry,
        groupName,
        lessonDates,
        academicHourMinutes,
      });
    } else {
      // Merge lesson dates if same subject/group from multiple events
      const existing = eventGroups.get(key)!;
      existing.lessonDates.push(...lessonDates);
    }
  }

  // Convert grouped data to workload entries
  console.log(`[Calculator] Processing ${eventGroups.size} event groups into entries`);

  let rowNumber = 1;
  for (const [key, group] of eventGroups) {
    const plannedHours = parseFloat(group.rupEntry.totalHours) || 0;

    console.log(`[Calculator] Processing group: ${group.rupEntry.moduleName} - ${group.groupName}, planned=${plannedHours}, lessons=${group.lessonDates.length}`);

    // Calculate actual taught hours from journal marks (includes daily breakdown)
    const { dailyActualHours, actualHoursMonth, cumulativeHoursYear } = calculateActualHours(
      group.event,
      group.rupEntry,
      group.groupName,
      group.lessonDates,
      journals,
      journalMarks,
      month,
      year,
      academicYearStart,
      daysInMonth,
      group.academicHourMinutes
    );

    // Use actual hours from journal for daily columns
    const dailyHours = dailyActualHours;

    // monthTotal is sum of daily actual hours
    const monthTotal = dailyHours.reduce<number>(
      (sum: number, hours) => sum + (hours || 0),
      0
    );

    const actualHours = actualHoursMonth;
    const cumulativeHours = cumulativeHoursYear;
    const remainingHours = Math.max(0, plannedHours - cumulativeHours);

    entries.push({
      rowNumber,
      moduleIndex: group.rupEntry.moduleIndex,
      subjectName: group.rupEntry.moduleName,
      groupName: group.groupName,
      dailyHours,
      monthTotal,
      plannedHours,
      actualHours,
      cumulativeHours,
      remainingHours,
    });

    rowNumber++;
  }

  console.log(`[Calculator] Total entries created: ${entries.length}`);
  return entries;
}

/**
 * Generate workload summary entries (aggregated by subject/group)
 * This populates Form 2 of the Excel report
 */
export function generateWorkloadSummary(
  events: CalendarEvent[],
  rupEntryItems: RupEntry[],
  students: Student[],
  filterStartDate?: Date,
  filterEndDate?: Date,
  academicYears?: AcademicYear[]
): WorkloadSummaryEntry[] {
  const summaries: WorkloadSummaryEntry[] = [];

  // Group events by subject/group combination
  const eventGroups = new Map<
    string,
    {
      rupEntry: RupEntry;
      groupName: string;
      totalHours: number;
    }
  >();

  for (const event of events) {
    // Get subject/module info
    const rupEntry = rupEntryItems.find((c) => c.id === event.rupEntryId);
    if (!rupEntry) continue;

    // Get group name from participants
    const eventStudents = students.filter((s) =>
      event.participants.includes(s.id)
    );
    const groupName = generateGroupName(eventStudents);

    // Calculate lesson dates within the period
    const lessonDates = calculateLessonDates(
      event,
      filterStartDate,
      filterEndDate,
      resolveAcademicHourMinutes(rupEntry, academicYears)
    );

    // Sum total hours
    const totalHours = lessonDates.reduce(
      (sum, lesson) => sum + lesson.hours,
      0
    );

    if (totalHours === 0) continue;

    // Create unique key for subject/group combination
    const key = `${rupEntry.id}-${groupName}`;

    if (!eventGroups.has(key)) {
      eventGroups.set(key, {
        rupEntry,
        groupName,
        totalHours,
      });
    } else {
      // Merge hours if same subject/group from multiple events
      const existing = eventGroups.get(key)!;
      existing.totalHours += totalHours;
    }
  }

  // Convert grouped data to summary entries
  for (const [, group] of eventGroups) {
    const plannedHours = parseFloat(group.rupEntry.totalHours) || 0;
    const actualHours = group.totalHours;

    summaries.push({
      groupName: group.groupName,
      moduleIndex: group.rupEntry.moduleIndex,
      subjectName: group.rupEntry.moduleName,
      plannedHours,
      actualHours,
      // Facultative, consultations, and exams not currently tracked
      // Set to undefined to leave empty in export
      facultativePlanned: undefined,
      facultativeActual: undefined,
      consultationsPlanned: undefined,
      consultationsActual: undefined,
      examsPlanned: undefined,
      examsActual: undefined,
      totalHours: actualHours,
    });
  }

  return summaries;
}

/**
 * Month name mapping for display
 */
const MONTH_NAMES: Record<number, { key: string; name: string }> = {
  0: { key: "january", name: "қантар / январь" },
  1: { key: "february", name: "ақпан / февраль" },
  2: { key: "march", name: "наурыз / март" },
  3: { key: "april", name: "сәуір / апрель" },
  4: { key: "may", name: "мамыр / май" },
  5: { key: "june", name: "маусым / июнь" },
  6: { key: "july", name: "шілде / июль" },
  7: { key: "august", name: "тамыз / август" },
  8: { key: "september", name: "қыркүйек / сентябрь" },
  9: { key: "october", name: "қазан / октябрь" },
  10: { key: "november", name: "қараша / ноябрь" },
  11: { key: "december", name: "желтоқсан / декабрь" },
};

/**
 * Compute unique months from semester date ranges
 * Returns months sorted in chronological order (by actual date, not month number)
 */
export function computeMonthsFromSemesters(
  semesters: AcademicYearSemester[]
): MonthInfo[] {
  console.log("[computeMonthsFromSemesters] Input semesters:", semesters.length);
  semesters.forEach((sem, idx) => {
    console.log(`[computeMonthsFromSemesters] Semester ${idx}:`, {
      id: sem.id,
      semesterNumber: sem.semesterNumber,
      startDate: sem.startDate,
      endDate: sem.endDate,
    });
  });

  const monthsMap = new Map<string, { info: MonthInfo; sortKey: number }>();

  for (const semester of semesters) {
    if (!semester.startDate || !semester.endDate) {
      console.warn("[computeMonthsFromSemesters] Skipping semester with missing dates:", semester.id);
      continue;
    }

    const start = dayjs(semester.startDate);
    const end = dayjs(semester.endDate);

    console.log(`[computeMonthsFromSemesters] Processing semester ${semester.semesterNumber}:`, {
      startDate: semester.startDate,
      endDate: semester.endDate,
      startParsed: start.format(DATE_STORAGE_FORMAT),
      endParsed: end.format(DATE_STORAGE_FORMAT),
      startValid: start.isValid(),
      endValid: end.isValid(),
    });

    if (!start.isValid() || !end.isValid()) {
      console.warn("[computeMonthsFromSemesters] Invalid dates for semester:", semester.id);
      continue;
    }

    // Iterate through each month in the semester range
    let current = start.startOf("month");
    console.log(`[computeMonthsFromSemesters] Iterating from ${current.format("YYYY-MM")} to ${end.format("YYYY-MM")}`);

    while (current.isBefore(end) || current.isSame(end, "month")) {
      const year = current.year();
      const month = current.month(); // 0-11
      const uniqueKey = `${year}-${month}`;
      // Sort key: year * 12 + month gives chronological order
      const sortKey = year * 12 + month;

      if (!monthsMap.has(uniqueKey)) {
        const monthData = MONTH_NAMES[month];
        console.log(`[computeMonthsFromSemesters] Adding month:`, {
          uniqueKey,
          year,
          month,
          monthName: monthData.key,
          sortKey,
        });
        monthsMap.set(uniqueKey, {
          info: {
            key: monthData.key,
            name: monthData.name,
            year,
            month,
          },
          sortKey,
        });
      }

      current = current.add(1, "month");
    }
  }

  console.log("[computeMonthsFromSemesters] Total unique months found:", monthsMap.size);

  // Sort by sortKey (chronological order)
  const sorted = Array.from(monthsMap.values())
    .sort((a, b) => a.sortKey - b.sortKey);

  console.log("[computeMonthsFromSemesters] Sorted months:");
  sorted.forEach((item, idx) => {
    console.log(`  ${idx}: ${item.info.key} (${item.info.year}-${item.info.month}) sortKey=${item.sortKey}`);
  });

  return sorted.map((item) => item.info);
}

/**
 * Generate monthly distribution for the entire academic year
 * This populates Form 3 of the Excel report
 */
export function generateMonthlyDistribution(
  events: CalendarEvent[],
  rupEntryItems: RupEntry[],
  students: Student[],
  semesters: AcademicYearSemester[],
  academicYears?: AcademicYear[]
): { distributions: MonthlyDistributionEntry[]; months: MonthInfo[] } {
  console.log("[generateMonthlyDistribution] Starting with:", {
    eventsCount: events.length,
    rupEntryItemsCount: rupEntryItems.length,
    studentsCount: students.length,
    semestersCount: semesters.length,
  });

  if (!semesters || semesters.length === 0) {
    throw new Error("Semesters are required to compute monthly distribution. Please configure semester date ranges for the academic year.");
  }

  const distributions: MonthlyDistributionEntry[] = [];
  const academicMonths = computeMonthsFromSemesters(semesters);

  console.log("[generateMonthlyDistribution] Computed academic months:", academicMonths.length);
  console.log("[generateMonthlyDistribution] Month order:", academicMonths.map(m => `${m.key}(${m.year})`).join(", "));

  if (academicMonths.length === 0) {
    throw new Error("No valid months found in semester date ranges. Please check semester start and end dates.");
  }

  // Group events by group name
  const eventGroups = new Map<
    string,
    {
      groupName: string;
      monthlyHours: Map<string, number>;
    }
  >();

  for (const event of events) {
    // Get subject/module info
    const rupEntry = rupEntryItems.find((c) => c.id === event.rupEntryId);
    if (!rupEntry) continue;

    // Get group name from participants
    const eventStudents = students.filter((s) =>
      event.participants.includes(s.id)
    );
    const groupName = generateGroupName(eventStudents);

    // Calculate all lesson dates for this event
    const lessonDates = calculateLessonDates(
      event,
      undefined,
      undefined,
      resolveAcademicHourMinutes(rupEntry, academicYears)
    );

    // Group hours by month
    for (const lesson of lessonDates) {
      const monthKey = `${lesson.date.year()}-${lesson.date.month()}`;

      if (!eventGroups.has(groupName)) {
        eventGroups.set(groupName, {
          groupName,
          monthlyHours: new Map(),
        });
      }

      const group = eventGroups.get(groupName)!;
      const currentHours = group.monthlyHours.get(monthKey) || 0;
      group.monthlyHours.set(monthKey, currentHours + lesson.hours);
    }
  }

  // Convert grouped data to distribution entries
  for (const [, group] of eventGroups) {
    const monthlyHours: Record<string, number> = {};
    let total = 0;

    // Fill in monthly hours using dynamic months
    for (const monthInfo of academicMonths) {
      const monthKey = `${monthInfo.year}-${monthInfo.month}`;
      const hours = group.monthlyHours.get(monthKey) || 0;
      monthlyHours[monthInfo.key] = hours;
      total += hours;
    }

    if (total > 0) {
      distributions.push({
        groupName: group.groupName,
        ...monthlyHours,
        total,
      } as any);
    }
  }

  console.log("[generateMonthlyDistribution] Final result:", {
    distributionsCount: distributions.length,
    monthsCount: academicMonths.length,
    monthsOrder: academicMonths.map(m => m.key),
    firstDistribution: distributions[0] ? {
      groupName: distributions[0].groupName,
    } : null,
  });

  return { distributions, months: academicMonths };
}

/**
 * Generate workload data for all months in the academic year
 * This is used to populate Form 1 with multiple month sections
 */
export function generateAllMonthsWorkload(
  events: CalendarEvent[],
  rupEntryItems: RupEntry[],
  students: Student[],
  semesters: AcademicYearSemester[],
  journals: Journal[],
  journalMarks: Record<string, JournalMarks>,
  academicYears?: AcademicYear[]
): MonthWorkloadData[] {
  console.log("[generateAllMonthsWorkload] Starting...");

  // Compute months from semesters
  const months = computeMonthsFromSemesters(semesters);
  if (months.length === 0) {
    throw new Error("No months found in semester date ranges");
  }

  console.log("[generateAllMonthsWorkload] Months to process:", months.map(m => `${m.key}(${m.year})`).join(", "));

  // Get academic year start for cumulative calculations
  const academicYearStart = months[0].year;

  // First, collect all unique subject/group combinations across all events
  // This ensures we show all subjects in all months, even if they have no hours in some months
  const allSubjectGroups = new Map<string, {
    rupEntry: RupEntry;
    groupName: string;
    rowNumber: number;
  }>();

  let rowNumber = 1;
  for (const event of events) {
    const rupEntry = rupEntryItems.find((c) => c.id === event.rupEntryId);
    if (!rupEntry) continue;

    const eventStudents = students.filter((s) => event.participants.includes(s.id));
    const groupName = generateGroupName(eventStudents);
    const key = `${rupEntry.id}-${groupName}`;

    if (!allSubjectGroups.has(key)) {
      allSubjectGroups.set(key, { rupEntry, groupName, rowNumber });
      rowNumber++;
    }
  }

  console.log(`[generateAllMonthsWorkload] Found ${allSubjectGroups.size} unique subject/group combinations`);

  const allMonthsData: MonthWorkloadData[] = [];

  for (const monthInfo of months) {
    console.log(`[generateAllMonthsWorkload] Processing ${monthInfo.key} ${monthInfo.year}...`);

    // Generate workload entries for this month
    const monthEntries = generateDailyWorkload(
      events,
      rupEntryItems,
      students,
      monthInfo.month,
      monthInfo.year,
      academicYearStart,
      journals,
      journalMarks,
      academicYears
    );

    // Create a map of existing entries by subject/group key
    const existingEntriesMap = new Map<string, WorkloadEntry>();
    for (const entry of monthEntries) {
      const key = `${entry.moduleIndex}-${entry.subjectName}-${entry.groupName}`;
      existingEntriesMap.set(key, entry);
    }

    // Ensure all subject/group combinations are present in this month
    // Fill in missing ones with zero hours
    const daysInMonth = new Date(monthInfo.year, monthInfo.month + 1, 0).getDate();
    const entries: WorkloadEntry[] = [];

    for (const [key, subjectGroup] of allSubjectGroups) {
      const entryKey = `${subjectGroup.rupEntry.moduleIndex}-${subjectGroup.rupEntry.moduleName}-${subjectGroup.groupName}`;

      if (existingEntriesMap.has(entryKey)) {
        // Subject has hours this month - use existing entry
        entries.push(existingEntriesMap.get(entryKey)!);
      } else {
        // Subject has no hours this month - create empty entry
        const plannedHours = parseFloat(subjectGroup.rupEntry.totalHours) || 0;

        // Calculate cumulative hours from previous months
        let cumulativeHours = 0;
        for (const prevMonthData of allMonthsData) {
          const prevEntry = prevMonthData.entries.find(
            e => e.moduleIndex === subjectGroup.rupEntry.moduleIndex &&
                 e.subjectName === subjectGroup.rupEntry.moduleName &&
                 e.groupName === subjectGroup.groupName
          );
          if (prevEntry) {
            cumulativeHours = prevEntry.cumulativeHours;
          }
        }

        const remainingHours = Math.max(0, plannedHours - cumulativeHours);

        entries.push({
          rowNumber: subjectGroup.rowNumber,
          moduleIndex: subjectGroup.rupEntry.moduleIndex,
          subjectName: subjectGroup.rupEntry.moduleName,
          groupName: subjectGroup.groupName,
          dailyHours: Array(daysInMonth).fill(null),
          monthTotal: 0,
          plannedHours,
          actualHours: 0,
          cumulativeHours,
          remainingHours,
        });
      }
    }

    // Sort entries by row number to maintain consistent ordering
    entries.sort((a, b) => a.rowNumber - b.rowNumber);

    // Calculate total hours for this month
    const totalHours = entries.reduce((sum, entry) => sum + entry.monthTotal, 0);

    allMonthsData.push({
      monthInfo,
      entries,
      totalHours,
    });

    console.log(`[generateAllMonthsWorkload] ${monthInfo.key}: ${entries.length} entries (${monthEntries.length} with hours), ${totalHours} total hours`);
  }

  console.log(`[generateAllMonthsWorkload] Done. Generated data for ${allMonthsData.length} months`);
  return allMonthsData;
}
