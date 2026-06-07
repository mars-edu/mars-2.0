import {
  toNullableNumber,
  parsePlannedHours,
  semesterIdsMatch,
  isKtpFullyLoaded,
} from "../ktpHelpers";

describe("toNullableNumber", () => {
  it("returns null for empty string", () => expect(toNullableNumber("")).toBeNull());
  it("returns null for null/undefined", () => {
    expect(toNullableNumber(null)).toBeNull();
    expect(toNullableNumber(undefined)).toBeNull();
  });
  it("returns null for whitespace-only strings", () => {
    expect(toNullableNumber(" ")).toBeNull();
    expect(toNullableNumber("\t")).toBeNull();
  });
  it("preserves zero", () => {
    expect(toNullableNumber(0)).toBe(0);
    expect(toNullableNumber("0")).toBe(0);
  });
  it("parses numeric strings", () => expect(toNullableNumber("5")).toBe(5));
  it("returns null for garbage", () => expect(toNullableNumber("abc")).toBeNull());
});

describe("parsePlannedHours", () => {
  it("parses positive string hours", () => expect(parsePlannedHours("90")).toBe(90));
  it("returns null for zero (no budget known)", () => expect(parsePlannedHours("0")).toBeNull());
  it("returns null for garbage", () => expect(parsePlannedHours("n/a")).toBeNull());
  it("returns null for null/undefined", () => {
    expect(parsePlannedHours(null)).toBeNull();
    expect(parsePlannedHours(undefined)).toBeNull();
  });
});

describe("semesterIdsMatch", () => {
  const resolve = (id: string) => (id === "ays_1" ? "1" : id === "ays_2" ? "2" : null);

  it("matches identical ids", () => {
    expect(semesterIdsMatch("ays_1", "ays_1", resolve)).toBe(true);
  });
  it("matches Convex id against semester number string", () => {
    expect(semesterIdsMatch("ays_1", "1", resolve)).toBe(true);
  });
  it("matches semester number string against Convex id", () => {
    expect(semesterIdsMatch("1", "ays_1", resolve)).toBe(true);
  });
  it("rejects different semesters", () => {
    expect(semesterIdsMatch("ays_1", "2", resolve)).toBe(false);
    expect(semesterIdsMatch("ays_1", "ays_2", resolve)).toBe(false);
  });
});

describe("isKtpFullyLoaded", () => {
  const d = (theme: string, totalHours: number | null) => ({ theme, totalHours });

  it("true when all themed and hours meet budget", () => {
    expect(isKtpFullyLoaded([d("Тема 1", 45), d("Тема 2", 45)], 90)).toBe(true);
  });
  it("false when budget unknown (null)", () => {
    expect(isKtpFullyLoaded([d("Тема 1", 90)], null)).toBe(false);
  });
  it("false when no details", () => {
    expect(isKtpFullyLoaded([], 90)).toBe(false);
  });
  it("false when a theme is empty or whitespace", () => {
    expect(isKtpFullyLoaded([d("Тема 1", 45), d("  ", 45)], 90)).toBe(false);
  });
  it("false when hours below budget", () => {
    expect(isKtpFullyLoaded([d("Тема 1", 40)], 90)).toBe(false);
  });
});
