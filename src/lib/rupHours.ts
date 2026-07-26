import { parseNumber } from "@/utils/parseNumber";

/**
 * Pure RUP-hours arithmetic + validation helpers, extracted from
 * `src/components/RupEntryPopup.vue` so it's testable in isolation and
 * (eventually) sharable with a server-side validator.
 *
 * Uses `parseNumber` (locale-tolerant, `"12,5"` → 12.5) everywhere it reads
 * user-entered hour strings — a plain `Number("12,5")` returns NaN and would
 * silently zero the value.
 */

/** Server-mirror: accepts "" or a plain decimal (no exponent/hex/sign/spaces). */
const HOURS_RE = /^\d+(\.\d+)?$/;
export function isHours(v: string): boolean {
  return v === "" || HOURS_RE.test(v);
}

/** Format a number for display — integer as-is, decimal rounded to 2 dp. */
export function fmtHours(n: number): string {
  if (!Number.isFinite(n)) return "0";
  return Number.isInteger(n) ? String(n) : n.toFixed(2);
}

/**
 * Distribute `total` evenly across `count` formatted string values whose
 * numeric sum equals `total` exactly. The first count-1 entries get the
 * rounded per-entry share; the last entry absorbs the rounding remainder.
 * Avoids "33.33 × 3 = 99.99" drift when total doesn't divide evenly.
 */
export function distributeFmt(total: number, count: number): string[] {
  if (count <= 0) return [];
  if (count === 1) return [fmtHours(total)];
  const per = total / count;
  const values: string[] = [];
  let sum = 0;
  for (let i = 0; i < count - 1; i++) {
    const val = fmtHours(per);
    values.push(val);
    sum += parseNumber(val);
  }
  values.push(fmtHours(total - sum));
  return values;
}

export interface DistributionEntryInput {
  hours?: string | number | null;
  srsHours?: string | number | null;
  srspHours?: string | number | null;
  individualHours?: string | number | null;
}

export interface RupEntryHoursInput {
  totalHours?: string | number | null;
  srsHours?: string | number | null;
  srspHours?: string | number | null;
  individualAdditionalHours?: string | number | null;
  distributionEntries?: DistributionEntryInput[] | null;
}

export interface DistributionSummary {
  group: number;
  srs: number;
  srsp: number;
  individual: number;
  targetGroup: number;
  targetSrs: number;
  targetSrsp: number;
  targetIndividual: number;
}

/** Round to 2 dp and back to number (matches the popup's display precision). */
function round2(n: number): number {
  return Number(n.toFixed(2));
}

/**
 * Sum distribution rows into per-bucket totals + target values from the entry's
 * top-level hour fields. Mirrors what `RupEntryPopup`'s `distributionSummary`
 * used to compute inline.
 *
 * NOTE: `targetGroup = totalHours − individualAdditionalHours` is the CURRENT
 * (mode-A) approximation; this doesn't subtract `individualHours` (fully-
 * individual disciplines like «спец»). Fixing that awaits the mode/canon
 * decision — see docs/totalHours-назначение.md.
 */
export function computeDistributionSummary(
  entry: RupEntryHoursInput | null | undefined
): DistributionSummary {
  const rows = entry?.distributionEntries ?? [];
  let sumGroup = 0, sumSrs = 0, sumSrsp = 0, sumIndividual = 0;
  for (const row of rows) {
    sumGroup += parseNumber(row.hours);
    sumSrs += parseNumber(row.srsHours);
    sumSrsp += parseNumber(row.srspHours);
    sumIndividual += parseNumber(row.individualHours);
  }
  const totalHours = parseNumber(entry?.totalHours);
  const individualTarget = parseNumber(entry?.individualAdditionalHours);
  return {
    group: round2(sumGroup),
    srs: round2(sumSrs),
    srsp: round2(sumSrsp),
    individual: round2(sumIndividual),
    targetGroup: round2(totalHours - individualTarget),
    targetSrs: round2(parseNumber(entry?.srsHours)),
    targetSrsp: round2(parseNumber(entry?.srspHours)),
    targetIndividual: round2(individualTarget),
  };
}
