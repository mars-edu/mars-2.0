import {
  parseDate,
  formatDate,
  formatDateTime,
  formatDateRange,
  formatTimeRange,
  toStorageDate,
  toUiDate,
} from "../dateUtils";

describe("dateUtils", () => {
  describe("parseDate", () => {
    it("parses DD.MM.YYYY format", () => {
      const d = parseDate("15.09.2025");
      expect(d).not.toBeNull();
      expect(d?.year()).toBe(2025);
      expect(d?.month()).toBe(8); // 0-indexed: 8 = September
      expect(d?.date()).toBe(15);
    });

    it("parses YYYY-MM-DD ISO format", () => {
      const d = parseDate("2025-09-15");
      expect(d).not.toBeNull();
      expect(d?.year()).toBe(2025);
      expect(d?.month()).toBe(8);
      expect(d?.date()).toBe(15);
    });

    it("parses timestamp number and Date object", () => {
      const timestamp = 1757894400000;
      const dateObj = new Date(timestamp);
      expect(parseDate(timestamp)).not.toBeNull();
      expect(parseDate(dateObj)).not.toBeNull();
    });

    it("returns null for invalid or empty inputs", () => {
      expect(parseDate("")).toBeNull();
      expect(parseDate(null)).toBeNull();
      expect(parseDate(undefined)).toBeNull();
      expect(parseDate("invalid-date-string")).toBeNull();
    });
  });

  describe("formatDate", () => {
    it("formats ISO string to DD.MM.YYYY", () => {
      expect(formatDate("2025-09-15")).toBe("15.09.2025");
    });

    it("formats DD.MM.YYYY string consistently", () => {
      expect(formatDate("15.09.2025")).toBe("15.09.2025");
    });

    it("uses fallback for invalid dates", () => {
      expect(formatDate(null, "DD.MM.YYYY", "—")).toBe("—");
      expect(formatDate("", "DD.MM.YYYY", "N/A")).toBe("N/A");
    });
  });

  describe("formatDateTime", () => {
    it("formats datetime correctly", () => {
      const dt = "2025-09-15T14:30:00";
      expect(formatDateTime(dt)).toBe("15.09.2025 14:30");
    });
  });

  describe("formatDateRange", () => {
    it("formats range of dates", () => {
      expect(formatDateRange("2025-09-01", "2026-01-15")).toBe("01.09.2025 – 15.01.2026");
      expect(formatDateRange("01.09.2025", "15.01.2026")).toBe("01.09.2025 – 15.01.2026");
    });

    it("handles partial dates in range", () => {
      expect(formatDateRange("2025-09-01", null)).toBe("01.09.2025");
      expect(formatDateRange(null, "2026-01-15")).toBe("15.01.2026");
      expect(formatDateRange(null, null)).toBe("—");
    });
  });

  describe("formatTimeRange", () => {
    it("formats start and end time", () => {
      expect(formatTimeRange("08:30", "10:05")).toBe("08:30 – 10:05");
    });

    it("handles single time", () => {
      expect(formatTimeRange("08:30", null)).toBe("08:30");
      expect(formatTimeRange(null, null, " – ", "не задано")).toBe("не задано");
    });
  });

  describe("toStorageDate and toUiDate", () => {
    it("converts between formats accurately", () => {
      expect(toStorageDate("15.09.2025")).toBe("2025-09-15");
      expect(toUiDate("2025-09-15")).toBe("15.09.2025");
    });
  });
});
