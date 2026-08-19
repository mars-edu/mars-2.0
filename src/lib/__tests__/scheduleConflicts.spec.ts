import {
  parseTimeToMinutes,
  doTimeRangesOverlap,
  doDateRangesOverlap,
  detectScheduleConflicts,
  type BellSlot,
  type SchedulableEvent,
} from "../scheduleConflicts";

describe("scheduleConflicts", () => {
  describe("parseTimeToMinutes", () => {
    it("converts HH:mm to minutes from midnight", () => {
      expect(parseTimeToMinutes("00:00")).toBe(0);
      expect(parseTimeToMinutes("08:30")).toBe(510);
      expect(parseTimeToMinutes("10:05")).toBe(605);
      expect(parseTimeToMinutes("23:59")).toBe(1439);
    });

    it("handles invalid or empty strings gracefully", () => {
      expect(parseTimeToMinutes("")).toBe(0);
      expect(parseTimeToMinutes(undefined)).toBe(0);
      expect(parseTimeToMinutes("invalid")).toBe(0);
    });
  });

  describe("doTimeRangesOverlap", () => {
    it("returns true for exact overlap", () => {
      expect(doTimeRangesOverlap("08:30", "10:05", "08:30", "10:05")).toBe(true);
    });

    it("returns true for partial overlap", () => {
      expect(doTimeRangesOverlap("08:30", "10:05", "09:00", "10:35")).toBe(true);
      expect(doTimeRangesOverlap("09:00", "10:35", "08:30", "10:05")).toBe(true);
    });

    it("returns false for sequential non-overlapping times", () => {
      expect(doTimeRangesOverlap("08:30", "10:05", "10:15", "11:50")).toBe(false);
    });

    it("returns false for touching boundaries (adjacent periods)", () => {
      expect(doTimeRangesOverlap("08:30", "10:00", "10:00", "11:30")).toBe(false);
    });
  });

  describe("doDateRangesOverlap", () => {
    it("returns true for overlapping date ranges (ISO format)", () => {
      expect(
        doDateRangesOverlap("2025-09-01", "2026-01-15", "2025-10-01", "2026-03-01")
      ).toBe(true);
    });

    it("returns true for overlapping date ranges (DD.MM.YYYY format)", () => {
      expect(
        doDateRangesOverlap("01.09.2025", "15.01.2026", "01.10.2025", "01.03.2026")
      ).toBe(true);
    });

    it("returns false for non-overlapping date ranges", () => {
      expect(
        doDateRangesOverlap("2025-09-01", "2026-01-15", "2026-01-16", "2026-06-30")
      ).toBe(false);
    });
  });

  describe("detectScheduleConflicts", () => {
    const BELLS: BellSlot[] = [
      { id: "b1", name: "1 пара", startTime: "08:30", endTime: "10:05", order: 1 },
      { id: "b2", name: "2 пара", startTime: "10:15", endTime: "11:50", order: 2 },
      { id: "b3", name: "3 пара", startTime: "12:20", endTime: "13:55", order: 3 },
    ];

    const EXISTING_EVENT: SchedulableEvent = {
      id: "ev-1",
      title: "Гармония",
      teacherId: "teacher-1",
      teacherName: "Иванов И.И.",
      participants: ["student-1", "student-2"],
      startDate: "2025-09-01",
      endDate: "2026-01-15",
      weeklySchedules: [
        { weekId: 0, startId: "b1", endId: "b1" }, // Monday 08:30 - 10:05
      ],
    };

    it("detects teacher conflict on same day and overlapping time", () => {
      const draft: Partial<SchedulableEvent> = {
        title: "Сольфеджио",
        teacherId: "teacher-1",
        participants: ["student-3"],
        startDate: "2025-09-01",
        endDate: "2026-01-15",
        weeklySchedules: [
          { weekId: 0, startId: "b1", endId: "b1" }, // Monday 08:30 - 10:05
        ],
      };

      const conflicts = detectScheduleConflicts(draft, [EXISTING_EVENT], {
        bellSlots: BELLS,
      });

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe("teacher");
      expect(conflicts[0].conflictingEventId).toBe("ev-1");
      expect(conflicts[0].weekId).toBe(0);
      expect(conflicts[0].timeRange).toBe("08:30 – 10:05");
      expect(conflicts[0].message).toContain("уже ведет «Гармония»");
    });

    it("detects student conflict when common participant exists", () => {
      const draft: Partial<SchedulableEvent> = {
        title: "История музыки",
        teacherId: "teacher-2",
        participants: ["student-2", "student-4"], // student-2 is in both
        startDate: "2025-09-01",
        endDate: "2026-01-15",
        weeklySchedules: [
          { weekId: 0, startId: "b1", endId: "b1" }, // Monday 08:30 - 10:05
        ],
      };

      const studentNamesMap = new Map([
        ["student-2", "Алиев Алишер"],
      ]);

      const conflicts = detectScheduleConflicts(draft, [EXISTING_EVENT], {
        bellSlots: BELLS,
        studentNamesMap,
      });

      expect(conflicts).toHaveLength(1);
      expect(conflicts[0].type).toBe("student");
      expect(conflicts[0].targetId).toBe("student-2");
      expect(conflicts[0].targetName).toBe("Алиев Алишер");
      expect(conflicts[0].message).toContain("Алиев Алишер уже записан(а) на «Гармония»");
    });

    it("returns no conflicts when weekdays differ (Monday vs Tuesday)", () => {
      const draft: Partial<SchedulableEvent> = {
        title: "Сольфеджио",
        teacherId: "teacher-1",
        participants: ["student-1"],
        startDate: "2025-09-01",
        endDate: "2026-01-15",
        weeklySchedules: [
          { weekId: 1, startId: "b1", endId: "b1" }, // Tuesday
        ],
      };

      const conflicts = detectScheduleConflicts(draft, [EXISTING_EVENT], {
        bellSlots: BELLS,
      });

      expect(conflicts).toHaveLength(0);
    });

    it("returns no conflicts when time slots differ (1st pair vs 2nd pair)", () => {
      const draft: Partial<SchedulableEvent> = {
        title: "Сольфеджио",
        teacherId: "teacher-1",
        participants: ["student-1"],
        startDate: "2025-09-01",
        endDate: "2026-01-15",
        weeklySchedules: [
          { weekId: 0, startId: "b2", endId: "b2" }, // Monday 10:15 - 11:50
        ],
      };

      const conflicts = detectScheduleConflicts(draft, [EXISTING_EVENT], {
        bellSlots: BELLS,
      });

      expect(conflicts).toHaveLength(0);
    });

    it("excludes self when editing an existing event", () => {
      const draft: Partial<SchedulableEvent> = {
        id: "ev-1",
        title: "Гармония (обновление)",
        teacherId: "teacher-1",
        participants: ["student-1"],
        startDate: "2025-09-01",
        endDate: "2026-01-15",
        weeklySchedules: [
          { weekId: 0, startId: "b1", endId: "b1" },
        ],
      };

      const conflicts = detectScheduleConflicts(draft, [EXISTING_EVENT], {
        bellSlots: BELLS,
        excludeEventId: "ev-1",
      });

      expect(conflicts).toHaveLength(0);
    });
  });
});
