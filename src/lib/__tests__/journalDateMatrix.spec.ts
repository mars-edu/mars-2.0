import {
  timeToMinutes,
  normalizeTime,
  findScheduleIdByStartTime,
  findScheduleIdByEndTime,
  countLessonsInRange,
  computeInsertAfter,
  insertControlMarks,
  type DateMetaItem,
} from "../journalDateMatrix";
import dayjs from "@/lib/dayjs";
import type { EducationSchedule } from "@/types/education-schedule";
import type { Mark } from "@/types/marks";

describe("journalDateMatrix", () => {
  const SCHEDULES: EducationSchedule[] = [
    { id: "s1", startTime: "08:30", endTime: "10:05", lessonNumber: 1, academicYearId: "y1", semesterId: "sem1", createdAt: new Date(), updatedAt: new Date() },
    { id: "s2", startTime: "10:15", endTime: "11:50", lessonNumber: 2, academicYearId: "y1", semesterId: "sem1", createdAt: new Date(), updatedAt: new Date() },
    { id: "s3", startTime: "12:20", endTime: "13:55", lessonNumber: 3, academicYearId: "y1", semesterId: "sem1", createdAt: new Date(), updatedAt: new Date() },
  ];

  describe("timeToMinutes and normalizeTime", () => {
    it("converts time string to total minutes", () => {
      expect(timeToMinutes("08:30")).toBe(510);
      expect(timeToMinutes("12:00")).toBe(720);
      expect(timeToMinutes(null)).toBeNull();
    });

    it("normalizes single-digit hour time strings", () => {
      expect(normalizeTime("8:30")).toBe("08:30");
      expect(normalizeTime("08:30")).toBe("08:30");
    });
  });

  describe("findScheduleIdByStartTime and EndTime", () => {
    it("finds matching schedule id by exact start time", () => {
      expect(findScheduleIdByStartTime(SCHEDULES, "08:30")).toBe("s1");
      expect(findScheduleIdByStartTime(SCHEDULES, "10:15")).toBe("s2");
    });

    it("finds matching schedule id by exact end time", () => {
      expect(findScheduleIdByEndTime(SCHEDULES, "10:05")).toBe("s1");
      expect(findScheduleIdByEndTime(SCHEDULES, "11:50")).toBe("s2");
    });
  });

  describe("countLessonsInRange", () => {
    it("calculates lessons count from start to end id", () => {
      expect(countLessonsInRange(SCHEDULES, "s1", "s1")).toBe(1);
      expect(countLessonsInRange(SCHEDULES, "s1", "s2")).toBe(2);
      expect(countLessonsInRange(SCHEDULES, "s1", "s3")).toBe(3);
    });

    it("falls back to 2 when ids are missing", () => {
      expect(countLessonsInRange(SCHEDULES, undefined, undefined)).toBe(2);
    });
  });

  describe("computeInsertAfter", () => {
    const DATE_META: DateMetaItem[] = [
      { isoDate: "2025-09-01", day: dayjs("2025-09-01"), datePos: 0 },
      { isoDate: "2025-09-08", day: dayjs("2025-09-08"), datePos: 1 },
      { isoDate: "2025-09-15", day: dayjs("2025-09-15"), datePos: 2 },
    ];

    it("places control after dates that fall into its date range", () => {
      const start = dayjs("2025-09-05");
      const end = dayjs("2025-09-10");
      const pos = computeInsertAfter(DATE_META, start, end, 2);
      expect(pos).toBe(1); // 2025-09-08 is in range (datePos: 1)
    });
  });

  describe("insertControlMarks", () => {
    it("inserts session mark after target date column", () => {
      const dates: Mark[] = [
        { type: "date", label: "01.09", values: [null] },
        { type: "date", label: "08.09", values: [null] },
      ];

      const insertions = [
        {
          mark: { type: "session" as const, label: "РК1", values: [null] },
          insertAfterDatePos: 0,
          sortKey: 1,
          secondarySortKey: "rk1",
        },
      ];

      const res = insertControlMarks(dates, insertions);
      expect(res).toHaveLength(3);
      expect(res[0].label).toBe("01.09");
      expect(res[1].label).toBe("РК1");
      expect(res[2].label).toBe("08.09");
    });
  });
});
