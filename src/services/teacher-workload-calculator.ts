import dayjs from "dayjs";
import type { CalendarEvent, WeeklySchedule } from "@/stores/calendarStore";
import type { Class9Data } from "@/stores/class9Store";
import type { Student } from "@/types/student";
import type { AcademicYearSemester } from "@/stores/academicYearSemesterStore";
import { getEventDays, parseEventDate } from "@/utils/eventDate";
import type {
  WorkloadEntry,
  WorkloadSummaryEntry,
  MonthlyDistributionEntry,
  MonthInfo,
  MonthWorkloadData,
} from "@/lib/excel/workloadExport";
import type { Journal } from "@/stores/journalStore";
import type { JournalMarks } from "@/types/marks";

/**
 * Calculate lesson hours from time range
 * @param startTime Time string in format "HH:mm" (e.g., "09:00")
 * @param endTime Time string in format "HH:mm" (e.g., "10:30")
 * @returns Number of hours (can be fractional, e.g., 1.5)
 */
export function calculateLessonHours(
  startTime?: string,
  endTime?: string
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
    return diffMinutes / 60;
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
  filterEndDate?: Date
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
      weeklySchedule?.endTime
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
  const courses = [...new Set(students.map((s) => s.course))].sort();

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
  class9: Class9Data,
  groupName: string,
  lessonDates: { date: dayjs.Dayjs; weekId: number; hours: number }[],
  journals: Journal[],
  journalMarks: Record<string, JournalMarks>,
  month: number,
  year: number,
  academicYearStart: number,
  daysInMonth: number
): { dailyActualHours: (number | null)[]; actualHoursMonth: number; cumulativeHoursYear: number } {
  console.log(`[calculateActualHours] Looking for journal: event.id=${event.id}, class9.id=${class9.id}`);

  // Find the journal for this event
  const journal = journals.find(
    (j) => j.disciplineId === class9.id && j.id === event.id.toString()
  );

  if (journal) {
    console.log(`[calculateActualHours] Journal found: id=${journal.id}, disciplineId=${journal.disciplineId}, group=${journal.group}`);
  } else {
    console.log(`[calculateActualHours] No journal found. Looking for event.id=${event.id.toString()}, class9.id=${class9.id}`);
    console.log(`[calculateActualHours] Available journals:`, journals.map(j => ({
      id: j.id,
      disciplineId: j.disciplineId,
      group: j.group,
      matchesEvent: j.id === event.id.toString(),
      matchesClass9: j.disciplineId === class9.id
    })));
  }

  // Initialize daily hours array (null for all days)
  const dailyActualHours: (number | null)[] = Array(daysInMonth).fill(null);

  if (!journal) {
    // No journal found - fall back to scheduled hours
    console.warn(`[calculateActualHours] No journal found for event ${event.id}, class9 ${class9.id}, using scheduled hours`);

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

  // Create a map of lesson dates to hours
  const lessonDateMap = new Map<string, number>();
  lessonDates.forEach((lesson) => {
    const dateKey = lesson.date.format("YYYY-MM-DD");
    lessonDateMap.set(dateKey, (lessonDateMap.get(dateKey) || 0) + lesson.hours);
  });

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
    const dateKey = lesson.date.format("YYYY-MM-DD");
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
    currentMonthEnd.toDate()
  );

  // Create map of all lesson dates to hours for cumulative calculation
  const allLessonDateMap = new Map<string, number>();
  allLessonDates.forEach((lesson) => {
    const dateKey = lesson.date.format("YYYY-MM-DD");
    allLessonDateMap.set(dateKey, (allLessonDateMap.get(dateKey) || 0) + lesson.hours);
  });

  // Sum hours for marked dates within Sept-current month
  markedDates.forEach((dateKey) => {
    const hours = allLessonDateMap.get(dateKey);
    if (hours) {
      const lessonDate = dayjs(dateKey);
      if (
        lessonDate.isSameOrAfter(septemberStart) &&
        lessonDate.isSameOrBefore(currentMonthEnd)
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
  class9Items: Class9Data[],
  students: Student[],
  month: number, // 0-11 (JS month)
  year: number,
  academicYearStart: number, // Academic year start year (e.g., 2024 for 2024/2025)
  journals: Journal[],
  journalMarks: Record<string, JournalMarks>
): WorkloadEntry[] {
  const entries: WorkloadEntry[] = [];

  console.log(`[Calculator] generateDailyWorkload called: month=${month}, year=${year}, events=${events.length}, journals=${journals.length}`);

  // Get month boundaries
  const monthStart = dayjs(new Date(year, month, 1)).startOf("day");
  const monthEnd = dayjs(new Date(year, month + 1, 0)).endOf("day"); // Last day of month
  const daysInMonth = monthEnd.date();

  console.log(`[Calculator] Month boundaries: ${monthStart.format('YYYY-MM-DD')} to ${monthEnd.format('YYYY-MM-DD')}, days: ${daysInMonth}`);

  // Group events by subject/group combination
  const eventGroups = new Map<
    string,
    {
      event: CalendarEvent;
      class9: Class9Data;
      groupName: string;
      lessonDates: { date: dayjs.Dayjs; weekId: number; hours: number }[];
    }
  >();

  for (const event of events) {
    // Get subject/module info
    const class9 = class9Items.find((c) => c.id === event.class9Id);
    if (!class9) {
      console.log(`[Calculator] Skipping event ${event.id}: no class9 found for class9Id=${event.class9Id}`);
      continue;
    }

    // Get group name from participants
    const eventStudents = students.filter((s) =>
      event.participants.includes(s.id)
    );
    const groupName = generateGroupName(eventStudents);

    // Calculate lesson dates within the month
    const lessonDates = calculateLessonDates(
      event,
      monthStart.toDate(),
      monthEnd.toDate()
    );

    if (lessonDates.length === 0) {
      console.log(`[Calculator] Event ${event.id} (${class9.moduleName} - ${groupName}): no lessons in this month`);
      continue;
    }

    console.log(`[Calculator] Event ${event.id} (${class9.moduleName} - ${groupName}): ${lessonDates.length} lessons found`);

    // Create unique key for subject/group combination
    const key = `${class9.id}-${groupName}`;

    if (!eventGroups.has(key)) {
      eventGroups.set(key, {
        event,
        class9,
        groupName,
        lessonDates,
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
    const plannedHours = parseFloat(group.class9.totalHours) || 0;

    console.log(`[Calculator] Processing group: ${group.class9.moduleName} - ${group.groupName}, planned=${plannedHours}, lessons=${group.lessonDates.length}`);

    // Calculate actual taught hours from journal marks (includes daily breakdown)
    const { dailyActualHours, actualHoursMonth, cumulativeHoursYear } = calculateActualHours(
      group.event,
      group.class9,
      group.groupName,
      group.lessonDates,
      journals,
      journalMarks,
      month,
      year,
      academicYearStart,
      daysInMonth
    );

    // Use actual hours from journal for daily columns
    const dailyHours = dailyActualHours;

    // monthTotal is sum of daily actual hours
    const monthTotal = dailyHours.reduce(
      (sum, hours) => sum + (hours || 0),
      0
    );

    const actualHours = actualHoursMonth;
    const cumulativeHours = cumulativeHoursYear;
    const remainingHours = Math.max(0, plannedHours - cumulativeHours);

    entries.push({
      rowNumber,
      moduleIndex: group.class9.moduleIndex,
      subjectName: group.class9.moduleName,
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
  class9Items: Class9Data[],
  students: Student[],
  filterStartDate?: Date,
  filterEndDate?: Date
): WorkloadSummaryEntry[] {
  const summaries: WorkloadSummaryEntry[] = [];

  // Group events by subject/group combination
  const eventGroups = new Map<
    string,
    {
      class9: Class9Data;
      groupName: string;
      totalHours: number;
    }
  >();

  for (const event of events) {
    // Get subject/module info
    const class9 = class9Items.find((c) => c.id === event.class9Id);
    if (!class9) continue;

    // Get group name from participants
    const eventStudents = students.filter((s) =>
      event.participants.includes(s.id)
    );
    const groupName = generateGroupName(eventStudents);

    // Calculate lesson dates within the period
    const lessonDates = calculateLessonDates(
      event,
      filterStartDate,
      filterEndDate
    );

    // Sum total hours
    const totalHours = lessonDates.reduce(
      (sum, lesson) => sum + lesson.hours,
      0
    );

    if (totalHours === 0) continue;

    // Create unique key for subject/group combination
    const key = `${class9.id}-${groupName}`;

    if (!eventGroups.has(key)) {
      eventGroups.set(key, {
        class9,
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
    const plannedHours = parseFloat(group.class9.totalHours) || 0;
    const actualHours = group.totalHours;

    summaries.push({
      groupName: group.groupName,
      moduleIndex: group.class9.moduleIndex,
      subjectName: group.class9.moduleName,
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
      startParsed: start.format("YYYY-MM-DD"),
      endParsed: end.format("YYYY-MM-DD"),
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
  class9Items: Class9Data[],
  students: Student[],
  semesters: AcademicYearSemester[]
): { distributions: MonthlyDistributionEntry[]; months: MonthInfo[] } {
  console.log("[generateMonthlyDistribution] Starting with:", {
    eventsCount: events.length,
    class9ItemsCount: class9Items.length,
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
    const class9 = class9Items.find((c) => c.id === event.class9Id);
    if (!class9) continue;

    // Get group name from participants
    const eventStudents = students.filter((s) =>
      event.participants.includes(s.id)
    );
    const groupName = generateGroupName(eventStudents);

    // Calculate all lesson dates for this event
    const lessonDates = calculateLessonDates(event);

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
        monthlyHours,
        total,
      });
    }
  }

  console.log("[generateMonthlyDistribution] Final result:", {
    distributionsCount: distributions.length,
    monthsCount: academicMonths.length,
    monthsOrder: academicMonths.map(m => m.key),
    firstDistribution: distributions[0] ? {
      groupName: distributions[0].groupName,
      monthlyHoursKeys: Object.keys(distributions[0].monthlyHours),
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
  class9Items: Class9Data[],
  students: Student[],
  semesters: AcademicYearSemester[],
  journals: Journal[],
  journalMarks: Record<string, JournalMarks>
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

  const allMonthsData: MonthWorkloadData[] = [];

  for (const monthInfo of months) {
    console.log(`[generateAllMonthsWorkload] Processing ${monthInfo.key} ${monthInfo.year}...`);

    // Generate workload entries for this month
    const entries = generateDailyWorkload(
      events,
      class9Items,
      students,
      monthInfo.month,
      monthInfo.year,
      academicYearStart,
      journals,
      journalMarks
    );

    // Calculate total hours for this month
    const totalHours = entries.reduce((sum, entry) => sum + entry.monthTotal, 0);

    allMonthsData.push({
      monthInfo,
      entries,
      totalHours,
    });

    console.log(`[generateAllMonthsWorkload] ${monthInfo.key}: ${entries.length} entries, ${totalHours} total hours`);
  }

  console.log(`[generateAllMonthsWorkload] Done. Generated data for ${allMonthsData.length} months`);
  return allMonthsData;
}
