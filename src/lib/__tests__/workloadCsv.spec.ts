// Characterization tests for src/lib/workloadCsv.ts (Phase 0 of the
// workload array-migration).
//
// These tests PIN the CURRENT behavior of the logic extracted verbatim from
// src/pages/WorkloadManagement.vue — including known quirks/bugs. They are
// NOT a spec of "correct" behavior. Do not "fix" the tests to match
// aspirational output; when the underlying logic changes intentionally,
// update the pinned values deliberately and note why.

import {
  escapeCsvCell,
  buildWorkloadCsvContent,
  buildAllWorkloadsCsvContent,
} from "../workloadCsv";
import type { SavedWorkload, WorkloadItem } from "@/types/workload";

function makeItem(over: Partial<WorkloadItem> = {}): WorkloadItem {
  return {
    id: "i1",
    subjectId: "rup1",
    department: "Каф",
    course: "1",
    studentCount: "20",
    weeks1: "18",
    weeks2: "20",
    hours1: "2",
    hours2: "1.5",
    hoursPerGroup1: "36",
    hoursPerGroup2: "30",
    groupCount1: "1",
    groupCount2: "1",
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

describe("escapeCsvCell", () => {
  it("wraps a plain string in quotes", () => {
    expect(escapeCsvCell("abc")).toBe('"abc"');
  });

  it("doubles embedded quotes", () => {
    expect(escapeCsvCell('Программирование "1С"')).toBe(
      '"Программирование ""1С"""'
    );
  });

  it("guards formula injection with a leading apostrophe: =SUM(A1)", () => {
    expect(escapeCsvCell("=SUM(A1)")).toBe("\"'=SUM(A1)\"");
  });

  it("guards a leading +", () => {
    expect(escapeCsvCell("+1")).toBe("\"'+1\"");
  });

  it("guards a leading -", () => {
    expect(escapeCsvCell("-1")).toBe("\"'-1\"");
  });

  it("guards a leading @", () => {
    expect(escapeCsvCell("@cmd")).toBe("\"'@cmd\"");
  });

  it("guards a leading tab", () => {
    expect(escapeCsvCell("\tfoo")).toBe('"\'\tfoo"');
  });

  it("guards a leading CR", () => {
    expect(escapeCsvCell("\rfoo")).toBe('"\'\rfoo"');
  });

  it("wraps a number cell as a quoted string", () => {
    expect(escapeCsvCell(76)).toBe('"76"');
  });

  it("treats null/undefined as an empty quoted cell", () => {
    expect(escapeCsvCell(undefined)).toBe('""');
    expect(escapeCsvCell(null)).toBe('""');
  });
});

describe("buildWorkloadCsvContent", () => {
  it("header row has exactly 13 columns", () => {
    const csv = buildWorkloadCsvContent(makeWorkload());
    const headerLine = csv.split("\n")[0];
    // Naive split is fine here: none of the header labels contain commas.
    expect(headerLine.split(",").length).toBe(13);
  });

  it("produces one data row per item", () => {
    const workload = makeWorkload({
      items: [makeItem({ id: "i1" }), makeItem({ id: "i2" })],
    });
    const lines = buildWorkloadCsvContent(workload).split("\n");
    expect(lines.length).toBe(1 /* header */ + 2 /* items */);
  });

  // Characterizes CSV 2-semester hardcode, plan Phase 3 fixes to dynamic.
  // The header/row builder only ever reads weeks1/weeks2, hours1/hours2,
  // hoursPerGroup1/hoursPerGroup2 and groupCount1/groupCount2 — semester-3+
  // fields on the item (e.g. weeks3/hours3/...) are silently dropped from
  // the export even when present on the item.
  it("characterizes the 2-semester hardcode: semester-3 data is not exported", () => {
    const item = makeItem({
      weeks3: "16",
      hours3: "5",
      hoursPerGroup3: "80",
      groupCount3: "2",
    } as Partial<WorkloadItem>);
    const csv = buildWorkloadCsvContent(makeWorkload({ items: [item] }));
    expect(csv).not.toContain("16");
    expect(csv).not.toContain("80");
    // Only the semester 1/2 hoursPerGroup values should appear.
    expect(csv).toContain("36");
    expect(csv).toContain("30");
  });

  // Characterizes _ind inclusion bug: the paired individual-hours row
  // (id ending in `_ind`) is a full WorkloadItem and is not filtered out of
  // the CSV export, unlike the "disciplines excluding _ind" view used
  // elsewhere in the UI.
  it("characterizes _ind inclusion: an _ind item still produces a CSV row", () => {
    const indItem = makeItem({
      id: "i1_ind",
      department: "Индивидуальные",
      description: "",
    });
    const csv = buildWorkloadCsvContent(makeWorkload({ items: [indItem] }));
    const lines = csv.split("\n");
    expect(lines.length).toBe(2); // header + the _ind row
    expect(lines[1]).toContain("Индивидуальные");
  });

  it("properly escapes a cell containing a quote and comma in the joined output", () => {
    const item = makeItem({ description: 'Курс, "продвинутый"' });
    const csv = buildWorkloadCsvContent(makeWorkload({ items: [item] }));
    const dataLine = csv.split("\n")[1];
    expect(dataLine.startsWith('"Курс, ""продвинутый"""')).toBe(true);
  });
});

describe("buildAllWorkloadsCsvContent", () => {
  it("header row has exactly 15 columns", () => {
    const csv = buildAllWorkloadsCsvContent([makeWorkload()], () => "2024-2025");
    const headerLine = csv.split("\n")[0];
    expect(headerLine.split(",").length).toBe(15);
  });

  it("produces rows across multiple workloads", () => {
    const workloads = [
      makeWorkload({ teacherName: "Иванов И.И.", items: [makeItem({ id: "a1" })] }),
      makeWorkload({
        teacherName: "Петров П.П.",
        items: [makeItem({ id: "b1" }), makeItem({ id: "b2" })],
      }),
    ];
    const lines = buildAllWorkloadsCsvContent(workloads, () => "2024-2025").split("\n");
    expect(lines.length).toBe(1 + 1 + 2);
  });

  it("uses the injected getYearName for the year column", () => {
    const getYearName = jest.fn(() => "Уч. год X");
    const csv = buildAllWorkloadsCsvContent([makeWorkload({ academicYearId: "ay-42" })], getYearName);
    expect(getYearName).toHaveBeenCalledWith("ay-42");
    expect(csv).toContain("Уч. год X");
  });
});
