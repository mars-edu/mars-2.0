import {
  cloneMarkTemplate,
  findMatchingMarkIndex,
  mergeValuesFromExisting,
  buildStudentMarks,
  buildJournalMarksMatrix,
} from "../marksTemplateBuilder";
import type { Mark } from "@/types/marks";

describe("marksTemplateBuilder", () => {
  const TEMPLATE: Mark[] = [
    { type: "date", isoDate: "2025-09-01", label: "01.09", values: [null, null] },
    { type: "date", isoDate: "2025-09-08", label: "08.09", values: [null, null] },
    { type: "session", label: "РК1", scheduledControlId: "rk-1", values: [null] },
  ];

  describe("cloneMarkTemplate", () => {
    it("deep clones mark template", () => {
      const cloned = cloneMarkTemplate(TEMPLATE);
      expect(cloned).toEqual(TEMPLATE);
      expect(cloned).not.toBe(TEMPLATE);
      expect(cloned[0].values).not.toBe(TEMPLATE[0].values);
    });
  });

  describe("findMatchingMarkIndex", () => {
    it("matches date mark by isoDate", () => {
      const target: Mark = { type: "date", isoDate: "2025-09-08", values: [] };
      const used = new Set<number>();
      const idx = findMatchingMarkIndex(target, TEMPLATE, used);
      expect(idx).toBe(1);
    });

    it("matches session mark by scheduledControlId", () => {
      const target: Mark = { type: "session", scheduledControlId: "rk-1", values: [] };
      const used = new Set<number>();
      const idx = findMatchingMarkIndex(target, TEMPLATE, used);
      expect(idx).toBe(2);
    });
  });

  describe("mergeValuesFromExisting", () => {
    it("merges existing values while respecting new template length", () => {
      const tMark: Mark = { type: "date", values: [null, null, null] };
      const eMark: Mark = { type: "date", values: ["5", "4"] };
      const res = mergeValuesFromExisting(tMark, eMark);
      expect(res).toEqual(["5", "4", null]);
    });
  });

  describe("buildStudentMarks and buildJournalMarksMatrix", () => {
    it("builds fresh marks for student when no existing record", () => {
      const studentMark = buildStudentMarks("st-1", TEMPLATE);
      expect(studentMark.studentId).toBe("st-1");
      expect(studentMark.marks).toHaveLength(3);
      expect(studentMark.marks[0].values).toEqual([null, null]);
    });

    it("builds journal marks matrix for unique students", () => {
      const matrix = buildJournalMarksMatrix("j-1", ["st-1", "st-2", "st-1"], TEMPLATE);
      expect(matrix.journalId).toBe("j-1");
      expect(matrix.studentMarks).toHaveLength(2);
      expect(matrix.studentMarks[0].studentId).toBe("st-1");
      expect(matrix.studentMarks[1].studentId).toBe("st-2");
    });
  });
});
