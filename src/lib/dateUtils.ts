import dayjs from "@/lib/dayjs";
import { DATE_UI_FORMAT, DATE_STORAGE_FORMAT } from "@/constants/calendar";

export type DateLike = string | number | Date | null | undefined;

export const DEFAULT_DATE_FORMAT = DATE_UI_FORMAT; // "DD.MM.YYYY"
export const DEFAULT_DATETIME_FORMAT = `${DATE_UI_FORMAT} HH:mm`; // "DD.MM.YYYY HH:mm"

/**
 * Safely parse a date-like value into a Dayjs instance.
 * Checks DD.MM.YYYY, YYYY-MM-DD, ISO formats, and timestamps.
 */
export function parseDate(value: DateLike): dayjs.Dayjs | null {
  if (value === null || value === undefined || value === "") return null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Check DD.MM.YYYY format
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(trimmed)) {
      const d = dayjs(trimmed, "DD.MM.YYYY", true);
      return d.isValid() ? d : null;
    }

    // Check YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const d = dayjs(trimmed);
      return d.isValid() ? d : null;
    }

    const d = dayjs(trimmed);
    return d.isValid() ? d : null;
  }

  const d = dayjs(value);
  return d.isValid() ? d : null;
}

/**
 * Formats date to display string ("DD.MM.YYYY" by default).
 */
export function formatDate(
  value: DateLike,
  format = DEFAULT_DATE_FORMAT,
  fallback = ""
): string {
  const d = parseDate(value);
  return d ? d.format(format) : fallback;
}

/**
 * Formats datetime to display string ("DD.MM.YYYY HH:mm" by default).
 */
export function formatDateTime(
  value: DateLike,
  format = DEFAULT_DATETIME_FORMAT,
  fallback = ""
): string {
  const d = parseDate(value);
  return d ? d.format(format) : fallback;
}

/**
 * Formats a date range: "01.09.2025 – 15.01.2026".
 */
export function formatDateRange(
  start: DateLike,
  end: DateLike,
  separator = " – ",
  fallback = "—"
): string {
  const startStr = formatDate(start);
  const endStr = formatDate(end);

  if (startStr && endStr) return `${startStr}${separator}${endStr}`;
  if (startStr) return startStr;
  if (endStr) return endStr;
  return fallback;
}

/**
 * Formats time range: "08:30 – 10:05".
 */
export function formatTimeRange(
  startTime?: string | null,
  endTime?: string | null,
  separator = " – ",
  fallback = ""
): string {
  const s = startTime?.trim() || "";
  const e = endTime?.trim() || "";

  if (s && e) return `${s}${separator}${e}`;
  if (s) return s;
  if (e) return e;
  return fallback;
}

/**
 * Converts date to ISO storage format ("YYYY-MM-DD").
 */
export function toStorageDate(value: DateLike): string {
  const d = parseDate(value);
  return d ? d.format(DATE_STORAGE_FORMAT) : "";
}

/**
 * Converts date to UI display format ("DD.MM.YYYY").
 */
export function toUiDate(value: DateLike): string {
  const d = parseDate(value);
  return d ? d.format(DATE_UI_FORMAT) : "";
}
