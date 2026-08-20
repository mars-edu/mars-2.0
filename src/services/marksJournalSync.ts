import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import type { Mark, JournalMarks } from "@/types/marks";

export interface SyncContext {
  ensureBackendJournalId: (calendarEventId: string) => Promise<string | null>;
  journalMarksMap: Record<string, JournalMarks>;
  userId?: Id<"users">;
}

/**
 * Sync marks from an individual journal to parent journals (when combined/merged).
 */
export async function syncToParentJournals(
  individualJournalId: string,
  studentId: string,
  markIndex: number,
  valueIndex: number,
  value: string | null,
  mark: Mark,
  ctx: SyncContext
): Promise<void> {
  try {
    const { useCalendarStore } = await import("@/stores/calendarStore");
    const calendarStore = useCalendarStore();

    const individualEvent = calendarStore.getEventById(individualJournalId);
    if (!individualEvent?.isIndividualJournal || !individualEvent.mergedJournalIds) {
      return;
    }

    for (const parentJournalId of individualEvent.mergedJournalIds) {
      const parentEvent = calendarStore.getEventById(parentJournalId);

      if (parentEvent?.participants?.includes(studentId)) {
        const parentJournal = ctx.journalMarksMap[parentJournalId];
        if (!parentJournal) continue;

        const parentStudentMark = parentJournal.studentMarks.find(
          (sm) => sm.studentId === studentId
        );
        if (!parentStudentMark) continue;

        if (
          markIndex >= 0 &&
          markIndex < parentStudentMark.marks.length &&
          valueIndex >= 0 &&
          valueIndex < parentStudentMark.marks[markIndex].values.length
        ) {
          parentStudentMark.marks[markIndex].values[valueIndex] = value;
          parentJournal.lastUpdated = new Date().toISOString();

          try {
            const backendParentJournalId = await ctx.ensureBackendJournalId(parentJournalId);
            if (!backendParentJournalId) continue;

            await convex.mutation(api.marks.mutations.updateMark, {
              journalId: backendParentJournalId as Id<"journals">,
              studentId,
              columnIndex: markIndex,
              rowIndex: valueIndex,
              value: value || undefined,
              columnType: mark.type,
              columnDate: mark.isoDate,
              columnLabel: mark.label,
              controlType: mark.controlType,
              controlId: mark.controlId,
              sessionId: mark.sessionId,
              scheduledControlId: mark.scheduledControlId,
              userId: ctx.userId,
            });
          } catch (syncError) {
            console.error("[marksJournalSync] Error saving synced mark to parent journal:", syncError);
          }
        }
      }
    }
  } catch (err) {
    console.error("[marksJournalSync] Error syncing individual journal marks:", err);
  }
}

/**
 * «Общая» trajectory: sync CONTROL marks from a wizard-child individual
 * journal up to its main group journal.
 */
export async function syncToMainJournal(
  childJournalId: string,
  studentId: string,
  valueIndex: number,
  value: string | null,
  mark: Mark,
  ctx: SyncContext
): Promise<void> {
  try {
    if (mark.controlType !== "intermediate" && mark.controlType !== "final") {
      return;
    }

    const { useCalendarStore } = await import("@/stores/calendarStore");
    const calendarStore = useCalendarStore();

    const childEvent = calendarStore.getEventById(childJournalId);
    if (!childEvent?.isIndividualJournal || !childEvent.sourceGroupEventId) {
      return;
    }

    const mainEvent = calendarStore.getEventById(childEvent.sourceGroupEventId);
    if (!mainEvent || mainEvent.gradingType !== "combined") {
      return;
    }
    if (!mainEvent.participants?.includes(studentId)) {
      return;
    }

    const mainJournal = ctx.journalMarksMap[mainEvent.id];
    if (!mainJournal) return;

    const mainStudentMark = mainJournal.studentMarks.find(
      (sm) => sm.studentId === studentId
    );
    if (!mainStudentMark) return;

    const mainMarkIndex = mainStudentMark.marks.findIndex(
      (m) =>
        m.controlType === mark.controlType &&
        (m.controlId ?? "") === (mark.controlId ?? "") &&
        (m.scheduledControlId ?? "") === (mark.scheduledControlId ?? "")
    );
    if (mainMarkIndex === -1) return;

    const mainMark = mainStudentMark.marks[mainMarkIndex];
    if (valueIndex < 0 || valueIndex >= mainMark.values.length) return;
    mainMark.values[valueIndex] = value;
    mainJournal.lastUpdated = new Date().toISOString();

    const backendMainJournalId = await ctx.ensureBackendJournalId(mainEvent.id);
    if (!backendMainJournalId) return;

    await convex.mutation(api.marks.mutations.updateMark, {
      journalId: backendMainJournalId as Id<"journals">,
      studentId,
      columnIndex: mainMarkIndex,
      rowIndex: valueIndex,
      value: value || undefined,
      columnType: mainMark.type,
      columnDate: mainMark.isoDate,
      columnLabel: mainMark.label,
      controlType: mainMark.controlType,
      controlId: mainMark.controlId,
      sessionId: mainMark.sessionId,
      scheduledControlId: mainMark.scheduledControlId,
      userId: ctx.userId,
    });
  } catch (err) {
    console.error("[marksJournalSync] Error syncing control mark to main journal:", err);
  }
}
