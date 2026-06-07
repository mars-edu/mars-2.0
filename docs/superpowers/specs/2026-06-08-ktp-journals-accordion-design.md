# KTP Journals Accordion — Design

**Date:** 2026-06-08
**Scope:** Show which journals use a KTP — the linked group journal plus its individual child journals — in a native `<details>` accordion, on both the KtpPage card and inside KtpDetailView.
**Out of scope:** schema/backend changes, journal-side changes, the existing single-line `getKtpSubtitle` stays only if not replaced (it is replaced — see §3).

## Background

Each KTP is event-specific: `ktp.eventId` back-references the calendar event it was created for (indexed `by_eventId`; `calendarEvents.ktpId` is a convenience forward-ref, unindexed). A group event can have individual child journals — separate calendar events with `sourceGroupEventId === groupEventId` (`journalStore.ts:251`, `:273`).

Existing helpers (reused, no new logic in the store):
- `ktpStore.findKtpById(id)` → `Ktp | undefined`
- `calendarStore.getEventById(id)` → `CalendarEvent | undefined`; `calendarStore.events` reactive array
- `journalStore.getJournalById(eventId)` → `Journal | null`
- `journalStore.getDisciplineTitle(journal)` → string
- `journalStore.getJournalSubtitle(journal)` → e.g. «1 курс // 1ВаВт»

KtpPage's current `getKtpSubtitle(item)` shows only the first matching journal (matched loosely by rupEntry+semester). It is superseded by the accordion.

## 1. Composable `useKtpJournals` (new: `src/composables/useKtpJournals.ts`)

```ts
import { computed, type ComputedRef, type Ref } from "vue";
import { useKtpStore } from "@/stores/ktpStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useJournalStore, type Journal } from "@/stores/journalStore";

/**
 * Journals using a given KTP: the group journal the KTP is linked to
 * (via ktp.eventId, fallback calendarEvents.ktpId), plus its individual
 * child journals (events with sourceGroupEventId === group event id).
 */
export function useKtpJournals(
  ktpId: ComputedRef<string | null> | Ref<string | null>
): ComputedRef<Journal[]> {
  const ktpStore = useKtpStore();
  const calendarStore = useCalendarStore();
  const journalStore = useJournalStore();

  return computed(() => {
    const id = ktpId.value;
    if (!id) return [];

    const ktp = ktpStore.findKtpById(id);
    const groupEvent =
      (ktp?.eventId ? calendarStore.getEventById(ktp.eventId) : undefined) ||
      calendarStore.events.find((e) => e.ktpId === id);
    if (!groupEvent) return [];

    const childEvents = calendarStore.events.filter(
      (e) => e.sourceGroupEventId === groupEvent.id
    );

    return [groupEvent, ...childEvents]
      .map((e) => journalStore.getJournalById(e.id))
      .filter((j): j is Journal => !!j);
  });
}
```

No `any`. `Journal` type imported from journalStore.

## 2. Shared accordion markup (native `<details>`)

Rendered identically in both surfaces (not extracted to a component — small, and the two hosts size it differently). Each host computes its own `journals` list via `useKtpJournals`.

```html
<details v-if="journals.length" class="ktp-journals" @click.stop>
  <summary class="ktp-journals__summary">
    <IconChevronRight class="ktp-journals__chev w-3.5 h-3.5" />
    <IconBookOpen class="w-3.5 h-3.5" />
    Журналы ({{ journals.length }})
  </summary>
  <ul class="mt-1.5 space-y-1">
    <li
      v-for="j in journals"
      :key="j.id"
      class="text-xs text-muted-foreground pl-5"
    >
      {{ journalStore.getDisciplineTitle(j) }} · {{ journalStore.getJournalSubtitle(j) }}
    </li>
  </ul>
</details>
```

- `summary` uses `list-style:none` + `::-webkit-details-marker { display:none }` to drop the native triangle; the chevron rotates 90° when `[open]` via scoped CSS.
- `@click.stop` so toggling the accordion never bubbles to the card's `@click="selectItem"`.
- N=0 → nothing rendered.
- Closed by default.

Scoped CSS (both files):
```css
.ktp-journals__summary {
  @apply flex items-center gap-1.5 text-xs text-muted-foreground/80 cursor-pointer select-none;
  list-style: none;
}
.ktp-journals__summary::-webkit-details-marker { display: none; }
.ktp-journals__chev { transition: transform 0.15s; }
.ktp-journals[open] .ktp-journals__chev { transform: rotate(90deg); }
```

## 3. KtpPage card (`src/pages/KtpPage.vue`)

- Add `import { useJournalStore }` (template needs the getters) — already imported (`getKtpSubtitle` uses it); confirm. Import `useKtpJournals`, `IconChevronRight` (or reuse existing chevron import).
- Replace the `getKtpSubtitle` `<p>` line (the clock-icon single subtitle) with the `<details>` accordion. `journals` per card = `useKtpJournals` won't work per-row in a v-for directly (composable returns one ref). Instead add a helper `journalsForItem(item)` that calls the same resolution inline, OR keep a method `getKtpJournals(ktpId)` in the page returning `Journal[]`.
  - Chosen: a page-level method `getKtpJournals(ktpId: string): Journal[]` (same body as the composable's inner logic, calling the stores directly) — composables returning refs don't fit per-row v-for cleanly. The composable is still used by KtpDetailView (single ktpId).
- Remove the now-unused `getKtpSubtitle` method.

## 4. KtpDetailView (`src/components/KtpDetailView.vue`)

- `import { useKtpJournals }`, `useJournalStore`, `IconChevronRight`, `IconBookOpen`.
- `const journals = useKtpJournals(computed(() => props.ktpId))`.
- Insert the `<details>` block after the metric-cards row, before the action bar.
- Visible in KTP-page detail and (embedded) the journal planning tab.

## 5. Data flow

All reactive: `useKtpJournals` reads `ktpStore.ktps`, `calendarStore.events`, journal computeds — re-evaluates when any change. No store/schema/backend changes.

## 6. Testing

- Manual (Playwright): KtpPage card shows «Журналы (N)», expands to journal rows; toggling does not open the card. KtpDetailView shows the same block; journal planning tab (embedded) shows it too.
- No unit test for `useKtpJournals` (pure getter composition, mirrors untested `useKtpDetail`/`useKtpJournals` siblings). Existing `npm test` suite must stay green.

## Files touched

- Create: `src/composables/useKtpJournals.ts`
- Modify: `src/pages/KtpPage.vue` (accordion + `getKtpJournals` method, drop `getKtpSubtitle`), `src/components/KtpDetailView.vue` (accordion + composable)
