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

  return computed(() => collectKtpJournals(ktpId.value, ktpStore, calendarStore, journalStore));
}

/**
 * Resolve the journals for a single ktpId. Extracted so callers that
 * need a per-row helper (e.g. a v-for over many KTPs) can call it
 * directly instead of instantiating a composable per row.
 */
export function collectKtpJournals(
  id: string | null,
  ktpStore: ReturnType<typeof useKtpStore>,
  calendarStore: ReturnType<typeof useCalendarStore>,
  journalStore: ReturnType<typeof useJournalStore>
): Journal[] {
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
}
