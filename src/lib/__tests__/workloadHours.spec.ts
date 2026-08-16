// Characterization + spec tests for src/lib/workloadHours.ts.
//
// Phase 0 pinned the CURRENT (flat-field) behavior of the logic extracted
// verbatim from src/pages/WorkloadManagement.vue, including known
// quirks/bugs. Phase 3 (array-migration) intentionally flips several of
// those pins now that `item.semesters[]` is the source of truth — each flip
// is called out below. Rounding-lock invariants are a payroll-accuracy
// contract and are NOT allowed to change value, only fixture shape.

import {
  formatHours,
  recalcWorkloadItem,
  computeWorkloadTotal,
  hasIndividual,
  seedWorkloadItemsFromRup,
  findSemesterEntry,
  hoursPerGroup,
  syncFlatFieldsFromSemesters,
  type YearSemesterRef,
} from "../workloadHours";
import type { WorkloadItem, WorkloadSemesterEntry } from "@/types/workload";
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

const S1 = "sem-1";
const S2 = "sem-2";
const S3 = "sem-3";

const REFS: YearSemesterRef[] = [
  { semesterId: S1, number: 1, weeks: 18 },
  { semesterId: S2, number: 2, weeks: 20 },
  { semesterId: S3, number: 3, weeks: 18 },
];

function makeEntry(over: Partial<WorkloadSemesterEntry> = {}): WorkloadSemesterEntry {
  return { semesterId: S1, weeks: 18, hours: 0, groupCount: 1, ...over };
}

describe("recalcWorkloadItem", () => {
  describe("legacy flat-field path (item.semesters absent)", () => {
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

  describe("array path (item.semesters present) — Phase 3 source of truth", () => {
    it("rounding lock, array form: weeks=18, hours=48/18 precise decimal, groupCount=1 -> totalHours=48", () => {
      const item = makeItem({
        semesters: [makeEntry({ semesterId: S1, weeks: 18, hours: 48 / 18, groupCount: 1 })],
      });
      const result = recalcWorkloadItem(item, 1, [REFS[0]]);
      expect(result.totalHours).toBe(48);
    });

    it("multi-entry: sums hoursPerGroup(e)*groupCount across all entries, rounds once", () => {
      const item = makeItem({
        semesters: [
          makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 2 }), // 72
          makeEntry({ semesterId: S2, weeks: 20, hours: 1.5, groupCount: 1 }), // 30
        ],
      });
      const result = recalcWorkloadItem(item, 2, REFS.slice(0, 2));
      expect(result.totalHours).toBe(102);
    });

    it("a semester without an array entry contributes 0 (defect #1 territory, now structural)", () => {
      const item = makeItem({
        semesters: [
          makeEntry({ semesterId: S1, weeks: 18, hours: 0, groupCount: 1 }),
          makeEntry({ semesterId: S2, weeks: 20, hours: 0, groupCount: 1 }),
          // no entry for S3
        ],
      });
      const result = recalcWorkloadItem(item, 3, REFS);
      expect(result.totalHours).toBe(0);
      expect(result.hoursPerGroup3).toBe("0");
    });

    it("C1 orphan policy: an entry whose semesterId isn't in refs keeps contributing to totalHours (fail-visible, never silently dropped)", () => {
      const item = makeItem({
        semesters: [
          makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 }), // 36
          makeEntry({ semesterId: "orphan-semester", weeks: 10, hours: 2, groupCount: 1 }), // 20
        ],
      });
      // refs only knows about S1 — "orphan-semester" is not a semester of the
      // (simulated) current year, e.g. deleted/reassigned.
      const result = recalcWorkloadItem(item, 1, [REFS[0]]);
      expect(result.totalHours).toBe(56); // 36 + 20, orphan entry still counted
    });

    it("dual-write: syncs flat fields from the array when refs are given", () => {
      const item = makeItem({
        semesters: [makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 })],
      });
      const result = recalcWorkloadItem(item, 1, [REFS[0]]);
      expect(result.weeks1).toBe("18");
      expect(result.hours1).toBe("2");
      expect(result.hoursPerGroup1).toBe("36");
      expect(result.groupCount1).toBe("1");
    });

    it("without refs the FLAT fields stay the source of truth, array is ignored", () => {
      // The pre-Phase-3 UI edits flat fields directly and passes no refs.
      // Sourcing from the array there would silently discard the user's edit,
      // since seeding populates semesters[] from the start. Flat wins, and the
      // (now stale) array is left untouched — the backfill is idempotent and
      // gets re-run right before the UI half of Phase 3 ships.
      const item = makeItem({
        weeks1: "10",
        hours1: "3",
        groupCount1: "1",
        semesters: [makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 })],
      });
      const result = recalcWorkloadItem(item, 1);
      expect(result.totalHours).toBe(30); // 10*3 from the flat edit, not 36 from the array
      expect(result.weeks1).toBe("10"); // untouched
      expect(result.semesters?.[0].weeks).toBe(18); // array left alone, not back-mapped
    });
  });
});

describe("findSemesterEntry", () => {
  it("returns the matching entry by semesterId", () => {
    const item = makeItem({ semesters: [makeEntry({ semesterId: S1 }), makeEntry({ semesterId: S2 })] });
    expect(findSemesterEntry(item, S2)?.semesterId).toBe(S2);
  });

  it("returns undefined for an unknown semesterId", () => {
    const item = makeItem({ semesters: [makeEntry({ semesterId: S1 })] });
    expect(findSemesterEntry(item, "nope")).toBeUndefined();
  });

  it("returns undefined when semesters is absent", () => {
    expect(findSemesterEntry(makeItem(), S1)).toBeUndefined();
  });
});

describe("hoursPerGroup", () => {
  it("derives weeks * hours", () => {
    expect(hoursPerGroup(makeEntry({ weeks: 18, hours: 2 }))).toBe(36);
    expect(hoursPerGroup(makeEntry({ weeks: 20, hours: 1.5 }))).toBe(30);
  });
});

describe("syncFlatFieldsFromSemesters", () => {
  it("mirrors the array into the flat fields (parity, until Phase 5)", () => {
    const item = makeItem({
      semesters: [
        makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 2 }),
        makeEntry({ semesterId: S2, weeks: 20, hours: 1.5, groupCount: 1 }),
      ],
    });
    syncFlatFieldsFromSemesters(item, REFS.slice(0, 2));
    expect(item.weeks1).toBe("18");
    expect(item.hours1).toBe("2");
    expect(item.hoursPerGroup1).toBe("36");
    expect(item.groupCount1).toBe("2");
    expect(item.weeks2).toBe("20");
    expect(item.hours2).toBe("1.5");
    expect(item.hoursPerGroup2).toBe("30");
    expect(item.groupCount2).toBe("1");
  });

  it("writes zeros for a ref with no matching array entry", () => {
    const item = makeItem({ semesters: [makeEntry({ semesterId: S1 })] });
    syncFlatFieldsFromSemesters(item, REFS);
    expect(item.weeks3).toBe("0");
    expect(item.hours3).toBe("0");
    expect(item.hoursPerGroup3).toBe("0");
    expect(item.groupCount3).toBe("0");
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
  it("basic (no individual): default weeks, hoursPerGroup from distributionEntries bound by semesterId, hours=hoursPerGroup/weeks, totalHours computed", () => {
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
      yearSemesters: [
        { semesterId: S1, number: 1 },
        { semesterId: S2, number: 2 },
      ],
      idFactory: () => "main1",
    });
    expect(items).toHaveLength(1);
    const main = items[0];
    expect(main.id).toBe("main1");
    expect(main.semesters).toHaveLength(2);
    // No weeks configured on the refs → every semester falls back to
    // DEFAULT_SEMESTER_WEEKS (18).
    expect(main.weeks1).toBe("18");
    expect(main.weeks2).toBe("18");
    expect(main.hoursPerGroup1).toBe("36");
    expect(main.hoursPerGroup2).toBe("40");
    expect(main.hours1).toBe("2");
    expect(main.hours2).toBe((40 / 18).toString());
    expect(main.totalHours).toBe(76);
  });

  it("yearSemesters' configured weeks drive weeks per semester (replaces the old 18/20 hardcode)", () => {
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
      yearSemesters: [
        { semesterId: S1, number: 1, weeks: 18 },
        { semesterId: S2, number: 2, weeks: 20 },
      ],
      idFactory: () => "cfg1",
    });
    const main = items[0];
    expect(main.weeks1).toBe("18");
    expect(main.weeks2).toBe("20");
    expect(main.hours1).toBe("2");
    expect(main.hours2).toBe("2");
    expect(main.totalHours).toBe(76);
  });

  it("defect #1 FIXED: a 3-semester year seeds an explicit array entry for every semester, including the third, so its hours survive", () => {
    // Was a characterization pin for defect #1: weeks3/groupCount3 were never
    // initialized (only 1/2 were hardcoded 18/20), so recalc read weeks3 = 0
    // and silently zeroed the third semester. Seeding now initializes
    // item.semesters[] with one explicit entry per yearSemesters ref.
    const rup = makeRup({
      distributionEntries: [
        makeDist({ semesterId: S1, hours: "36" }),
        makeDist({ semesterId: S2, hours: "40" }),
        makeDist({ semesterId: S3, hours: "20" }),
      ],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      yearSemesters: REFS,
      idFactory: () => "main2",
    });
    const main = items[0];
    expect(main.semesters).toHaveLength(3);
    expect(main.weeks3).toBe("18");
    expect(main.groupCount3).toBe("1");
    expect(main.hoursPerGroup3).toBe("20");
    expect(main.totalHours).toBe(96); // 36 + 40 + 20 — third semester counted
  });

  it("defect #2 FIXED / gap B1 closed: distribution entries bind by semesterId, not array position — out-of-order entries land on the right semester, foreign-year entries are ignored", () => {
    const rup = makeRup({
      distributionEntries: [
        // Deliberately out of "natural" order, plus one entry for a semester
        // that does NOT belong to the selected year (another academic year).
        makeDist({ semesterId: S2, hours: "40" }),
        makeDist({ semesterId: "foreign-year-semester", hours: "999" }),
        makeDist({ semesterId: S1, hours: "36" }),
      ],
    });
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      yearSemesters: [
        { semesterId: S1, number: 1, weeks: 18 },
        { semesterId: S2, number: 2, weeks: 20 },
      ],
      idFactory: () => "main-order",
    });
    const main = items[0];
    expect(main.hoursPerGroup1).toBe("36"); // bound to S1, not the first entry seen
    expect(main.hoursPerGroup2).toBe("40"); // bound to S2
    expect(main.totalHours).toBe(76); // foreign entry (999) is dropped, not summed
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it("_ind row, filledFromDist=true: per-semester individualHours from distributionEntries, bound by semesterId", () => {
    const rup = makeRup({
      distributionEntries: [
        makeDist({ semesterId: S1, hours: "36", individualHours: "10" }),
        makeDist({ semesterId: S2, hours: "40", individualHours: "0" }),
      ],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      yearSemesters: [
        { semesterId: S1, number: 1 },
        { semesterId: S2, number: 2 },
      ],
      idFactory: () => "main3",
    });
    expect(items).toHaveLength(2);
    const ind = items[1];
    expect(ind.id).toBe("main3_ind");
    expect(ind.department).toBe("Индивидуальные");
    expect(ind.semesters).toHaveLength(2);
    expect(ind.hoursPerGroup1).toBe("10");
    expect(ind.groupCount1).toBe("1");
    expect(ind.hoursPerGroup2).toBe("0");
    expect(ind.groupCount2).toBe("0"); // untouched — filledFromDist path only wrote semester 1
    expect(ind.totalHours).toBe(10);
  });

  it("_ind row, fallback: no per-semester individualHours, individualAdditionalHours split across active semesters", () => {
    const rup = makeRup({
      distributionEntries: [
        makeDist({ semesterId: S1, hours: "36" }),
        makeDist({ semesterId: S2, hours: "0" }),
      ],
      individualAdditionalHours: "12",
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      yearSemesters: [
        { semesterId: S1, number: 1 },
        { semesterId: S2, number: 2 },
      ],
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
      distributionEntries: [
        makeDist({ semesterId: S1, hours: "0" }),
        makeDist({ semesterId: S2, hours: "0" }),
      ],
      individualAdditionalHours: "20",
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      yearSemesters: [
        { semesterId: S1, number: 1, weeks: 20 },
        { semesterId: S2, number: 2, weeks: 20 },
      ],
      idFactory: () => "main5",
    });
    const ind = items[1];
    expect(ind.hoursPerGroup1).toBe("10");
    expect(ind.hoursPerGroup2).toBe("10");
    expect(ind.totalHours).toBe(20);
  });

  it("no _ind row when individual option is false, even if the rup carries individual hours", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ semesterId: S1, hours: "36", individualHours: "10" })],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: false,
      specialtyIds: ["spec1"],
      yearSemesters: [{ semesterId: S1, number: 1 }],
      idFactory: () => "main6",
    });
    expect(items).toHaveLength(1);
  });

  it("no _ind row when individual is true but hasIndividual(rup) is false", () => {
    const rup = makeRup({ distributionEntries: [makeDist({ semesterId: S1, hours: "36" })] });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      yearSemesters: [{ semesterId: S1, number: 1 }],
      idFactory: () => "main7",
    });
    expect(items).toHaveLength(1);
  });

  it("uses idFactory for the main id and '<id>_ind' for the paired row", () => {
    const rup = makeRup({
      distributionEntries: [makeDist({ semesterId: S1, hours: "36", individualHours: "5" })],
    });
    const items = seedWorkloadItemsFromRup(rup, {
      department: "ИТ",
      language: "ru",
      individual: true,
      specialtyIds: ["spec1"],
      yearSemesters: [{ semesterId: S1, number: 1 }],
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
      yearSemesters: [
        { semesterId: S1, number: 1 },
        { semesterId: S2, number: 2 },
      ],
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
      "semesters",
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
      yearSemesters: [
        { semesterId: S1, number: 1 },
        { semesterId: S2, number: 2 },
      ],
      idFactory: () => "main-numeric",
    });
    expect(typeof items[0].totalHours).toBe("number");
  });
});
