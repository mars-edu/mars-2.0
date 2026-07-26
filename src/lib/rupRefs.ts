import * as m from "@/paraglide/messages";

/**
 * Tables the server's `scanRefs` (convex/rupEntries/mutations.ts) reports as
 * references blocking a RUP entry / group delete. This list is the CLIENT-SIDE
 * SSOT for labeling `RUP_ENTRY_HAS_REFERENCES` payloads:
 *
 * - Type-safe: TypeScript enforces every entry has a paraglide label function.
 * - Display order: iteration order = display order (no scattered `sort`).
 * - Locale-aware: labels come from paraglide (ru/kk/en auto-switch by user).
 *
 * ⚠️ Not a compile-time SSOT with the server yet: convex/*.ts and src/*.ts
 * live in separate tsconfigs. Adding a table to `scanRefs` on the server also
 * requires adding a `<key>: m.rup_ref_<key>` line here — flagged by future
 * tests + code review, not by tsc. If cross-project sharing arrives, move
 * this into a shared module and import from both sides.
 */
// Wrap paraglide messages (which return the branded `LocalizedString`) into
// plain `(count) => string` so the SSOT map has a uniform, simple shape.
const RUP_REF_LABELS: Record<string, (n: number) => string> = {
  calendarEvents: (count) => m.rup_ref_calendar_events({ count }),
  ktps: (count) => m.rup_ref_ktps({ count }),
  journals: (count) => m.rup_ref_journals({ count }),
  scheduledIntermediateControls: (count) =>
    m.rup_ref_scheduled_intermediate_controls({ count }),
  scheduledFinalControls: (count) =>
    m.rup_ref_scheduled_final_controls({ count }),
};

const DISPLAY_ORDER = Object.keys(RUP_REF_LABELS);

/**
 * Format a server `RUP_ENTRY_HAS_REFERENCES` payload's `references` map into
 * a human-readable list ("события календаря (3), журнал(ов) (2)") using the
 * user's current locale. Unknown keys and non-positive counts are skipped.
 *
 * Pure + top-level for testability. `refs` is typed as `unknown` because it
 * arrives inside a `ConvexError.data` payload — validated defensively here.
 */
export function formatRupReferences(refs: unknown): string {
  if (!refs || typeof refs !== "object") return "";
  const r = refs as Record<string, unknown>;
  const parts: string[] = [];
  for (const key of DISPLAY_ORDER) {
    const n = r[key];
    if (typeof n === "number" && n > 0) {
      parts.push(RUP_REF_LABELS[key](n));
    }
  }
  return parts.join(", ");
}

/**
 * Build the localized alert message thrown to the caller when the server
 * blocks a RUP delete with `RUP_ENTRY_HAS_REFERENCES`.
 */
export function formatRupDeleteBlockedMessage(
  refs: unknown,
  groupMode: boolean
): string {
  const list = formatRupReferences(refs);
  if (!list) return String(m.rup_delete_blocked_generic());
  return String(
    groupMode
      ? m.rup_delete_blocked_group({ list })
      : m.rup_delete_blocked_entry({ list })
  );
}
