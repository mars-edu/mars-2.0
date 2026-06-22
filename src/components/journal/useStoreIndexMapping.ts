/**
 * Maps a canonical column index (position in the generated column template) to
 * the matching column index inside a student's stored marks array. Extracted
 * from JournalTab.vue (Cluster D).
 *
 * This is the structural bridge between the column template (Cluster A) and the
 * marks store: stored marks may be in a different order / sparse, so columns are
 * matched by isoDate / sessionId / label rather than position. Resolved off the
 * first student's marks (all students share the column layout).
 */
import { type Ref } from "vue";
import { useMarksStore } from "@/stores/marksStore";

export interface UseStoreIndexMappingOptions {
  canonicalTemplate: Ref<any[]>;
  getStudentIdByIndex: (index: number) => string | null;
  journalId: Ref<string>;
}

export function useStoreIndexMapping(opts: UseStoreIndexMappingOptions) {
  const { canonicalTemplate, getStudentIdByIndex, journalId } = opts;
  const marksStore = useMarksStore();

  const getStoreIndexForCanonicalIndex = (
    canonicalCol: number
  ): number | null => {
    if (canonicalCol == null || canonicalCol < 0) return null;
    const canonical = canonicalTemplate.value?.[canonicalCol] as any;
    if (!canonical) return null;
    const firstStudentId = getStudentIdByIndex(0);
    if (!firstStudentId || !journalId.value) return null;
    const studentMarks =
      marksStore.getStudentMarks(journalId.value, firstStudentId) || [];
    const findBy = (predicate: (m: any) => boolean) =>
      studentMarks.findIndex(predicate);
    if (canonical.type === "date") {
      const iso = canonical.isoDate;
      if (!iso) return null;
      return findBy((m: any) => m.type === "date" && m.isoDate === iso);
    }
    if (canonical.type === "session") {
      const sessionId = canonical.sessionId;
      if (sessionId) {
        return findBy(
          (m: any) => m.type === "session" && m.sessionId === sessionId
        );
      }
      const label = canonical.label;
      return findBy((m: any) => m.type === "session" && m.label === label);
    }
    // Fallback by type
    return findBy((m: any) => m.type === canonical.type);
  };

  const getStoreIndexForDatePosition = (datePos: number): number | null => {
    const canonical = canonicalTemplate.value as any[] | undefined;
    if (!canonical || datePos < 0) return null;
    let seen = -1;
    for (let ci = 0; ci < canonical.length; ci++) {
      if ((canonical[ci] as any)?.type === "date") {
        seen += 1;
        if (seen === datePos) {
          return getStoreIndexForCanonicalIndex(ci);
        }
      }
    }
    return null;
  };

  return { getStoreIndexForCanonicalIndex, getStoreIndexForDatePosition };
}
