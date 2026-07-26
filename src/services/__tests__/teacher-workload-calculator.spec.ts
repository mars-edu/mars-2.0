// Characterization tests for src/services/teacher-workload-calculator.ts
// focused on calculateLessonHours' academicHourMinutes divisor.
//
// These tests pin the CURRENT behavior: the default divisor stays 60
// (astronomic minutes) for backward compatibility with callers that never
// opt in to per-year academic hour resolution, while an explicit divisor
// (e.g. 45, the KZ academic-hour standard) can be passed per call.

import { calculateLessonHours, resolveYearStart } from "../teacher-workload-calculator";
import type { AcademicYear } from "@/types/academic-year";

describe("calculateLessonHours", () => {
  test("default divisor is 60 (astronomic) — legacy behavior preserved", () => {
    expect(calculateLessonHours("09:00", "09:45")).toBeCloseTo(0.75);
  });

  test("academic-45 override: single 45-min slot = 1 hour", () => {
    expect(calculateLessonHours("09:00", "09:45", 45)).toBe(1);
  });

  test("paired 90-min lesson — astronomic 1.5, academic 2", () => {
    expect(calculateLessonHours("08:00", "09:30")).toBeCloseTo(1.5);
    expect(calculateLessonHours("08:00", "09:30", 45)).toBeCloseTo(2);
  });

  test("fallback: missing times → 1 hour regardless of divisor", () => {
    expect(calculateLessonHours(undefined, undefined)).toBe(1);
    expect(calculateLessonHours(undefined, undefined, 45)).toBe(1);
  });

  test("fallback: invalid time strings → 1 hour", () => {
    expect(calculateLessonHours("bad", "worse", 45)).toBe(1);
  });

  test("fallback: end <= start → 1 hour", () => {
    expect(calculateLessonHours("10:00", "09:00", 45)).toBe(1);
    expect(calculateLessonHours("10:00", "10:00", 45)).toBe(1);
  });

  test("custom divisor: 40-min hour", () => {
    expect(calculateLessonHours("09:00", "10:20", 40)).toBe(2); // 80/40
  });
});

// resolveYearStart backs the cumulative-hours window in calculateActualHours
// (was previously hardcoded to Sept 1 of academicYearStart). Phase 1 of the
// educationTechnology + per-year startDate/endDate feature: the fallback
// stays until the prod backfill migration runs and the field is narrowed to
// required (see convex/migrations/educationTechnologyBackfill.ts).
describe("year-start resolution", () => {
  function makeYear(overrides: Partial<AcademicYear> = {}): AcademicYear {
    return {
      id: "year-1",
      name: "2025-2026",
      startYear: 2025,
      endYear: 2026,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    };
  }

  test("explicit startDate wins over the Sept-1 fallback", () => {
    const year = makeYear({ startDate: "2025-09-01" });
    const result = resolveYearStart(year, 2025);
    expect(result.format("YYYY-MM-DD")).toBe("2025-09-01");
  });

  test("no startDate → falls back to Sept 1 of academicYearStart", () => {
    const year = makeYear({ startDate: undefined });
    const result = resolveYearStart(year, 2025);
    expect(result.format("YYYY-MM-DD")).toBe("2025-09-01");
  });

  test("no year at all (undefined) → falls back to Sept 1 of academicYearStart", () => {
    const result = resolveYearStart(undefined, 2025);
    expect(result.format("YYYY-MM-DD")).toBe("2025-09-01");
  });

  test("mid-year explicit startDate — cumulative window starts in January", () => {
    const year = makeYear({ startDate: "2025-01-15" });
    const result = resolveYearStart(year, 2025);
    expect(result.format("YYYY-MM-DD")).toBe("2025-01-15");
  });
});
