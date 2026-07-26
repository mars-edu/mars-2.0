import { ref, computed, type Ref } from "vue";
import { parseNumber } from "@/utils/parseNumber";
import {
  computeDistributionSummary,
  distributeFmt,
  type DistributionSummary,
  type RupEntryHoursInput,
} from "@/lib/rupHours";

/**
 * Owns the RUP distribution rows + optional-columns visibility + summary
 * (extracted from RupEntryPopup, spec P3 composables). Also encapsulates the
 * "distribute this top-level bucket across semesters" auto-fill triggered
 * from RupHourFields' down-arrow buttons.
 *
 * `step` is passed in as a Ref (the popup's edited entry) so the composable
 * can mutate `editedEntry.value.distributionEntries` in place — matching the
 * template's v-model expectations inside RupDistributionTable.
 */
export type DistributeField =
  | "srspHours"
  | "srsHours"
  | "individualAdditionalHours";

export interface DistributionEntryLike {
  id: string;
  academicYearId: string;
  semesterId: string;
  hours: string;
  srsHours?: string;
  srspHours?: string;
  individualHours?: string;
  finalControlId?: string | null;
  examEnabled?: boolean;
  creditEnabled?: boolean;
  controlLessonEnabled?: boolean;
}

interface RupFormEntry extends RupEntryHoursInput {
  distributionEntries: DistributionEntryLike[];
}

export interface UseRupHourDistributionOptions {
  /** Default academicYearId for newly-added rows. */
  academicYearIdFor: () => string;
  /** Show an "add a row first" alert when distribute is clicked on an empty table. */
  onEmptyDistributeAttempt?: () => void;
}

export function useRupHourDistribution(
  editedEntry: Ref<RupFormEntry | null | undefined>,
  opts: UseRupHourDistributionOptions
) {
  const visibleColumns = ref({
    srs: false,
    srsp: false,
    individual: false,
  });

  const summary = computed<DistributionSummary>(() =>
    computeDistributionSummary(editedEntry.value)
  );

  function addDistributionEntry() {
    const s = editedEntry.value;
    if (!s) return;
    s.distributionEntries.push({
      id: crypto.randomUUID(),
      academicYearId: opts.academicYearIdFor(),
      semesterId: "",
      hours: "",
      srsHours: "",
      srspHours: "",
      individualHours: "",
      finalControlId: null,
      examEnabled: false,
      creditEnabled: false,
      controlLessonEnabled: false,
    });
  }

  function removeDistributionEntry(entryId: string) {
    const s = editedEntry.value;
    if (!s) return;
    const idx = s.distributionEntries.findIndex((e) => e.id === entryId);
    if (idx !== -1) s.distributionEntries.splice(idx, 1);
  }

  /**
   * Auto-distribute a top-level hour bucket across the current rows.
   * Reveals the corresponding optional column and writes rounded shares whose
   * sum equals the total (distributeFmt puts the remainder on the last row).
   * For individualAdditionalHours also fills each row's group `hours` with
   * `(totalHours − individualAdditional) / count`, but only when totalHours
   * is set (otherwise leave user-entered group hours alone).
   */
  function distributeHoursFromField(field: DistributeField) {
    const s = editedEntry.value;
    if (!s || !s.distributionEntries.length) {
      opts.onEmptyDistributeAttempt?.();
      return;
    }
    const count = s.distributionEntries.length;

    if (field === "srspHours") {
      visibleColumns.value.srsp = true;
      const values = distributeFmt(parseNumber(s.srspHours), count);
      s.distributionEntries.forEach((e, i) => {
        e.srspHours = values[i];
      });
      return;
    }

    if (field === "srsHours") {
      visibleColumns.value.srs = true;
      const values = distributeFmt(parseNumber(s.srsHours), count);
      s.distributionEntries.forEach((e, i) => {
        e.srsHours = values[i];
      });
      return;
    }

    // individualAdditionalHours
    visibleColumns.value.individual = true;
    const totalIndividual = parseNumber(s.individualAdditionalHours);
    const totalAll = parseNumber(s.totalHours);
    const individualValues = distributeFmt(totalIndividual, count);
    const groupTotal = Math.max(0, totalAll - totalIndividual);
    const groupValues = distributeFmt(groupTotal, count);
    s.distributionEntries.forEach((e, i) => {
      e.individualHours = individualValues[i];
      if (totalAll > 0) e.hours = groupValues[i];
    });
  }

  /** Reset the optional-column reveal flags (called from popup's resetLocalState). */
  function reset() {
    visibleColumns.value = { srs: false, srsp: false, individual: false };
  }

  return {
    visibleColumns,
    summary,
    addDistributionEntry,
    removeDistributionEntry,
    distributeHoursFromField,
    reset,
  };
}
