// Tests for src/lib/workloadXlsx.ts, replacing workloadCsv.spec.ts (Phase 3
// §3.7 of the workload array-migration).
//
// Unlike the CSV predecessor, these assert the MATRIX (array of rows of cell
// values), not an escaped/joined string. Formula-injection escaping
// (`escapeCsvCell`'s leading-apostrophe guard against `=`/`+`/`-`/`@`/tab/CR)
// is intentionally NOT ported: exceljs writes typed cells directly into the
// worksheet (no string concatenation a spreadsheet app could misparse as a
// formula), so there is nothing to escape here — that whole test category is
// dropped, not forgotten.

import { buildWorkloadXlsxMatrix, buildAllWorkloadsXlsxMatrix } from "../workloadXlsx";
import type { SavedWorkload, WorkloadItem, WorkloadSemesterEntry } from "@/types/workload";
import type { YearSemesterRef } from "@/lib/workloadHours";

const S1 = "sem-1";
const S2 = "sem-2";
const S3 = "sem-3";

const REFS_2SEM: YearSemesterRef[] = [
  { semesterId: S1, number: 1 },
  { semesterId: S2, number: 2 },
];

const REFS_3SEM: YearSemesterRef[] = [
  { semesterId: S1, number: 1 },
  { semesterId: S2, number: 2 },
  { semesterId: S3, number: 3 },
];

function makeEntry(over: Partial<WorkloadSemesterEntry> = {}): WorkloadSemesterEntry {
  return { semesterId: S1, weeks: 18, hours: 2, groupCount: 1, ...over };
}

function makeItem(over: Partial<WorkloadItem> = {}): WorkloadItem {
  return {
    id: "i1",
    subjectId: "rup1",
    department: "Каф",
    course: "1",
    studentCount: "20",
    semesters: [
      makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 }), // hpg 36
      makeEntry({ semesterId: S2, weeks: 20, hours: 1.5, groupCount: 1 }), // hpg 30
    ],
    totalHours: 66,
    description: "Тестовый предмет",
    ...over,
  };
}

function makeWorkload(over: Partial<SavedWorkload> = {}): SavedWorkload {
  return {
    teacherName: "Иванов И.И.",
    academicYearId: "ay1",
    items: [makeItem()],
    totalHours: 66,
    ...over,
  };
}

describe("buildWorkloadXlsxMatrix", () => {
  it("header row: fixed columns + 4 dynamic columns per semester, labelled by ref.number", () => {
    const matrix = buildWorkloadXlsxMatrix(makeWorkload(), REFS_2SEM);
    const header = matrix[0];
    // Предмет, Отделение, Курс, Студенты + 4*2 semester cols + Всего часов
    expect(header.length).toBe(4 + 4 * 2 + 1);
    expect(header).toEqual([
      "Предмет",
      "Отделение",
      "Курс",
      "Студенты",
      "Недели 1",
      "Недели 2",
      "Часы 1",
      "Часы 2",
      "На группу 1",
      "На группу 2",
      "Групп 1",
      "Групп 2",
      "Всего часов",
    ]);
  });

  it("scales header columns to a 3-semester year (no more 2-semester hardcode)", () => {
    const matrix = buildWorkloadXlsxMatrix(makeWorkload(), REFS_3SEM);
    const header = matrix[0];
    expect(header.length).toBe(4 + 4 * 3 + 1);
    expect(header).toContain("Недели 3");
    expect(header).toContain("Часы 3");
    expect(header).toContain("На группу 3");
    expect(header).toContain("Групп 3");
  });

  it("produces one data row per item, values read from semesters[] by semesterId", () => {
    const workload = makeWorkload({
      items: [makeItem({ id: "i1" }), makeItem({ id: "i2" })],
    });
    const matrix = buildWorkloadXlsxMatrix(workload, REFS_2SEM);
    expect(matrix.length).toBe(1 /* header */ + 2 /* items */);
    const row = matrix[1];
    // weeks1, weeks2, hours1, hours2, hpg1, hpg2, groups1, groups2
    expect(row.slice(4, 12)).toEqual([18, 20, 2, 1.5, 36, 30, 1, 1]);
    expect(row[row.length - 1]).toBe(66); // totalHours
  });

  it("a semester-3 entry is exported when refs include it (fixes the old 2-semester drop)", () => {
    const item = makeItem({
      semesters: [
        makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 }),
        makeEntry({ semesterId: S2, weeks: 20, hours: 1.5, groupCount: 1 }),
        makeEntry({ semesterId: S3, weeks: 16, hours: 5, groupCount: 2 }),
      ],
    });
    const matrix = buildWorkloadXlsxMatrix(makeWorkload({ items: [item] }), REFS_3SEM);
    const row = matrix[1];
    expect(row).toContain(16); // weeks3
    expect(row).toContain(80); // hoursPerGroup3 = 16*5
  });

  it("an item with no entry for a ref semester gets blank cells there, not zeros", () => {
    const item = makeItem({ semesters: [makeEntry({ semesterId: S1 })] }); // no S2 entry
    const matrix = buildWorkloadXlsxMatrix(makeWorkload({ items: [item] }), REFS_2SEM);
    const row = matrix[1];
    // weeks2, hours2, hpg2, groups2 all blank
    expect(row[5]).toBe("");
    expect(row[7]).toBe("");
    expect(row[9]).toBe("");
    expect(row[11]).toBe("");
  });

  it("labels an _ind row with the parent discipline name instead of a blank description", () => {
    const parent = makeItem({ id: "i1", description: "Матанализ" });
    const indItem = makeItem({
      id: "i1_ind",
      department: "Индивидуальные",
      description: "",
    });
    const matrix = buildWorkloadXlsxMatrix(makeWorkload({ items: [parent, indItem] }), REFS_2SEM);
    const indRow = matrix[2];
    expect(indRow[0]).toBe("«Матанализ (индивидуальные)»");
  });

  it("falls back to a generic _ind label when no parent row is found", () => {
    const indItem = makeItem({ id: "orphan_ind", description: "" });
    const matrix = buildWorkloadXlsxMatrix(makeWorkload({ items: [indItem] }), REFS_2SEM);
    expect(matrix[1][0]).toBe("«Индивидуальные»");
  });
});

describe("buildAllWorkloadsXlsxMatrix", () => {
  const refsForYear = (yearId: string): YearSemesterRef[] =>
    yearId === "ay-3sem" ? REFS_3SEM : REFS_2SEM;

  it("header row includes teacher/year plus fixed + dynamic semester columns", () => {
    const matrix = buildAllWorkloadsXlsxMatrix([makeWorkload()], () => "2024-2025", refsForYear);
    const header = matrix[0];
    expect(header[0]).toBe("Преподаватель");
    expect(header[1]).toBe("Учебный год");
    // Преподаватель, Учебный год, Предмет, Отделение, Курс, Студенты + 4*2 + Всего часов
    expect(header.length).toBe(6 + 4 * 2 + 1);
  });

  it("produces rows across multiple workloads", () => {
    const workloads = [
      makeWorkload({ teacherName: "Иванов И.И.", items: [makeItem({ id: "a1" })] }),
      makeWorkload({
        teacherName: "Петров П.П.",
        items: [makeItem({ id: "b1" }), makeItem({ id: "b2" })],
      }),
    ];
    const matrix = buildAllWorkloadsXlsxMatrix(workloads, () => "2024-2025", refsForYear);
    expect(matrix.length).toBe(1 + 1 + 2);
  });

  it("uses the injected getYearName for the year column", () => {
    const getYearName = jest.fn(() => "Уч. год X");
    const matrix = buildAllWorkloadsXlsxMatrix(
      [makeWorkload({ academicYearId: "ay-42" })],
      getYearName,
      refsForYear
    );
    expect(getYearName).toHaveBeenCalledWith("ay-42");
    expect(matrix[1][1]).toBe("Уч. год X");
  });

  it("unions semester columns across years with different semester counts, blank where a year has fewer", () => {
    const wl2 = makeWorkload({ academicYearId: "ay-2sem", items: [makeItem({ id: "x1" })] });
    const wl3 = makeWorkload({
      academicYearId: "ay-3sem",
      items: [
        makeItem({
          id: "x2",
          semesters: [
            makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 }),
            makeEntry({ semesterId: S2, weeks: 20, hours: 1.5, groupCount: 1 }),
            makeEntry({ semesterId: S3, weeks: 16, hours: 5, groupCount: 2 }),
          ],
        }),
      ],
    });
    const matrix = buildAllWorkloadsXlsxMatrix([wl2, wl3], () => "y", refsForYear);
    const header = matrix[0];
    expect(header).toContain("Недели 3");

    // Row for wl2's item: semester-3 columns should be blank (its year has only 2).
    const wl2ColOffset = 6; // Преподаватель, Учебный год, Предмет, Отделение, Курс, Студенты
    const numSemCols = 3; // union has 3 semester numbers
    const weeks3Idx = wl2ColOffset + numSemCols - 1; // last of the "Недели" block (number 3)
    expect(header[weeks3Idx]).toBe("Недели 3");
    expect(matrix[1][weeks3Idx]).toBe("");

    // Row for wl3's item: semester-3 weeks should be populated (16).
    expect(matrix[2][weeks3Idx]).toBe(16);
  });
});
