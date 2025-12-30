import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parsePiniaState, runD1Query } from "./d1.ts";

interface D1AcademicYearRow {
  id?: string;
  name?: string | null;
  startYear?: number | string | null;
  endYear?: number | string | null;
  isActive?: boolean | null;
}

interface ConvexAcademicYearRow {
  _id: string;
  name: string;
  startYear: number;
  endYear: number;
  isActive: boolean;
}

function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
}

function queryD1AcademicYears(config: { databaseName: string; accountId: string }): D1AcademicYearRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: config.databaseName,
    accountId: config.accountId,
    query: `
SELECT state
FROM PiniaState
WHERE storeId = 'academicYear'
`.trim(),
  });

  if (response.results.length === 0) {
    return [];
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    return [];
  }

  const state = parsePiniaState<{ academicYears: D1AcademicYearRow[] }>(
    stateJson
  );

  return Array.isArray(state?.academicYears) ? state.academicYears : [];
}

function queryConvexAcademicYears(): ConvexAcademicYearRow[] {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const repoRoot = resolve(__dirname, "..", "..", "..");
  const output = execSync("npx convex run academicYears/queries:list \"{}\"", {
    cwd: repoRoot,
    encoding: "utf-8",
  });

  const parsed = JSON.parse(output);
  return Array.isArray(parsed) ? (parsed as ConvexAcademicYearRow[]) : [];
}

function findConvexMatch(
  d1Year: D1AcademicYearRow,
  convexYears: ConvexAcademicYearRow[]
): ConvexAcademicYearRow | null {
  const startYear = normalizeNumber(d1Year.startYear);
  const endYear = normalizeNumber(d1Year.endYear);
  const name = normalizeString(d1Year.name);

  if (startYear && endYear) {
    const match = convexYears.find(
      (year) => year.startYear === startYear && year.endYear === endYear
    );
    if (match) return match;
  }

  if (startYear) {
    const match = convexYears.find((year) => year.startYear === startYear);
    if (match) return match;
  }

  if (name) {
    const match = convexYears.find((year) => year.name === name);
    if (match) return match;
  }

  return null;
}

export function buildAcademicYearIdMap(config: {
  databaseName: string;
  accountId: string;
}): {
  idMap: Map<string, string>;
  defaultConvexAcademicYearId: string | null;
} {
  const d1Years = queryD1AcademicYears(config);
  const convexYears = queryConvexAcademicYears();
  const idMap = new Map<string, string>();

  let defaultConvexAcademicYearId: string | null = null;

  for (const d1Year of d1Years) {
    const d1Id = normalizeString(d1Year.id);
    if (!d1Id) continue;

    const match = findConvexMatch(d1Year, convexYears);
    if (match) {
      idMap.set(d1Id, match._id);
      if (d1Year.isActive) {
        defaultConvexAcademicYearId = match._id;
      }
    }
  }

  if (!defaultConvexAcademicYearId) {
    const active = convexYears.find((year) => year.isActive);
    defaultConvexAcademicYearId = active?._id || null;
  }

  return {
    idMap,
    defaultConvexAcademicYearId,
  };
}
