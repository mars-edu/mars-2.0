/**
 * KTP (calendar-thematic plan) lookup + detail-popover state for the journal
 * grid. Extracted from JournalTab.vue (Cluster G).
 *
 * Owns its own popover refs — no other part of the grid writes them — so it is
 * fully self-contained. Reactive grid context (current event/journal/rup entry,
 * visible headers, ktp id) is passed in; stores are resolved internally.
 */
import { ref, computed, type Ref } from "vue";
import { storeToRefs } from "pinia";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import { getEventDays, type SemesterInfo } from "@/utils/eventDate";

interface JournalHeader {
  index: number;
  type: string;
  label?: string;
}

export interface UseJournalKtpOptions {
  currentEvent: Ref<any>;
  currentJournal: Ref<any>;
  currentRupEntry: Ref<any>;
  visibleHeaders: Ref<JournalHeader[]>;
  ktpId: Ref<string | undefined>;
}

export function useJournalKtp(opts: UseJournalKtpOptions) {
  const { currentEvent, currentJournal, currentRupEntry, visibleHeaders, ktpId } =
    opts;

  const academicYearSemesterStore = useAcademicYearSemesterStore();
  const { getAcademicYearSemesterById } = storeToRefs(academicYearSemesterStore);
  const ktpStore = useKtpStore();

  const ktpViewPopoverOpened = ref(false);
  const ktpViewPopoverTarget = ref("");
  const selectedKtpDetail = ref<KtpDetail | null>(null);

  const effectiveSemesterIdForKtp = computed(() => {
    const eventSemester = currentEvent.value?.semester;
    if (eventSemester != null && String(eventSemester).length) {
      return String(eventSemester);
    }
    const activeSemester =
      academicYearSemesterStore.getActiveAcademicYearSemester as any;
    return activeSemester?.id ? String(activeSemester.id) : null;
  });

  const effectiveAcademicYearIdForKtp = computed(() => {
    const semesterId = effectiveSemesterIdForKtp.value;
    const semester =
      semesterId && typeof getAcademicYearSemesterById.value === "function"
        ? getAcademicYearSemesterById.value(semesterId)
        : null;
    return (
      semester?.academicYearId || currentRupEntry.value?.academicYearId || null
    );
  });

  /**
   * Get KTP detail for a specific header index.
   * Returns KtpDetail only if it exists and has a non-empty theme.
   * @param headerIndex - The index of the header in visibleHeaders
   * @returns KtpDetail if exists and has theme, null otherwise
   */
  const getKtpForHeader = (headerIndex: number): KtpDetail | null => {
    const rupEntryId = currentJournal.value?.disciplineId;
    if (!rupEntryId) return null;

    const academicYearId = effectiveAcademicYearIdForKtp.value;
    const semesterId = effectiveSemesterIdForKtp.value;
    if (!academicYearId || !semesterId) return null;

    const resolvedKtpId = ktpId.value || null;
    if (!resolvedKtpId) return null;

    // Find dayIndex - position of this date among all date columns
    let dayIndex = 0;
    for (let i = 0; i < visibleHeaders.value.length; i++) {
      const h = visibleHeaders.value[i];
      if (h.index === headerIndex) break;
      if (h.type === "date") dayIndex++;
    }

    const details = ktpStore.getDetailsByKtpId(resolvedKtpId);
    const detail = details[dayIndex];

    // Check that KTP exists AND theme is not empty
    if (!detail || !detail.theme || detail.theme.trim() === "") {
      return null;
    }

    return detail;
  };

  const onPaperclipClick = async (
    header: { type: string; label: string },
    index: number
  ) => {
    if (header.type !== "date") return;

    // Find the date for this header to get KTP details
    const currentEventData = currentEvent.value;
    if (!currentEventData || !currentJournal.value?.disciplineId) return;

    // Get active semester info for fallback date range
    const activeSemester =
      academicYearSemesterStore.getActiveAcademicYearSemester;
    const semesterInfo: SemesterInfo | undefined = activeSemester
      ? {
          startDate: activeSemester.startDate,
          endDate: activeSemester.endDate,
        }
      : undefined;

    const days = getEventDays(currentEventData as any, semesterInfo);

    // Map the column index to actual day index
    // We need to find which day this column represents by looking at the visible headers
    const visibleHeader = visibleHeaders.value[index];
    if (!visibleHeader) return;

    // Find the actual day index by counting date columns up to this point
    let dayIndex = 0;
    for (let i = 0; i < visibleHeaders.value.length; i++) {
      const h = visibleHeaders.value[i];
      if (h.index === visibleHeader.index) break;
      if (h.type === "date") dayIndex++;
    }

    const dayData = days[dayIndex];
    if (!dayData) return;

    // Get KTP details using the ensured event-linked KTP.
    try {
      const resolvedKtpId = ktpId.value || null;
      if (!resolvedKtpId) return;

      const details = ktpStore.getDetailsByKtpId(resolvedKtpId);

      // Select the detail based on day index (0-based)
      const detailForDate = details[dayIndex] || null;

      selectedKtpDetail.value = detailForDate;
      ktpViewPopoverTarget.value = `#paperclip-${index}`;
      ktpViewPopoverOpened.value = true;
    } catch (error) {
      console.error("Error fetching KTP details:", error);
    }
  };

  return {
    ktpViewPopoverOpened,
    ktpViewPopoverTarget,
    selectedKtpDetail,
    effectiveSemesterIdForKtp,
    effectiveAcademicYearIdForKtp,
    getKtpForHeader,
    onPaperclipClick,
  };
}
