import {
  MARK_TYPE_MAP,
  initialValuesForType,
  headerLabelFor,
  exportHeaderLabelFor,
  LETTER_GRADE_BUCKETS,
  scoreToLetter,
  getScoreBadgeClass,
  timeToMinutes,
  normalizeTime,
  findScheduleIdByStartTime,
  findScheduleIdByEndTime,
  resolveScheduleIds,
} from "../journalGrid.lib";
import type { EducationSchedule } from "@/stores/educationScheduleStore";

const sched = (
  id: string,
  startTime: string,
  endTime: string
): EducationSchedule =>
  ({ id, startTime, endTime } as unknown as EducationSchedule);

describe("mark types", () => {
  it("freezes the mark type map", () => {
    expect(Object.isFrozen(MARK_TYPE_MAP)).toBe(true);
    expect(MARK_TYPE_MAP.date.singleRow).toBe(false);
    expect(MARK_TYPE_MAP.session.singleRow).toBe(true);
  });

  it("initialValuesForType: single-row types get exactly one slot", () => {
    expect(initialValuesForType("session", 5)).toEqual([null]);
  });

  it("initialValuesForType: multi-row types get dynamicRows slots (min 1)", () => {
    expect(initialValuesForType("date", 3)).toEqual([null, null, null]);
    expect(initialValuesForType("date", 0)).toEqual([null]);
    expect(initialValuesForType("date", -2)).toEqual([null]);
  });
});

describe("headerLabelFor", () => {
  it("date marks return their date string", () => {
    expect(headerLabelFor({ type: "date", date: "01.02" })).toBe("01.02");
    expect(headerLabelFor({ type: "date" })).toBe("");
  });

  it("non-date marks prefer an explicit label", () => {
    expect(headerLabelFor({ type: "session", label: "РК1" })).toBe("РК1");
  });

  it("falls back to the type default label", () => {
    expect(headerLabelFor({ type: "session" })).toBe("");
  });
});

describe("exportHeaderLabelFor", () => {
  it("formats a valid ISO date column to the UI format", () => {
    expect(
      exportHeaderLabelFor({ type: "date", isoDate: "2026-02-01" })
    ).toBe("01.02.2026");
  });

  it("falls back to label (newlines stripped) when isoDate is missing/invalid", () => {
    expect(
      exportHeaderLabelFor({ type: "date", date: "line1\nline2" })
    ).toBe("line1 line2");
    expect(
      exportHeaderLabelFor({ type: "date", isoDate: "not-a-date", date: "x" })
    ).toBe("x");
  });

  it("non-date marks use the trimmed header label", () => {
    expect(
      exportHeaderLabelFor({ type: "session", label: "Итог\n" })
    ).toBe("Итог");
  });
});

describe("scoreToLetter", () => {
  it("maps boundary scores to the expected letters", () => {
    expect(scoreToLetter(100)).toBe("A");
    expect(scoreToLetter(95)).toBe("A");
    expect(scoreToLetter(94.9)).toBe("A-");
    expect(scoreToLetter(50)).toBe("D");
    expect(scoreToLetter(49)).toBe("F");
    expect(scoreToLetter(0)).toBe("F");
  });

  it("every bucket min resolves to its own letter", () => {
    for (const b of LETTER_GRADE_BUCKETS) {
      expect(scoreToLetter(b.min)).toBe(b.letter);
    }
  });
});

describe("getScoreBadgeClass", () => {
  it("dash score is gray", () => {
    expect(getScoreBadgeClass("—")).toBe("bg-gray-400");
  });

  it("buckets numeric scores by GPA thresholds", () => {
    expect(getScoreBadgeClass("5")).toBe("bg-emerald-500");
    expect(getScoreBadgeClass("4.5")).toBe("bg-emerald-500");
    expect(getScoreBadgeClass("4")).toBe(
      "bg-gradient-to-r from-yellow-400 to-emerald-500"
    );
    expect(getScoreBadgeClass("3")).toBe("bg-yellow-500");
    expect(getScoreBadgeClass("2")).toBe("bg-red-500");
  });
});

describe("timeToMinutes", () => {
  it("parses HH:MM into minutes", () => {
    expect(timeToMinutes("08:30")).toBe(510);
    expect(timeToMinutes("00:00")).toBe(0);
  });

  it("returns null for bad input", () => {
    expect(timeToMinutes(null)).toBeNull();
    expect(timeToMinutes(undefined)).toBeNull();
    expect(timeToMinutes("8")).toBeNull();
    expect(timeToMinutes("aa:bb")).toBeNull();
  });
});

describe("normalizeTime", () => {
  it("zero-pads hours and minutes", () => {
    expect(normalizeTime("8:5")).toBe("08:05");
    expect(normalizeTime("08:30")).toBe("08:30");
  });

  it("passes through falsy / malformed values", () => {
    expect(normalizeTime(undefined)).toBeUndefined();
    expect(normalizeTime("8")).toBe("8");
  });
});

describe("findScheduleIdByStartTime", () => {
  const schedules = [
    sched("s1", "08:00", "08:45"),
    sched("s2", "09:00", "09:45"),
    sched("s3", "10:00", "10:45"),
  ];

  it("matches an exact start time", () => {
    expect(findScheduleIdByStartTime(schedules, "09:00")).toBe("s2");
  });

  it("matches a non-padded equivalent time", () => {
    expect(findScheduleIdByStartTime(schedules, "9:00")).toBe("s2");
  });

  it("falls back to the earliest slot at/after the target", () => {
    expect(findScheduleIdByStartTime(schedules, "08:30")).toBe("s2");
  });

  it("falls back to the first slot when nothing is at/after", () => {
    expect(findScheduleIdByStartTime(schedules, "23:00")).toBe("s1");
  });
});

describe("findScheduleIdByEndTime", () => {
  const schedules = [
    sched("s1", "08:00", "08:45"),
    sched("s2", "09:00", "09:45"),
    sched("s3", "10:00", "10:45"),
  ];

  it("matches an exact end time", () => {
    expect(findScheduleIdByEndTime(schedules, "09:45")).toBe("s2");
  });

  it("falls back to the latest slot at/before the target", () => {
    expect(findScheduleIdByEndTime(schedules, "09:50")).toBe("s2");
  });

  it("falls back to the last slot when nothing is at/before", () => {
    expect(findScheduleIdByEndTime(schedules, "01:00")).toBe("s3");
  });
});

describe("resolveScheduleIds", () => {
  const schedules = [
    sched("s1", "08:00", "08:45"),
    sched("s2", "09:00", "09:45"),
  ];

  it("returns explicit ids untouched", () => {
    expect(
      resolveScheduleIds({ startId: "x", endId: "y" }, schedules)
    ).toEqual({ startId: "x", endId: "y" });
  });

  it("resolves missing ids from times", () => {
    expect(
      resolveScheduleIds({ startTime: "09:00", endTime: "08:45" }, schedules)
    ).toEqual({ startId: "s2", endId: "s1" });
  });

  it("leaves ids undefined when neither id nor time is present", () => {
    expect(resolveScheduleIds({}, schedules)).toEqual({
      startId: undefined,
      endId: undefined,
    });
  });

  it("returns undefined ids for a null daySchedule", () => {
    expect(resolveScheduleIds(null, schedules)).toEqual({
      startId: undefined,
      endId: undefined,
    });
  });
});
