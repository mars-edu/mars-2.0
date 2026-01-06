import { execSync } from "child_process";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { parsePiniaState, runD1Query } from "./d1.ts";

interface D1SemesterRow {
  id?: string;
  shortName?: string | null;
  fullName?: string | null;
  name?: string | null;
  number?: number | string | null;
  startDate?: string | null;
  endDate?: string | null;
  academicYearId?: string | null;
}

interface ConvexSemesterRow {
  _id: string;
  academicYearId: string;
  semesterDefinitionId: string;
  startDate: string;
  endDate: string;
  semesterDefinition?: {
    _id: string;
    name: string;
    shortName?: string;
    number?: number;
  };
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

function queryD1Semesters(config: {
  databaseName: string;
  accountId: string;
}): D1SemesterRow[] {
  const response = runD1Query<{ state: string }>({
    databaseName: config.databaseName,
    accountId: config.accountId,
    query: `
SELECT state
FROM PiniaState
WHERE storeId = 'semester'
`.trim(),
  });

  if (response.results.length === 0) {
    return [];
  }

  const stateJson = response.results[0].state;
  if (!stateJson) {
    return [];
  }

  const state = parsePiniaState<{ semesters: D1SemesterRow[] }>(stateJson);

  return Array.isArray(state?.semesters) ? state.semesters : [];
}

function queryConvexSemesters(): ConvexSemesterRow[] {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const repoRoot = resolve(__dirname, "..", "..", "..");

  try {
    // Try to query Convex academicYearSemesters
    // Note: This requires the academicYearSemesters to be imported first
    const output = execSync(
      'npx convex run academicYearSemesters/queries:list "{}"',
      {
        cwd: repoRoot,
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }
    );

    const parsed = JSON.parse(output);
    return Array.isArray(parsed) ? (parsed as ConvexSemesterRow[]) : [];
  } catch (error) {
    // If query fails (e.g., semesters not imported yet), return empty array
    console.warn(
      "⚠ Could not query Convex academicYearSemesters. Make sure they are imported first."
    );
    return [];
  }
}

/**
 * Find the best matching Convex semester for a D1 semester
 * Matching priority:
 * 1. Extract number from shortName and match with semesterDefinition.number
 * 2. shortName + number from semesterDefinition
 * 3. shortName only from semesterDefinition
 * 4. number only from semesterDefinition
 * 5. name match from semesterDefinition
 */
function findConvexMatch(
  d1Semester: D1SemesterRow,
  convexSemesters: ConvexSemesterRow[]
): ConvexSemesterRow | null {
  const shortName = normalizeString(
    d1Semester.shortName || d1Semester.name
  );
  const number = normalizeNumber(d1Semester.number);

  // Try extracting number from shortName (e.g., "1 семестр" -> 1)
  const extractedNumber = shortName.match(/^\d+/);
  const parsedNumberFromName = extractedNumber
    ? parseInt(extractedNumber[0], 10)
    : null;

  // Try matching by extracted number from name
  if (parsedNumberFromName !== null) {
    const match = convexSemesters.find(
      (sem) => sem.semesterDefinition?.number === parsedNumberFromName
    );
    if (match) return match;
  }

  // Try matching by shortName + number
  if (shortName && number !== null) {
    const match = convexSemesters.find(
      (sem) =>
        normalizeString(sem.semesterDefinition?.shortName) === shortName &&
        sem.semesterDefinition?.number === number
    );
    if (match) return match;
  }

  // Try matching by shortName only
  if (shortName) {
    const match = convexSemesters.find(
      (sem) => normalizeString(sem.semesterDefinition?.shortName) === shortName
    );
    if (match) return match;
  }

  // Try matching by number only
  if (number !== null) {
    const match = convexSemesters.find(
      (sem) => sem.semesterDefinition?.number === number
    );
    if (match) return match;
  }

  // Try matching by name
  if (shortName) {
    const match = convexSemesters.find(
      (sem) => normalizeString(sem.semesterDefinition?.name) === shortName
    );
    if (match) return match;
  }

  return null;
}

/**
 * Build a mapping from D1 semester IDs (UUIDs) to Convex semester IDs
 *
 * This function queries both D1 and Convex databases to build a mapping
 * between legacy D1 semester IDs and new Convex academicYearSemester IDs.
 *
 * NOTE: Convex academicYearSemesters must be imported BEFORE running migrations that depend on this mapping
 *
 * @returns Map from D1 semester ID to Convex academicYearSemester ID
 */
export function buildSemesterIdMap(config: {
  databaseName: string;
  accountId: string;
}): Map<string, string> {
  const d1Semesters = queryD1Semesters(config);
  const convexSemesters = queryConvexSemesters();
  const idMap = new Map<string, string>();

  if (convexSemesters.length === 0) {
    console.warn(
      "⚠ No Convex academicYearSemesters found. Semester ID mapping will be empty."
    );
    console.warn(
      "  Make sure to import academicYearSemesters first with: npx convex import --table academicYearSemesters"
    );
    return idMap;
  }

  let matchedCount = 0;
  let unmatchedCount = 0;

  for (const d1Semester of d1Semesters) {
    const d1Id = normalizeString(d1Semester.id);
    if (!d1Id) continue;

    const match = findConvexMatch(d1Semester, convexSemesters);
    if (match) {
      idMap.set(d1Id, match._id);
      matchedCount++;
    } else {
      unmatchedCount++;
      console.warn(
        `  ⚠ Could not match D1 semester: ${d1Semester.shortName || d1Semester.name || d1Id}`
      );
    }
  }

  console.log(
    `✓ Mapped ${matchedCount} semester IDs (${unmatchedCount} unmatched)`
  );

  return idMap;
}
