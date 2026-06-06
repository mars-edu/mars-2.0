import {
  computeWeeklySlotHours,
  computeScheduleHours,
  resolveIndividualBudget,
} from "../scheduleHours";

const scheduleIds = ["p1", "p2", "p3", "p4", "p5"];

describe("computeWeeklySlotHours", () => {
  it("counts inclusive lesson-period span per slot", () => {
    // p1..p2 = 2 hours, p3..p3 = 1 hour
    const slots = [
      { startId: "p1", endId: "p2" },
      { startId: "p3", endId: "p3" },
    ];
    expect(computeWeeklySlotHours(slots, scheduleIds)).toBe(3);
  });

  it("skips incomplete and inverted slots", () => {
    const slots = [
      { startId: "p1", endId: "" },
      { startId: "", endId: "p2" },
      { startId: "p4", endId: "p2" }, // inverted
    ];
    expect(computeWeeklySlotHours(slots, scheduleIds)).toBe(0);
  });

  it("skips slots with unknown ids", () => {
    expect(computeWeeklySlotHours([{ startId: "x", endId: "p2" }], scheduleIds)).toBe(0);
  });
});

describe("computeScheduleHours", () => {
  it("multiplies weekly hours by week count", () => {
    const slots = [{ startId: "p1", endId: "p2" }];
    expect(computeScheduleHours(slots, scheduleIds, 18)).toBe(36);
  });

  it("clamps negative week counts to 0", () => {
    const slots = [{ startId: "p1", endId: "p2" }];
    expect(computeScheduleHours(slots, scheduleIds, -1)).toBe(0);
  });
});

describe("resolveIndividualBudget", () => {
  const entry = {
    individualHours: "10",
    individualAdditionalHours: "20",
    distributionEntries: [
      { semesterId: "sem1", academicYearId: "y1", individualHours: "6" },
      { semesterId: "2", academicYearId: "y1", individualHours: "8" },
    ],
  };

  it("prefers the semester-matched distribution entry (by semester id)", () => {
    expect(
      resolveIndividualBudget(entry as any, { semesterId: "sem1", semesterNumber: "1", academicYearId: "y1" })
    ).toBe(6);
  });

  it("matches by semester number when ids differ", () => {
    expect(
      resolveIndividualBudget(entry as any, { semesterId: "semX", semesterNumber: "2", academicYearId: "y1" })
    ).toBe(8);
  });

  it("falls back to additional-individual hours, then individualHours", () => {
    const noDist = { ...entry, distributionEntries: [] };
    expect(
      resolveIndividualBudget(noDist as any, { semesterId: "s", semesterNumber: "1", academicYearId: "y1" })
    ).toBe(20);
    const onlyMain = { ...noDist, individualAdditionalHours: "" };
    expect(
      resolveIndividualBudget(onlyMain as any, { semesterId: "s", semesterNumber: "1", academicYearId: "y1" })
    ).toBe(10);
  });

  it("returns 0 for a null entry", () => {
    expect(resolveIndividualBudget(null, { semesterId: "s", semesterNumber: "1", academicYearId: "y1" })).toBe(0);
  });
});
