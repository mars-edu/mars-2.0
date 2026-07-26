import {
  isHours,
  fmtHours,
  distributeFmt,
  computeDistributionSummary,
} from "../rupHours";

describe("isHours", () => {
  test("accepts empty string (optional field)", () => {
    expect(isHours("")).toBe(true);
  });
  test("accepts plain integers and decimals", () => {
    expect(isHours("0")).toBe(true);
    expect(isHours("5")).toBe(true);
    expect(isHours("5.5")).toBe(true);
    expect(isHours("100.25")).toBe(true);
  });
  test("rejects Infinity / hex / exponent / whitespace / sign", () => {
    expect(isHours("Infinity")).toBe(false);
    expect(isHours("0x10")).toBe(false);
    expect(isHours("1e10")).toBe(false);
    expect(isHours(" 5 ")).toBe(false);
    expect(isHours("+5")).toBe(false);
    expect(isHours("-5")).toBe(false);
    expect(isHours("abc")).toBe(false);
    expect(isHours("5,5")).toBe(false); // comma locale rejected in the raw form
  });
});

describe("fmtHours", () => {
  test("integer stays as integer", () => {
    expect(fmtHours(0)).toBe("0");
    expect(fmtHours(36)).toBe("36");
  });
  test("decimal rounds to fixed 2 dp", () => {
    expect(fmtHours(2.5)).toBe("2.50");
    expect(fmtHours(1 / 3)).toBe("0.33");
  });
  test("non-finite falls back to '0'", () => {
    expect(fmtHours(NaN)).toBe("0");
    expect(fmtHours(Infinity)).toBe("0");
  });
});

describe("distributeFmt", () => {
  test("count=0 → empty", () => {
    expect(distributeFmt(100, 0)).toEqual([]);
  });
  test("count=1 → single formatted total", () => {
    expect(distributeFmt(48, 1)).toEqual(["48"]);
    expect(distributeFmt(48.5, 1)).toEqual(["48.50"]);
  });
  test("even split — no remainder", () => {
    expect(distributeFmt(90, 3)).toEqual(["30", "30", "30"]);
  });
  test("uneven split — last entry absorbs remainder, sum equals total", () => {
    const vals = distributeFmt(100, 3);
    expect(vals).toEqual(["33.33", "33.33", "33.34"]);
    expect(vals.reduce((s, v) => s + Number(v), 0)).toBe(100);
  });
  test("zero total → all zeros", () => {
    expect(distributeFmt(0, 4)).toEqual(["0", "0", "0", "0"]);
  });
});

describe("computeDistributionSummary", () => {
  test("empty / nullish entry → zeroes", () => {
    const s = computeDistributionSummary(null);
    expect(s).toEqual({
      group: 0, srs: 0, srsp: 0, individual: 0,
      targetGroup: 0, targetSrs: 0, targetSrsp: 0, targetIndividual: 0,
    });
  });
  test("sums per-bucket + computes targetGroup = totalHours − individualAdditional", () => {
    const s = computeDistributionSummary({
      totalHours: "100",
      srsHours: "20",
      srspHours: "10",
      individualAdditionalHours: "40",
      distributionEntries: [
        { hours: "30", srsHours: "10", srspHours: "5", individualHours: "20" },
        { hours: "30", srsHours: "10", srspHours: "5", individualHours: "20" },
      ],
    });
    expect(s.group).toBe(60);
    expect(s.srs).toBe(20);
    expect(s.srsp).toBe(10);
    expect(s.individual).toBe(40);
    expect(s.targetGroup).toBe(60);   // 100 − 40
    expect(s.targetSrs).toBe(20);
    expect(s.targetSrsp).toBe(10);
    expect(s.targetIndividual).toBe(40);
  });
  test("comma-decimal '12,5' is parsed (was NaN with raw Number())", () => {
    const s = computeDistributionSummary({
      totalHours: "12,5",
      distributionEntries: [{ hours: "6,25" }, { hours: "6,25" }],
    });
    expect(s.group).toBe(12.5);
    expect(s.targetGroup).toBe(12.5);
  });
  test("2-dp rounding on aggregation (99.99 doesn't leak)", () => {
    const s = computeDistributionSummary({
      totalHours: "100",
      distributionEntries: [{ hours: "33.33" }, { hours: "33.33" }, { hours: "33.34" }],
    });
    expect(s.group).toBe(100);
  });
});
