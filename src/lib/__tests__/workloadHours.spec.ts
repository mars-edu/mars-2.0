import {
  formatHours,
  recalcWorkloadItem,
  computeWorkloadTotal,
  hasIndividual,
  seedWorkloadItemsFromRup,
  findSemesterEntry,
  hoursPerGroup,
  type YearSemesterRef,
} from "../workloadHours";
import type { WorkloadItem, WorkloadSemesterEntry } from "@/types/workload";
import type { RupEntry } from "@/types/rup-entry";

const S1 = "sem-id-1";
const S2 = "sem-id-2";
const S3 = "sem-id-3";

const REFS: YearSemesterRef[] = [
  { semesterId: S1, number: 1, weeks: 18 },
  { semesterId: S2, number: 2, weeks: 20 },
];

function makeEntry(
  overrides: Partial<WorkloadSemesterEntry> = {}
): WorkloadSemesterEntry {
  return {
    semesterId: S1,
    weeks: 18,
    hours: 2,
    groupCount: 1,
    ...overrides,
  };
}

function makeItem(overrides: Partial<WorkloadItem> = {}): WorkloadItem {
  return {
    id: "test-1",
    subjectId: "rup-1",
    department: "ИТ",
    course: "1",
    studentCount: "25",
    semesters: [makeEntry()],
    totalHours: 36,
    ...overrides,
  };
}

function makeDist(overrides: Record<string, unknown> = {}) {
  return {
    id: "dist-1",
    academicYearId: "year-1",
    semesterId: S1,
    hours: "36",
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
}

function makeRup(overrides: Partial<RupEntry> = {}): RupEntry {
  return {
    id: "rup-1",
    specialtyIds: ["spec1"],
    academicYearId: "year-1",
    baseClass: [9],
    language: "ru",
    moduleIndex: "ООД 8",
    moduleName: "Информатика",
    learningOutcome: "Уметь писать код",
    totalCredits: "2",
    totalHours: "76",
    groupHours: "76",
    theoreticalHours: "36",
    labPracticalHours: "40",
    field3Value: "0",
    srspHours: "0",
    srsHours: "0",
    trainingPracticeHours: "0",
    individualHours: "0",
    individualAdditionalHours: "0",
    distributionEntries: [makeDist({ semesterId: S1, hours: "36" }), makeDist({ semesterId: S2, hours: "40" })],
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("workloadHours", () => {
  describe("formatHours", () => {
    it("returns integers as numbers, not formatted decimals", () => {
      expect(formatHours("36")).toBe(36);
      expect(formatHours(36)).toBe(36);
      expect(formatHours("0")).toBe(0);
    });

    it("formats non-integers with one decimal place", () => {
      expect(formatHours("36.5")).toBe("36.5");
      expect(formatHours(36.5)).toBe("36.5");
      expect(formatHours("36.55")).toBe("36.6");
    });

    it("handles invalid/empty input gracefully", () => {
      expect(formatHours("")).toBe(0);
      expect(formatHours(null)).toBe(0);
      expect(formatHours(undefined)).toBe(0);
      expect(formatHours("not-a-number")).toBe(0);
    });
  });

  describe("hoursPerGroup", () => {
    it("multiplies weeks by hours-per-week", () => {
      expect(hoursPerGroup(makeEntry({ weeks: 18, hours: 2 }))).toBe(36);
      expect(hoursPerGroup(makeEntry({ weeks: 20, hours: 1.5 }))).toBe(30);
    });
  });

  describe("findSemesterEntry", () => {
    it("returns matching entry or undefined", () => {
      const e1 = makeEntry({ semesterId: S1 });
      const e2 = makeEntry({ semesterId: S2 });
      const item = makeItem({ semesters: [e1, e2] });

      expect(findSemesterEntry(item, S1)).toBe(e1);
      expect(findSemesterEntry(item, S2)).toBe(e2);
      expect(findSemesterEntry(item, S3)).toBeUndefined();
    });
  });

  describe("recalcWorkloadItem", () => {
    it("calculates totalHours across semesters array", () => {
      const item = makeItem({
        semesters: [
          makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 2 }), // 18*2*2 = 72
          makeEntry({ semesterId: S2, weeks: 20, hours: 1, groupCount: 1 }), // 20*1*1 = 20
        ],
      });
      const result = recalcWorkloadItem(item);
      expect(result.totalHours).toBe(92);
    });

    it("preserves rounding invariant: Math.round once on the total", () => {
      // 48 hours / 18 weeks = 2.666... hours/week.
      // 18 * (48/18) * 1 group = 48 hours total.
      const item = makeItem({
        semesters: [makeEntry({ semesterId: S1, weeks: 18, hours: 48 / 18, groupCount: 1 })],
      });
      const result = recalcWorkloadItem(item);
      expect(result.totalHours).toBe(48);
    });

    it("orphan entries (semesterId not in year) still contribute to totalHours (C1 fail-visible)", () => {
      const item = makeItem({
        semesters: [
          makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 }), // 36
          makeEntry({ semesterId: "unknown-orphan-sem", weeks: 10, hours: 2, groupCount: 1 }), // 20
        ],
      });
      const result = recalcWorkloadItem(item);
      expect(result.totalHours).toBe(56);
    });
  });

  describe("computeWorkloadTotal", () => {
    it("sums totalHours across all items", () => {
      const items = [
        makeItem({ totalHours: 72 }),
        makeItem({ totalHours: 36 }),
        makeItem({ totalHours: 18 }),
      ];
      expect(computeWorkloadTotal(items)).toBe(126);
    });

    it("returns 0 for empty array", () => {
      expect(computeWorkloadTotal([])).toBe(0);
    });
  });

  describe("hasIndividual", () => {
    it("returns true when distributionEntries have individualHours > 0", () => {
      const rup = makeRup({
        distributionEntries: [makeDist({ individualHours: "10" })],
      });
      expect(hasIndividual(rup)).toBe(true);
    });

    it("returns true when top-level individualAdditionalHours > 0", () => {
      const rup = makeRup({
        distributionEntries: [makeDist({ individualHours: "0" })],
        individualAdditionalHours: "15",
      });
      expect(hasIndividual(rup)).toBe(true);
    });

    it("returns false when no individual hours exist", () => {
      const rup = makeRup({
        distributionEntries: [makeDist({ individualHours: "0" })],
        individualHours: "0",
        individualAdditionalHours: "0",
      });
      expect(hasIndividual(rup)).toBe(false);
    });
  });

  describe("seedWorkloadItemsFromRup", () => {
    it("seeds an explicit array entry for EVERY semester of the year", () => {
      const rup = makeRup({
        distributionEntries: [
          makeDist({ semesterId: S1, hours: "36" }),
          makeDist({ semesterId: S2, hours: "40" }),
        ],
      });
      const items = seedWorkloadItemsFromRup(rup, {
        department: "ИТ",
        language: "ru",
        individual: false,
        specialtyIds: ["spec1"],
        yearSemesters: REFS,
        idFactory: () => "main1",
      });

      expect(items).toHaveLength(1);
      const main = items[0];
      expect(main.id).toBe("main1");
      expect(main.semesters).toHaveLength(2);
      expect(main.semesters[0]).toEqual({
        semesterId: S1,
        weeks: 18,
        hours: 2,
        groupCount: 1,
      });
      expect(main.semesters[1]).toEqual({
        semesterId: S2,
        weeks: 20,
        hours: 2,
        groupCount: 1,
      });
      expect(main.totalHours).toBe(76);
    });

    it("defect #1 FIXED: a 3-semester year seeds entries for all 3 semesters", () => {
      const refs3: YearSemesterRef[] = [
        { semesterId: S1, number: 1, weeks: 18 },
        { semesterId: S2, number: 2, weeks: 20 },
        { semesterId: S3, number: 3, weeks: 18 },
      ];
      const rup = makeRup({
        distributionEntries: [
          makeDist({ semesterId: S1, hours: "36" }),
          makeDist({ semesterId: S2, hours: "40" }),
          makeDist({ semesterId: S3, hours: "18" }),
        ],
      });
      const items = seedWorkloadItemsFromRup(rup, {
        department: "ИТ",
        language: "ru",
        individual: false,
        specialtyIds: ["spec1"],
        yearSemesters: refs3,
        idFactory: () => "main3",
      });

      expect(items[0].semesters).toHaveLength(3);
      expect(items[0].semesters[2]).toEqual({
        semesterId: S3,
        weeks: 18,
        hours: 1,
        groupCount: 1,
      });
      expect(items[0].totalHours).toBe(94); // 36 + 40 + 18
    });

    it("defect #2 FIXED / gap B1 closed: binds by semesterId, drops foreign-year rows", () => {
      const FOREIGN_SEM = "foreign-sem-id";
      const rup = makeRup({
        distributionEntries: [
          makeDist({ semesterId: S2, hours: "40" }), // S2 listed first
          makeDist({ semesterId: S1, hours: "36" }), // S1 listed second
          makeDist({ semesterId: FOREIGN_SEM, hours: "100" }), // foreign
        ],
      });
      const items = seedWorkloadItemsFromRup(rup, {
        department: "ИТ",
        language: "ru",
        individual: false,
        specialtyIds: ["spec1"],
        yearSemesters: REFS,
        idFactory: () => "main4",
      });

      expect(items[0].semesters[0].hours).toBe(2); // S1 = 36/18 = 2
      expect(items[0].semesters[1].hours).toBe(2); // S2 = 40/20 = 2
      expect(items[0].totalHours).toBe(76); // Foreign 100h ignored
    });

    it("seeds _ind row when individual hours exist in distributionEntries", () => {
      const rup = makeRup({
        distributionEntries: [
          makeDist({ semesterId: S1, hours: "36", individualHours: "18" }),
          makeDist({ semesterId: S2, hours: "40", individualHours: "20" }),
        ],
      });
      const items = seedWorkloadItemsFromRup(rup, {
        department: "ИТ",
        language: "ru",
        individual: true,
        specialtyIds: ["spec1"],
        yearSemesters: REFS,
        idFactory: () => "main5",
      });

      expect(items).toHaveLength(2);
      const ind = items[1];
      expect(ind.id).toBe("main5_ind");
      expect(ind.department).toBe("Индивидуальные");
      expect(ind.semesters[0]).toEqual({
        semesterId: S1,
        weeks: 18,
        hours: 1, // 18 / 18
        groupCount: 1,
      });
      expect(ind.semesters[1]).toEqual({
        semesterId: S2,
        weeks: 20,
        hours: 1, // 20 / 20
        groupCount: 1,
      });
      expect(ind.totalHours).toBe(38); // 18 + 20
    });
  });
});
