import {
  semesterValue,
  semesterEntry,
  hoursPerGroup,
  itemsNeedingJournals,
  splitIntoGroups,
  filterEligibleStudents,
  type WorkloadItemLike,
  type WorkloadSemesterEntryLike,
} from "../lib";

const S1 = "sem-id-1";
const S2 = "sem-id-2";

const item = (over: Partial<WorkloadItemLike> = {}): WorkloadItemLike => ({
  id: "i1",
  subjectId: "rup1",
  course: "1",
  department: "Каф",
  studentCount: "20",
  weeks1: "18",
  weeks2: "20",
  hours1: "2",
  hours2: "2",
  hoursPerGroup1: "36",
  hoursPerGroup2: "40",
  groupCount1: "1",
  groupCount2: "1",
  totalHours: 76,
  ...over,
});

const entries = (over: Partial<WorkloadSemesterEntryLike>[] = []): WorkloadSemesterEntryLike[] => [
  { semesterId: S1, weeks: 18, hours: 2, groupCount: 1, ...over[0] },
  { semesterId: S2, weeks: 20, hours: 2, groupCount: 1, ...over[1] },
];

describe("semesterValue", () => {
  it("reads the flat field for the given semester", () => {
    expect(semesterValue(item(), 1, "hoursPerGroup")).toBe("36");
    expect(semesterValue(item(), 2, "hoursPerGroup")).toBe("40");
  });

  it("returns '0' for a missing optional third-semester field", () => {
    expect(semesterValue(item(), 3, "hoursPerGroup")).toBe("0");
  });
});

describe("hoursPerGroup", () => {
  it("derives weeks * hours", () => {
    expect(hoursPerGroup({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 })).toBe(36);
  });
});

describe("semesterEntry", () => {
  it("finds the array entry by semesterId", () => {
    const withArray = item({ semesters: entries() });
    expect(semesterEntry(withArray, S2)?.hours).toBe(2);
  });

  it("unknown semesterId → undefined (C1 policy handled by callers, not here)", () => {
    const withArray = item({ semesters: entries() });
    expect(semesterEntry(withArray, "unknown-semester")).toBeUndefined();
  });
});

describe("itemsNeedingJournals", () => {
  describe("array-keyed (semesters[] present)", () => {
    it("keeps items with positive hoursPerGroup for the semester", () => {
      const result = itemsNeedingJournals([item({ semesters: entries() })], S1);
      expect(result).toHaveLength(1);
    });

    it("keeps items with zero hours but a positive group count", () => {
      const result = itemsNeedingJournals(
        [item({ semesters: entries([{ hours: 0, groupCount: 2 }]) })],
        S1
      );
      expect(result).toHaveLength(1);
    });

    it("drops items with no hours and no groups for the semester", () => {
      const result = itemsNeedingJournals(
        [item({ semesters: entries([{ hours: 0, groupCount: 0 }]) })],
        S1
      );
      expect(result).toHaveLength(0);
    });

    it("drops items with no array entry for the semester at all", () => {
      const result = itemsNeedingJournals([item({ semesters: entries() })], "unknown-semester");
      expect(result).toHaveLength(0);
    });

    it("excludes paired individual (_ind) child items", () => {
      const result = itemsNeedingJournals([item({ id: "i1_ind", semesters: entries() })], S1);
      expect(result).toHaveLength(0);
    });
  });

  describe("legacy flat-field fallback (dual-read, no semesters[])", () => {
    it("keeps items with positive hoursPerGroup for the semester ordinal", () => {
      const result = itemsNeedingJournals([item()], S1, 1);
      expect(result).toHaveLength(1);
    });

    it("keeps items with zero hours but a positive group count", () => {
      const result = itemsNeedingJournals(
        [item({ hoursPerGroup1: "0", groupCount1: "2" })],
        S1,
        1
      );
      expect(result).toHaveLength(1);
    });

    it("drops items with no hours and no groups for the semester", () => {
      const result = itemsNeedingJournals(
        [item({ hoursPerGroup1: "0", groupCount1: "0" })],
        S1,
        1
      );
      expect(result).toHaveLength(0);
    });

    it("drops items when no semesterNumber fallback is given", () => {
      const result = itemsNeedingJournals([item()], S1);
      expect(result).toHaveLength(0);
    });

    it("excludes paired individual (_ind) child items", () => {
      const result = itemsNeedingJournals([item({ id: "i1_ind" })], S1, 1);
      expect(result).toHaveLength(0);
    });

    it("parity: array and flat representations of the same item agree", () => {
      const flatItem = item();
      const arrayItem = item({ semesters: entries() });
      const flatResult = itemsNeedingJournals([flatItem], S1, 1);
      const arrayResult = itemsNeedingJournals([arrayItem], S1);
      expect(flatResult).toHaveLength(1);
      expect(arrayResult).toHaveLength(1);
    });
  });
});

describe("splitIntoGroups", () => {
  it("returns one group containing everyone when groupCount is 1", () => {
    expect(splitIntoGroups(["a", "b", "c"], 1)).toEqual([["a", "b", "c"]]);
  });

  it("distributes round-robin across N groups", () => {
    expect(splitIntoGroups(["a", "b", "c", "d", "e"], 2)).toEqual([
      ["a", "c", "e"],
      ["b", "d"],
    ]);
  });

  it("returns N groups even when there are fewer students than groups", () => {
    expect(splitIntoGroups(["a"], 3)).toEqual([["a"], [], []]);
  });

  it("returns an empty list when groupCount is not positive", () => {
    expect(splitIntoGroups(["a", "b"], 0)).toEqual([]);
  });
});

describe("filterEligibleStudents", () => {
  const students = [
    { id: "s1", specialty: "A", status: "active" },
    { id: "s2", specialty: "B", status: "active" },
    { id: "s3", specialty: "A", status: "expelled" },
    { id: "s4", specialty: "A" }, // no status => treated active
  ];

  it("keeps active students whose specialty is in the discipline's specialties", () => {
    const result = filterEligibleStudents(students, ["A"]);
    expect(result.map((s) => s.id)).toEqual(["s1", "s4"]);
  });

  it("matches any of several specialties", () => {
    const result = filterEligibleStudents(students, ["A", "B"]);
    expect(result.map((s) => s.id)).toEqual(["s1", "s2", "s4"]);
  });

  it("excludes non-active students", () => {
    const result = filterEligibleStudents(students, ["A"]);
    expect(result.map((s) => s.id)).not.toContain("s3");
  });

  it("returns nothing when the discipline has no specialties", () => {
    expect(filterEligibleStudents(students, [])).toEqual([]);
  });

  it("narrows to a matching language when one is given", () => {
    const langStudents = [
      { id: "s1", specialty: "A", status: "active", language: "ru" },
      { id: "s2", specialty: "A", status: "active", language: "kk" },
    ];
    const result = filterEligibleStudents(langStudents, ["A"], "kk");
    expect(result.map((s) => s.id)).toEqual(["s2"]);
  });

  it("ignores language when none is given", () => {
    const langStudents = [
      { id: "s1", specialty: "A", status: "active", language: "ru" },
      { id: "s2", specialty: "A", status: "active", language: "kk" },
    ];
    const result = filterEligibleStudents(langStudents, ["A"]);
    expect(result.map((s) => s.id)).toEqual(["s1", "s2"]);
  });
});
