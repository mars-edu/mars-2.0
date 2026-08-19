import {
  itemsNeedingJournals,
  semesterEntry,
  hoursPerGroup,
  splitIntoGroups,
  filterEligibleStudents,
  type WorkloadItemLike,
  type WorkloadSemesterEntryLike,
} from "../lib";

const S1 = "sem-id-1";
const S2 = "sem-id-2";
const S3 = "sem-id-3";

function makeEntry(
  overrides: Partial<WorkloadSemesterEntryLike> = {}
): WorkloadSemesterEntryLike {
  return {
    semesterId: S1,
    weeks: 18,
    hours: 2,
    groupCount: 1,
    ...overrides,
  };
}

function makeItem(
  overrides: Partial<WorkloadItemLike> = {}
): WorkloadItemLike {
  return {
    id: "item-1",
    subjectId: "sub-1",
    course: "1",
    department: "IT",
    studentCount: "25",
    semesters: [makeEntry()],
    totalHours: 36,
    ...overrides,
  };
}

describe("convex/workloads/lib", () => {
  describe("hoursPerGroup", () => {
    it("multiplies weeks by hours-per-week", () => {
      expect(hoursPerGroup(makeEntry({ weeks: 18, hours: 2 }))).toBe(36);
      expect(hoursPerGroup(makeEntry({ weeks: 20, hours: 1 }))).toBe(20);
    });

    it("preserves fractional precision (audit fix #4 / #11)", () => {
      expect(hoursPerGroup(makeEntry({ weeks: 17, hours: 1.5 }))).toBe(25.5);
    });
  });

  describe("semesterEntry", () => {
    it("finds the entry matching the given semesterId", () => {
      const e1 = makeEntry({ semesterId: S1, weeks: 18, hours: 2 });
      const e2 = makeEntry({ semesterId: S2, weeks: 20, hours: 1 });
      const item = makeItem({ semesters: [e1, e2] });

      expect(semesterEntry(item, S1)).toEqual(e1);
      expect(semesterEntry(item, S2)).toEqual(e2);
      expect(semesterEntry(item, S3)).toBeUndefined();
    });
  });

  describe("itemsNeedingJournals", () => {
    it("includes items with hours > 0 or groupCount > 0 for the semester", () => {
      const i1 = makeItem({
        id: "i1",
        semesters: [makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 })],
      });
      const i2 = makeItem({
        id: "i2",
        semesters: [makeEntry({ semesterId: S1, weeks: 18, hours: 0, groupCount: 0 })],
      });
      const i3 = makeItem({
        id: "i3",
        semesters: [makeEntry({ semesterId: S2, weeks: 20, hours: 2, groupCount: 1 })],
      });

      const needing = itemsNeedingJournals([i1, i2, i3], S1);
      expect(needing.map((i) => i.id)).toEqual(["i1"]);
    });

    it("excludes _ind child rows from journal generation", () => {
      const main = makeItem({
        id: "main",
        semesters: [makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 })],
      });
      const ind = makeItem({
        id: "main_ind",
        semesters: [makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 })],
      });

      const needing = itemsNeedingJournals([main, ind], S1);
      expect(needing.map((i) => i.id)).toEqual(["main"]);
    });

    it("supports 3-semester academic years independently", () => {
      const item = makeItem({
        id: "multi-sem",
        semesters: [
          makeEntry({ semesterId: S1, weeks: 18, hours: 2, groupCount: 1 }),
          makeEntry({ semesterId: S2, weeks: 20, hours: 0, groupCount: 0 }),
          makeEntry({ semesterId: S3, weeks: 18, hours: 3, groupCount: 2 }),
        ],
      });

      expect(itemsNeedingJournals([item], S1).map((i) => i.id)).toEqual(["multi-sem"]);
      expect(itemsNeedingJournals([item], S2).map((i) => i.id)).toEqual([]);
      expect(itemsNeedingJournals([item], S3).map((i) => i.id)).toEqual(["multi-sem"]);
    });
  });

  describe("splitIntoGroups", () => {
    it("returns empty array for non-positive count", () => {
      expect(splitIntoGroups(["a", "b"], 0)).toEqual([]);
      expect(splitIntoGroups(["a", "b"], -1)).toEqual([]);
    });

    it("splits round-robin across groupCount buckets", () => {
      const res = splitIntoGroups(["a", "b", "c", "d", "e"], 2);
      expect(res).toEqual([
        ["a", "c", "e"],
        ["b", "d"],
      ]);
    });
  });

  describe("filterEligibleStudents", () => {
    it("returns empty array when no specialties provided", () => {
      expect(filterEligibleStudents([{ id: "1", specialty: "IT" }], [])).toEqual([]);
    });

    it("filters by specialty and status", () => {
      const students = [
        { id: "1", specialty: "IT", status: "active", language: "ru" },
        { id: "2", specialty: "ART", status: "active", language: "ru" },
        { id: "3", specialty: "IT", status: "expelled", language: "ru" },
        { id: "4", specialty: "IT", status: "active", language: "kk" },
      ];
      expect(filterEligibleStudents(students, ["IT"], "ru")).toEqual([students[0]]);
      expect(filterEligibleStudents(students, ["IT", "ART"])).toEqual([
        students[0],
        students[1],
        students[3],
      ]);
    });
  });
});
