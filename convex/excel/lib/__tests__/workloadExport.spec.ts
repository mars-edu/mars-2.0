import * as ExcelJS from "exceljs";
import { exportTeacherWorkloadToExcel } from "../workloadExport";

function makePayload(overrides?: Partial<Parameters<typeof exportTeacherWorkloadToExcel>[0]>) {
  return {
    institutionName: "TEST INSTITUTION",
    teacherFullName: "Иванов Иван Иванович",
    academicYear: "2024/2025",
    month: "сентябрь",
    entries: [
      {
        rowNumber: 1,
        moduleIndex: "ООД 10",
        subjectName: "Всемирная история",
        groupName: "1к ДЭВ",
        dailyHours: Array.from({ length: 30 }, (_, i) => (i === 1 ? 2 : null)),
        monthTotal: 2,
        plannedHours: 38,
        actualHours: 2,
        cumulativeHours: 2,
        remainingHours: 36,
      },
    ],
    summaryEntries: [
      {
        groupName: "1к ДЭВ",
        moduleIndex: "ООД 10",
        subjectName: "Всемирная история",
        plannedHours: 38,
        actualHours: 2,
        totalHours: 38,
      },
    ],
    monthlyDistribution: [
      {
        groupName: "1к ДЭВ",
        september: 2,
        october: 0,
        november: 0,
        december: 0,
        january: 0,
        february: 0,
        march: 0,
        april: 0,
        may: 0,
        june: 0,
        total: 2,
      },
    ],
    ...overrides,
  };
}

describe("exportTeacherWorkloadToExcel", () => {
  it("keeps Form 1 columns aligned for 30-day months (monthTotal always in AK)", async () => {
    const payload = makePayload();
    const buffer = await exportTeacherWorkloadToExcel(payload);

    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    await workbook.xlsx.load(arrayBuffer as any);

    const sheet = workbook.getWorksheet("форма 1");
    expect(sheet).toBeTruthy();

    // First data row starts at row 10 in this template
    expect(sheet!.getCell("AI9").value).toBe(30); // header shows days 1..30
    expect(sheet!.getCell("AJ9").value).toBe(31); // day 31 header exists in template
    expect(sheet!.getCell("B10").value).toBe(1);
    expect(sheet!.getCell("G10").value).toBe(2); // day 2
    expect(sheet!.getCell("AJ10").value).toBeNull(); // day 31 must remain a day column
    const monthTotal = sheet!.getCell("AK10").value as any;
    expect(monthTotal?.formula).toBe("SUM(F10:AJ10)");
    expect(monthTotal?.result).toBe(2);
    expect(sheet!.getCell("AN10").value).toBe(38); // planned hours column
  });

  it("matches Form 2 total formula and signature block", async () => {
    const payload = makePayload({
      teacherFullName: "Тестовый Преподаватель",
      summaryEntries: [
        {
          groupName: "1к ДЭВ",
          moduleIndex: "ООД 10",
          subjectName: "Всемирная история",
          plannedHours: 38,
          actualHours: 2,
          facultativeActual: 1,
          consultationsActual: 0,
          examsActual: 0,
          totalHours: 3,
        },
      ],
    });
    const buffer = await exportTeacherWorkloadToExcel(payload);

    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    );
    await workbook.xlsx.load(arrayBuffer as any);

    const sheet = workbook.getWorksheet("форма 2");
    expect(sheet).toBeTruthy();

    // First data row starts at row 7 in this template.
    expect(sheet!.getCell("B7").text).toContain("1к");

    const total = sheet!.getCell("L7").value as any;
    expect(total?.formula).toBe("SUM(E7+G7+I7+K7)");
    expect(total?.result).toBe(3);

    expect(sheet!.getCell("E55").value).toBe("Тестовый Преподаватель");
    expect(sheet!.getCell("B55").isMerged).toBe(true);
    expect(sheet!.getCell("E55").isMerged).toBe(true);
  });
});
