// Characterization tests for src/lib/workloadHours.ts (Phase 0 of the
// workload array-migration).
//
// These tests PIN the CURRENT behavior of the logic extracted verbatim from
// src/pages/WorkloadManagement.vue — including known quirks/bugs. They are
// NOT a spec of "correct" behavior. Do not "fix" the tests to match
// aspirational output; when the underlying logic changes intentionally,
// update the pinned values deliberately and note why.

import {
  formatHours,
  recalcWorkloadItem,
  computeWorkloadTotal,
  hasIndividual,
  seedWorkloadItemsFromRup,
} from "../workloadHours";
import type { WorkloadItem } from "@/types/workload";
import type { RupEntry, DistributionEntry } from "@/types/rup-entry";

function makeItem(over: Partial<WorkloadItem> = {}): WorkloadItem {
  return {
    id: "i1",
    subjectId: "rup1",
    department: "Каф",
    course: "1",
    studentCount: "20",
    weeks1: "18",
    weeks2: "20",
    hours1: "0",
    hours2: "0",
    hoursPerGroup1: "0",
    hoursPerGroup2: "0",
    groupCount1: "1",
    groupCount2: "1",
    totalHours: 0,
    ...over,
  };
}

function makeDist(over: Partial<DistributionEntry> = {}): DistributionEntry {
  return {
    id: "d1",
    academicYearId: "ay1",
    semesterId: "s1",
    hours: "0",
    ...over,
  };
}

function makeRup(over: Partial<RupEntry> = {}): RupEntry {
  return {
    id: "rup1",
    specialtyIds: ["spec1"],
    academicYearId: "ay1",
    baseClass: [11],
    language: "ru",
    moduleIndex: "БД 1",
    moduleName: "Тестовый предмет",
    learningOutcome: "",
    totalCredits: "5",
    totalHours: "150",
    groupHours: "0",
    theoreticalHours: "0",
    labPracticalHours: "0",
    field3Value: "0",
    srspHours: "0",
    srsHours: "0",
    trainingPracticeHours: "0",
    individualHours: "0",
    individualAdditionalHours: "0",
    distributionEntries: [],
    position: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...over,
  };
}

describe("recalcWorkloadItem", () => {
  it("basic single-semester: weeks1=18,hours1=2,groupCount1=1 -> hoursPerGroup1='36', totalHours=36", () => {
    const item = makeItem({ weeks1: "18", hours1: "2", groupCount1: "1" });
    const result = recalcWorkloadItem(item, 2);
    expect(result.hoursPerGroup1).toBe("36");
    expect(result.totalHours).toBe(36);
  });

  it("multi-semester with groups: sem1(18,2,gc2)=72 + sem2(20,1.5,gc1)=30 -> totalHours=102", () => {
    const item = makeItem({
      weeks1: "18",
      hours1: "2",
      groupCount1: "2",
      weeks2: "20",
      hours2: "1.5",
      groupCount2: "1",
    });
    const result = recalcWorkloadItem(item, 2);
    expect(result.hoursPerGroup1).toBe("36");
    expect(result.hoursPerGroup2).toBe("30");
    expect(result.totalHours).toBe(102);
  });

  it("rounding lock: hours1=48/18 precise decimal, gc1=1 -> totalHours=48 (Math.round applied to SUM, not pre-rounded per-semester)", () => {
    const hours1 = (48 / 18).toString(); // "2.6666666666666665"
    const item = makeItem({ weeks1: "18", hours1, groupCount1: "1" });
    const result = recalcWorkloadItem(item, 1);
    expect(result.totalHours).toBe(48);
  });

  it("rounding lock: same precise hours1, gc1=3 -> totalHours=144", () => {
    const hours1 = (48 / 18).toString();
    const item = makeItem({ weeks1: "18", hours1, groupCount1: "3" });
    const result = recalcWorkloadItem(item, 1);
    expect(result.totalHours).toBe(144);
  });

  it("empty fields are treated as 0 and do not throw", () => {
    const item = makeItem({ weeks1: "", hours1: "", groupCount1: "" });
    expect(() => recalcWorkloadItem(item, 1)).not.toThrow();
    const result = recalcWorkloadItem(item, 1);
    expect(result.hoursPerGroup1).toBe("0");
    expect(result.totalHours).toBe(0);
  });

  it("characterizes: a non-numeric hours string ('abc') parses to NaN and poisons the total (NOT treated as 0)", () => {
    const item = makeItem({ weeks1: "18", hours1: "abc", groupCount1: "1" });
    expect(() => recalcWorkloadItem(item, 1)).not.toThrow();
    const result = recalcWorkloadItem(item, 1);
    expect(result.hoursPerGroup1).toBe("NaN");
    expect(Number.isNaN(result.totalHours)).toBe(true);
  });

  it("missing (undefined) semester fields beyond weeks1/weeks2 are treated as 0", () => {
    const item = makeItem();
    const result = recalcWorkloadItem(item, 3);
    expect(result.hoursPerGroup3).toBe("0");
    expect(result.totalHours).toBe(0);
  });
});

describe("computeWorkloadTotal", () => {
  it("sums item.totalHours across items, including _ind rows", () => {
    const items = [
      makeItem({ id: "a", totalHours: 76 }),
      makeItem({ id: "a_ind", totalHours: 10 }),
      makeItem({ id: "b", totalHours: 40 }),
    ];
    expect(computeWorkloadTotal(items)).toBe(126);
  });

  it("treats missing/falsy totalHours as 0", () => {
    const items = [makeItem({ id: "a", totalHours: 0 }), makeItem({ id: "b", totalHours: 5 })];
    expect(computeWorkloadTotal(items)).toBe(5);
  });
});

describe("formatHours", () => {
  it("integer values pass through as numbers: 36 -> 36", () => {
    expect(formatHours(36)).toBe(36);
    expect(formatHours("36")).toBe(36);
  });

  it("non-integer values are fixed to 1 decimal string: 2.6666... -> '2.7'", () => {
    expect(formatHours(48 / 18)).toBe("2.7");
  });

  it("empty/undefined -> 0", () => {
    expect(formatHours("")).toBe(0);
    expect(formatHours(undefined)).toBe(0);
  });
});

describe("hasIndividual", () => {
  it("true when distributionEntries carry individualHours summing > 0", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ individualHours: "5" }), makeDist({ individualHours: "0" })],
    });
    expect(hasIndividual(rup)).toBe(true);
  });

  it("false when no individual hours anywhere", () => {
    const rup = makeRup({ distributionEntries: [makeDist({ individualHours: "0" })] });
    expect(hasIndividual(rup)).toBe(false);
  });

  it("falls back to individualAdditionalHours, then individualHours", () => {
    expect(hasIndividual(makeRup({ individualAdditionalHours: "8" }))).toBe(true);
    expect(hasIndividual(makeRup({ individualHours: "3" }))).toBe(true);
  });
});

describe("seedWorkloadItemsFromRup", () => {
  it("basic (no individual): default weeks, hoursPerGroup from distributionEntries, hours=hoursPerGroup/weeks, totalHours computed", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ hours: "36" }), makeDist({ hours: "40" })],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      semesterCount: 2,
      idFactory: () => "main1",
    });
    expect(items).toHaveLength(1);
    const main = items[0];
    expect(main.id).toBe("main1");
    // No semesterWeeks passed → every semester falls back to
    // DEFAULT_SEMESTER_WEEKS (18). The old 18/20 hardcode is gone; weeks now
    // come from each semester's configured weeksCount.
    expect(main.weeks1).toBe("18");
    expect(main.weeks2).toBe("18");
    expect(main.hoursPerGroup1).toBe("36");
    expect(main.hoursPerGroup2).toBe("40");
    expect(main.hours1).toBe("2");
    expect(main.hours2).toBe((40 / 18).toString());
    expect(main.totalHours).toBe(76);
  });

  it("semesterWeeks config drives weeks per semester (replaces the old 18/20 hardcode)", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ hours: "36" }), makeDist({ hours: "40" })],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      semesterCount: 2,
      semesterWeeks: { 1: 18, 2: 20 },
      idFactory: () => "cfg1",
    });
    const main = items[0];
    expect(main.weeks1).toBe("18");
    expect(main.weeks2).toBe("20");
    expect(main.hours1).toBe("2");
    expect(main.hours2).toBe("2");
    expect(main.totalHours).toBe(76);
  });

  it("defect #1 FIXED: a 3-semester year now seeds weeks/groupCount for semester 3, so its hours survive", () => {
    // Was a characterization pin for defect #1: weeks3/groupCount3 were never
    // initialized (only 1/2 were hardcoded 18/20), so recalcWorkloadItem read
    // weeks3 = 0 and silently zeroed the third semester. Seeding now fills every
    // semester up to semesterCount from the configured weeksCount.
    const rup = makeRup({
      distributionEntries: [makeDist({ hours: "36" }), makeDist({ hours: "40" }), makeDist({ hours: "20" })],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      semesterCount: 3,
      semesterWeeks: { 1: 18, 2: 20, 3: 18 },
      idFactory: () => "main2",
    });
    const main = items[0];
    expect(main.weeks3).toBe("18");
    expect(main.groupCount3).toBe("1");
    expect(main.hoursPerGroup3).toBe("20");
    expect(main.totalHours).toBe(96); // 36 + 40 + 20 — third semester counted
  });

  it("_ind row, filledFromDist=true: per-semester individualHours from distributionEntries", () => {
    const rup = makeRup({
      distributionEntries: [
        makeDist({ hours: "36", individualHours: "10" }),
        makeDist({ hours: "40", individualHours: "0" }),
      ],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      semesterCount: 2,
      idFactory: () => "main3",
    });
    expect(items).toHaveLength(2);
    const ind = items[1];
    expect(ind.id).toBe("main3_ind");
    expect(ind.department).toBe("Индивидуальные");
    expect(ind.hoursPerGroup1).toBe("10");
    expect(ind.groupCount1).toBe("1");
    expect(ind.hoursPerGroup2).toBe("0");
    expect(ind.groupCount2).toBe("0"); // untouched — filledFromDist path only wrote semester 1
    expect(ind.totalHours).toBe(10);
  });

  it("_ind row, fallback: no per-semester individualHours, individualAdditionalHours split across active semesters", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ hours: "36" }), makeDist({ hours: "0" })],
      individualAdditionalHours: "12",
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      semesterCount: 2,
      idFactory: () => "main4",
    });
    const ind = items[1];
    // only semester 1 is "active" (hours > 0), so the full 12 lands there.
    expect(ind.hoursPerGroup1).toBe("12");
    expect(ind.groupCount1).toBe("1");
    expect(ind.hoursPerGroup2).toBe("0");
    expect(ind.totalHours).toBe(12);
  });

  it("_ind row, fallback with no active semesters: splits evenly across ALL semesters", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ hours: "0" }), makeDist({ hours: "0" })],
      individualAdditionalHours: "20",
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      semesterCount: 2,
      idFactory: () => "main5",
    });
    const ind = items[1];
    expect(ind.hoursPerGroup1).toBe("10");
    expect(ind.hoursPerGroup2).toBe("10");
    expect(ind.totalHours).toBe(20);
  });

  it("no _ind row when individual option is false, even if the rup carries individual hours", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ hours: "36", individualHours: "10" })],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      semesterCount: 1,
      idFactory: () => "main6",
    });
    expect(items).toHaveLength(1);
  });

  it("no _ind row when individual is true but hasIndividual(rup) is false", () => {
    const rup = makeRup({ distributionEntries: [makeDist({ hours: "36" })] });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      semesterCount: 1,
      idFactory: () => "main7",
    });
    expect(items).toHaveLength(1);
  });

  it("uses idFactory for the main id and '<id>_ind' for the paired row", () => {
    const rup = makeRup({ distributionEntries: [makeDist({ hours: "36", individualHours: "5" })] });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      semesterCount: 1,
      idFactory: () => "deterministic-id",
    });
    expect(items[0].id).toBe("deterministic-id");
    expect(items[1].id).toBe("deterministic-id_ind");
  });

  // Part B / #11: pin the shape of the main item against what the workloads
  // Convex schema expects, so extraction/refactoring can't silently drop or
  // rename a field the schema requires.
  it("main item has all keys the workloads schema expects", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ hours: "36" }), makeDist({ hours: "40" })],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      semesterCount: 2,
      idFactory: () => "main-shape",
    });
    const main = items[0];
    const expectedKeys = [
      "id",
      "subjectId",
      "department",
      "course",
      "studentCount",
      "weeks1",
      "weeks2",
      "hours1",
      "hours2",
      "hoursPerGroup1",
      "hoursPerGroup2",
      "groupCount1",
      "groupCount2",
      "totalHours",
      "index",
      "description",
      "language",
      "specialtyIds",
    ];
    for (const key of expectedKeys) {
      expect(main).toHaveProperty(key);
    }
  });

  it("main item's totalHours is a number, matching the schema's v.number()", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ hours: "36" }), makeDist({ hours: "40" })],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      semesterCount: 2,
      idFactory: () => "main-numeric",
    });
    expect(typeof items[0].totalHours).toBe("number");
  });
});
