/**
 * Locale-tolerant number parser: converts a KZ/RU decimal comma to a dot
 * before parsing so `"12,5"` becomes `12.5` instead of NaN / truncating to 12.
 * Returns `fallback` (default 0) when the input is null/undefined/empty or
 * doesn't parse to a finite number.
 */
export function parseNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const s = typeof v === "string" ? v.replace(",", ".").trim() : String(v);
  if (s === "") return fallback;
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : fallback;
}
