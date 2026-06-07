/**
 * Coerce a form/input value into number|null.
 * Unlike `x ? Number(x) : null`, this preserves 0.
 */
export function toNullableNumber(value: unknown): number | null {
  if (value === "" || value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse a distributionEntry.hours string into a planned-hours budget.
 * Zero or unparseable hours mean "no budget known" -> null
 * (prevents the fully-loaded badge from being trivially true via sum >= 0).
 */
export function parsePlannedHours(
  hours: string | number | null | undefined
): number | null {
  if (hours === null || hours === undefined) return null;
  const n = Number(hours);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Match a distributionEntry semester id against a ktp semester id.
 * Handles the storage inconsistency where ktps may hold semester NUMBER
 * strings ("1"/"2") while distributionEntries hold academicYearSemesters
 * Convex ids (or vice versa). resolveSemesterNumber maps a Convex id to
 * its semesterNumber string, or null when unknown.
 */
export function semesterIdsMatch(
  distSemesterId: string,
  ktpSemesterId: string,
  resolveSemesterNumber: (id: string) => string | null
): boolean {
  if (distSemesterId === ktpSemesterId) return true;
  const distNum = resolveSemesterNumber(distSemesterId);
  if (distNum !== null && distNum === ktpSemesterId) return true;
  const ktpNum = resolveSemesterNumber(ktpSemesterId);
  return ktpNum !== null && ktpNum === distSemesterId;
}

export interface KtpDetailLike {
  theme: string;
  totalHours: number | null;
}

/**
 * concept-v2 "fully loaded" condition: details exist, every theme
 * non-empty (trimmed), and total hours meet the planned budget.
 */
export function isKtpFullyLoaded(
  details: KtpDetailLike[],
  plannedHours: number | null
): boolean {
  if (plannedHours === null) return false;
  if (details.length === 0) return false;
  if (!details.every((d) => d.theme && d.theme.trim() !== "")) return false;
  const total = details.reduce((sum, d) => sum + (d.totalHours || 0), 0);
  return total >= plannedHours;
}

/** concept-v2 EditKtpModal palette */
export const KTP_COLORS = [
  "#FACC15", "#60A5FA", "#F87171", "#4ADE80",
  "#A78BFA", "#FB923C", "#2DD4BF", "#F472B6",
];

export const KTP_LANGUAGES = ["KZ", "RU", "EN"];
