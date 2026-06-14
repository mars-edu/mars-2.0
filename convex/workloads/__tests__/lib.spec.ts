import {
  semesterValue,
  itemsNeedingJournals,
  splitIntoGroups,
  filterEligibleStudents,
  type WorkloadItemLike,
} from "../lib";

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
  totalHours: "76",
  ...over,
});

describe("semesterValue", () => {
  it("reads the field for the given semester", () => {
    expect(semesterValue(item(), 1, "hoursPerGroup")).toBe("36");
    expect(semesterValue(item(), 2, "hoursPerGroup")).toBe("40");
  });

  it("returns '0' for a missing optional third-semester field", () => {
    expect(semesterValue(item(), 3, "hoursPerGroup")).toBe("0");
  });
});

describe("itemsNeedingJournals", () => {
  it("keeps items with positive hoursPerGroup for the semester", () => {
    const result = itemsNeedingJournals([item()], 1);
    expect(result).toHaveLength(1);
  });

  it("keeps items with zero hours but a positive group count", () => {
    const result = itemsNeedingJournals(
      [item({ hoursPerGroup1: "0", groupCount1: "2" })],
      1
    );
    expect(result).toHaveLength(1);
  });

  it("drops items with no hours and no groups for the semester", () => {
    const result = itemsNeedingJournals(
      [item({ hoursPerGroup1: "0", groupCount1: "0" })],
      1
    );
    expect(result).toHaveLength(0);
  });

  it("excludes paired individual (_ind) child items", () => {
    const result = itemsNeedingJournals([item({ id: "i1_ind" })], 1);
    expect(result).toHaveLength(0);
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
