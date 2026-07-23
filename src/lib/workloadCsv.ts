// Pure CSV string-building logic extracted verbatim from
// src/pages/WorkloadManagement.vue (Phase 0 of the workload array-migration).
//
// These functions intentionally preserve the CURRENT behavior of the
// original inline implementations, including known quirks/bugs — see the
// comments below and the characterization tests in
// src/lib/__tests__/workloadCsv.spec.ts. Do NOT "fix" anything here without
// updating the tests to match the new intended behavior first.
//
// The Blob/URL/anchor/document DOM download mechanics stay in the .vue —
// this module only produces the CSV content string.

import type { SavedWorkload } from "@/types/workload";

/**
 * Verbatim from WorkloadManagement.vue `escapeCsvCell(value)`. Escapes a CSV
 * cell: neutralizes formula injection (=, +, -, @, tab, CR) by prefixing a
 * leading apostrophe, then doubles embedded quotes and wraps the value in
 * quotes.
 */
export function escapeCsvCell(value: unknown): string {
  let str = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Verbatim body of WorkloadManagement.vue `downloadWorkload(workload)` minus
 * the BOM/Blob/URL/anchor download mechanics. Returns the CSV content string
 * (no BOM).
 *
 * Known bug (characterized, not fixed here): only semesters 1-2 columns are
 * exported (hardcoded); semester-3+ data is silently dropped. Plan Phase 3
 * fixes to make this dynamic over semesterCount.
 */
export function buildWorkloadCsvContent(workload: SavedWorkload): string {
  const headers = ['Предмет', 'Отделение', 'Курс', 'Студенты', 'Недели 1', 'Недели 2', 'Часы 1', 'Часы 2', 'На группу 1', 'На группу 2', 'Группы 1', 'Группы 2', 'Всего часов'];
  const rows = workload.items.map(item => [
    item.description,
    item.department,
    item.course,
    item.studentCount,
    item.weeks1,
    item.weeks2,
    item.hours1,
    item.hours2,
    item.hoursPerGroup1,
    item.hoursPerGroup2,
    item.groupCount1,
    item.groupCount2,
    item.totalHours
  ]);

  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(','))
  ].join('\n');
}

/**
 * Verbatim body of WorkloadManagement.vue `downloadAllWorkloads()` minus the
 * BOM/Blob/URL/anchor download mechanics. `getYearName` replaces the store
 * call `getAcademicYearName`. Returns the CSV content string (no BOM).
 *
 * Known bug (characterized, not fixed here): only semesters 1-2 columns are
 * exported (hardcoded); semester-3+ data is silently dropped. Plan Phase 3
 * fixes to make this dynamic over semesterCount.
 */
export function buildAllWorkloadsCsvContent(
  workloads: SavedWorkload[],
  getYearName: (academicYearId: string) => string
): string {
  const headers = ['Преподаватель', 'Учебный год', 'Предмет', 'Отделение', 'Курс', 'Студенты', 'Недели 1', 'Недели 2', 'Часы 1', 'Часы 2', 'На группу 1', 'На группу 2', 'Группы 1', 'Группы 2', 'Всего часов'];
  const rows: any[][] = [];

  workloads.forEach(workload => {
    workload.items.forEach(item => {
      rows.push([
        workload.teacherName,
        getYearName(workload.academicYearId),
        item.description,
        item.department,
        item.course,
        item.studentCount,
        item.weeks1,
        item.weeks2,
        item.hours1,
        item.hours2,
        item.hoursPerGroup1,
        item.hoursPerGroup2,
        item.groupCount1,
        item.groupCount2,
        item.totalHours
      ]);
    });
  });

  return [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(','))
  ].join('\n');
}
