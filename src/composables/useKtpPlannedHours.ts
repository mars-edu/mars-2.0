import { useKtpStore } from "@/stores/ktpStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { parsePlannedHours, semesterIdsMatch } from "@/lib/ktpHelpers";

/**
 * Resolves the planned-hours budget for a KTP from its RUP
 * distributionEntry (matched by academicYearId + semester).
 * Returns null when the budget cannot be resolved — callers treat
 * null as "no budget known" (skip badge / skip hours warning).
 */
export function useKtpPlannedHours() {
  const ktpStore = useKtpStore();
  const rupEntryStore = useRupEntryStore();
  const academicYearSemesterStore = useAcademicYearSemesterStore();

  const resolveSemesterNumber = (id: string): string | null => {
    // Defensive against getter shape (fn vs computed-ref).
    const getter: any = (academicYearSemesterStore as any)
      .getAcademicYearSemesterById;
    const ays =
      typeof getter === "function"
        ? getter(id)
        : typeof getter?.value === "function"
          ? getter.value(id)
          : null;
    return ays ? String(ays.semesterNumber) : null;
  };

  function getPlannedHoursForKtp(ktpId: string): number | null {
    const ktp = ktpStore.findKtpById(ktpId);
    if (!ktp) return null;
    const rupEntry = rupEntryStore.getRupEntryById(ktp.rupEntryId);
    if (!rupEntry) return null;
    const dist = rupEntry.distributionEntries.find(
      (d: { academicYearId: string; semesterId: string }) =>
        d.academicYearId === ktp.academicYearId &&
        semesterIdsMatch(d.semesterId, ktp.semesterId, resolveSemesterNumber)
    );
    return dist ? parsePlannedHours(dist.hours) : null;
  }

  return { getPlannedHoursForKtp };
}
