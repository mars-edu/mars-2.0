// Pure XLSX matrix-building logic, replacing src/lib/workloadCsv.ts (Phase 3
// §3.7 of the workload array-migration).
//
// Builds arrays of cell values (a "matrix") for the workload export sheets.
// No Blob/URL/anchor/DOM/exceljs here — that thin wrapper (workbook creation,
// writing the matrix into cells, Blob download) lives in the .vue, mirroring
// the convex/excel/lib/workloadExport.ts precedent (buffer-building lib,
// DOM-adjacent glue at the call site).
//
// Headers are dynamic per the involved academic year(s)' semesters — no more
// hardcoded "semester 1/2" columns (the bug characterized in the old
// workloadCsv.spec.ts, and the reason CSV exports silently dropped
// semester-3+ data).

import type { SavedWorkload, WorkloadItem } from "@/types/workload";
import { findSemesterEntry, hoursPerGroup, type YearSemesterRef } from "@/lib/workloadHours";

export type XlsxCell = string | number;
export type XlsxRow = XlsxCell[];
export type XlsxMatrix = XlsxRow[];

/**
 * `_ind` rows (paired individual-hours child row, id ends with `_ind`) carry
 * an empty `description` on the item itself — labelling them with the
 * parent discipline's name avoids them looking like duplicate blank rows in
 * the export while making clear they're the individual-hours slice, not a
 * second discipline. Falls back to the item's own description (or "—") if no
 * matching parent row is found in the same item list.
 */
function disciplineLabel(item: WorkloadItem, items: WorkloadItem[]): string {
  if (!item.id.endsWith("_ind")) return item.description || "";
  const baseId = item.id.slice(0, -"_ind".length);
  const parent = items.find((i) => i.id === baseId);
  const name = parent?.description || item.description || "";
  return name ? `«${name} (индивидуальные)»` : "«Индивидуальные»";
}

function semesterHeaders(refs: YearSemesterRef[]): string[] {
  return [
    ...refs.map((r) => `Недели ${r.number}`),
    ...refs.map((r) => `Часы ${r.number}`),
    ...refs.map((r) => `На группу ${r.number}`),
    ...refs.map((r) => `Групп ${r.number}`),
  ];
}

function semesterCells(item: WorkloadItem, refs: YearSemesterRef[]): XlsxCell[] {
  const entries = refs.map((r) => findSemesterEntry(item, r.semesterId));
  return [
    ...entries.map((e) => e?.weeks ?? ""),
    ...entries.map((e) => e?.hours ?? ""),
    ...entries.map((e) => (e ? hoursPerGroup(e) : "")),
    ...entries.map((e) => e?.groupCount ?? ""),
  ];
}

/**
 * Matrix for a single workload's export sheet. `refs` is the owning
 * academic year's semesters (id + 1-based `number`), sorted — same shape as
 * `yearSemesterRefs` in WorkloadManagement.vue, sourced from
 * `academicYearSemesterStore` for `workload.academicYearId`.
 */
export function buildWorkloadXlsxMatrix(workload: SavedWorkload, refs: YearSemesterRef[]): XlsxMatrix {
  const headers = [
    "Предмет",
    "Отделение",
    "Курс",
    "Студенты",
    ...semesterHeaders(refs),
    "Всего часов",
  ];

  const rows = workload.items.map((item) => [
    disciplineLabel(item, workload.items),
    item.department,
    item.course,
    item.studentCount,
    ...semesterCells(item, refs),
    item.totalHours,
  ]);

  return [headers, ...rows];
}

/**
 * Matrix for the "download all" export, spanning every saved workload
 * (deliberately the full `allWorkloads`, not a filtered subset — matches the
 * button's "Скачать все" label; see WorkloadManagement.vue
 * `downloadAllWorkloads`). Workloads can belong to different academic years
 * with different semester counts, so the semester columns are the union of
 * every involved year's semester numbers (1..max), and `refsForYear` is
 * consulted per-workload to resolve that workload's own semesterIds — a
 * workload whose year doesn't reach a given number simply gets blank cells
 * there, rather than losing columns or misaligning another year's data.
 */
export function buildAllWorkloadsXlsxMatrix(
  workloads: SavedWorkload[],
  getYearName: (academicYearId: string) => string,
  refsForYear: (academicYearId: string) => YearSemesterRef[]
): XlsxMatrix {
  const refsByYear = new Map<string, YearSemesterRef[]>();
  let maxNumber = 0;
  for (const w of workloads) {
    if (!refsByYear.has(w.academicYearId)) {
      const refs = refsForYear(w.academicYearId);
      refsByYear.set(w.academicYearId, refs);
      for (const r of refs) maxNumber = Math.max(maxNumber, r.number);
    }
  }
  // Canonical numbers 1..maxNumber — every column present across the whole
  // export even if no single year spans all of them.
  const allNumbers = Array.from({ length: maxNumber }, (_, i) => i + 1);
  const unionRefs: YearSemesterRef[] = allNumbers.map((number) => ({ semesterId: "", number }));

  const headers = [
    "Преподаватель",
    "Учебный год",
    "Предмет",
    "Отделение",
    "Курс",
    "Студенты",
    ...semesterHeaders(unionRefs),
    "Всего часов",
  ];

  const rows: XlsxRow[] = [];
  for (const workload of workloads) {
    const yearRefs = refsByYear.get(workload.academicYearId) ?? [];
    const refByNumber = new Map(yearRefs.map((r) => [r.number, r]));
    for (const item of workload.items) {
      // Resolve each canonical column number to this workload's own
      // semesterId (if its year has one), so semesterCells looks the entry
      // up by the right id — a number with no ref for this year yields
      // undefined and blank cells.
      const perWorkloadRefs = allNumbers.map(
        (number) => refByNumber.get(number) ?? { semesterId: "__none__", number }
      );
      rows.push([
        workload.teacherName,
        getYearName(workload.academicYearId),
        disciplineLabel(item, workload.items),
        item.department,
        item.course,
        item.studentCount,
        ...semesterCells(item, perWorkloadRefs),
        item.totalHours,
      ]);
    }
  }

  return [headers, ...rows];
}
