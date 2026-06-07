import { validateReorder } from "../lib";

describe("validateReorder", () => {
  it("accepts an exact permutation", () => {
    expect(validateReorder(["a", "b", "c"], ["c", "a", "b"])).toBeNull();
  });

  it("rejects a list with wrong length", () => {
    expect(validateReorder(["a", "b"], ["a"])).toMatch(/length/i);
  });

  it("rejects unknown ids", () => {
    expect(validateReorder(["a", "b"], ["a", "x"])).toMatch(/unknown/i);
  });

  it("rejects duplicate ids", () => {
    expect(validateReorder(["a", "b"], ["a", "a"])).toMatch(/duplicate/i);
  });

  it("accepts empty lists", () => {
    expect(validateReorder([], [])).toBeNull();
  });
});
