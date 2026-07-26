import {
  formatRupReferences,
  formatRupDeleteBlockedMessage,
} from "../rupRefs";

/**
 * Tests run against `src/test/paraglideMessagesStub.ts` (jest.config) — every
 * paraglide message returns its own KEY as a string, so assertions here check
 * structure (which keys, in what order, joined how) rather than localized copy.
 */

describe("formatRupReferences", () => {
  test("null / non-object → empty", () => {
    expect(formatRupReferences(null)).toBe("");
    expect(formatRupReferences(undefined)).toBe("");
    expect(formatRupReferences("garbage")).toBe("");
    expect(formatRupReferences(42)).toBe("");
  });
  test("empty object → empty", () => {
    expect(formatRupReferences({})).toBe("");
  });
  test("known keys emit label functions in display order", () => {
    const out = formatRupReferences({
      journals: 3,
      ktps: 1,
      calendarEvents: 2,
    });
    // Display order: calendarEvents, ktps, journals, scheduledIntermediate…, scheduledFinal…
    expect(out).toBe(
      "rup_ref_calendar_events, rup_ref_ktps, rup_ref_journals"
    );
  });
  test("unknown keys silently dropped (no leak of raw table names)", () => {
    const out = formatRupReferences({ journals: 2, mysteryTable: 5 });
    expect(out).toBe("rup_ref_journals");
    expect(out).not.toContain("mysteryTable");
  });
  test("zero / negative counts skipped", () => {
    expect(formatRupReferences({ journals: 0, ktps: -1 })).toBe("");
  });
  test("non-number values skipped", () => {
    expect(formatRupReferences({ journals: "3", ktps: null })).toBe("");
  });
});

describe("formatRupDeleteBlockedMessage", () => {
  test("empty refs → generic key (no per-table list)", () => {
    expect(formatRupDeleteBlockedMessage({}, false)).toBe(
      "rup_delete_blocked_generic"
    );
    expect(formatRupDeleteBlockedMessage(null, true)).toBe(
      "rup_delete_blocked_generic"
    );
  });
  test("entry mode uses entry key", () => {
    expect(formatRupDeleteBlockedMessage({ journals: 2 }, false)).toBe(
      "rup_delete_blocked_entry"
    );
  });
  test("group mode uses group key", () => {
    expect(formatRupDeleteBlockedMessage({ journals: 1 }, true)).toBe(
      "rup_delete_blocked_group"
    );
  });
});
