// Characterization tests for src/services/teacher-workload-calculator.ts
// focused on calculateLessonHours' academicHourMinutes divisor.
//
// These tests pin the CURRENT behavior: the default divisor stays 60
// (astronomic minutes) for backward compatibility with callers that never
// opt in to per-year academic hour resolution, while an explicit divisor
// (e.g. 45, the KZ academic-hour standard) can be passed per call.

import { calculateLessonHours } from "../teacher-workload-calculator";

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
