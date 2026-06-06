import { validateIndividualJournals } from "../lib";

const slot = (startId = "s1", endId = "s2") => ({ weekId: 1, startId, endId });
const journal = (over: Partial<{ studentIds: string[]; weeklySchedules: any[] }> = {}) => ({
  studentIds: ["st1"],
  weeklySchedules: [slot()],
  ...over,
});

describe("validateIndividualJournals", () => {
  it("accepts a valid payload", () => {
    expect(validateIndividualJournals([journal()], "combined")).toBeNull();
  });

  it("rejects empty journal list", () => {
    expect(validateIndividualJournals([], "combined")).toMatch(/журнал/i);
  });

  it("rejects missing gradingType", () => {
    expect(validateIndividualJournals([journal()], undefined)).toMatch(/оцен/i);
  });

  it("rejects a journal without students", () => {
    expect(validateIndividualJournals([journal({ studentIds: [] })], "separate")).toMatch(/студент/i);
  });

  it("rejects a journal without schedules", () => {
    expect(validateIndividualJournals([journal({ weeklySchedules: [] })], "separate")).toMatch(/расписан/i);
  });

  it("rejects an incomplete time slot", () => {
    expect(
      validateIndividualJournals([journal({ weeklySchedules: [slot("s1", "")] })], "separate")
    ).toMatch(/время/i);
  });
});
