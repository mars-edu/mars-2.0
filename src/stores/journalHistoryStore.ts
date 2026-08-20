import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";

type MarkHistoryRecord = {
  _id: string;
  journalId: string;
  studentId: string;
  columnIndex: number;
  rowIndex: number;
  oldValue?: string;
  newValue?: string;
  columnLabel?: string;
  columnDate?: string;
  changedBy: string;
  createdAt: string;
};

export const useJournalHistoryStore = defineStore("journal-history", () => {
  const records = ref<MarkHistoryRecord[]>([]);
  const error = ref<string | null>(null);

  let lastRequestId = 0;

  const loadHistory = async (
    calendarEventId: string,
    options?: { studentId?: string; limit?: number }
  ) => {
    const requestId = (lastRequestId += 1);

    if (!calendarEventId) {
      records.value = [];
      return;
    }

    try {
      error.value = null;

      const journal = await convex.query(api.journals.queries.getByCalendarEvent, {
        calendarEventId,
      });

      if (requestId !== lastRequestId) return;

      if (!journal?._id) {
        records.value = [];
        return;
      }

      const data = options?.studentId
        ? await convex.query(api.marks.queries.getStudentMarkHistory, {
            journalId: journal._id,
            studentId: options.studentId,
          })
        : await convex.query(api.marks.queries.getMarkHistory, {
            journalId: journal._id,
            limit: options?.limit,
          });

      if (requestId !== lastRequestId) return;

      const history = (data as MarkHistoryRecord[]) ?? [];
      records.value = options?.limit ? history.slice(0, options.limit) : history;
    } catch (err) {
      console.error("[journalHistoryStore] Failed to load mark history:", err);
      if (requestId !== lastRequestId) return;

      records.value = [];
      error.value = "Не удалось загрузить историю изменений";
    }
  };

  const getHistoryForStudent = computed(() => {
    return (studentId: string) =>
      records.value.filter((r) => r.studentId === studentId);
  });

  const getHistoryForCell = computed(() => {
    return (studentId: string, columnIndex: number, rowIndex: number) =>
      records.value.filter(
        (r) =>
          r.studentId === studentId &&
          r.columnIndex === columnIndex &&
          r.rowIndex === rowIndex
      );
  });

  const reset = () => {
    records.value = [];
    error.value = null;
    lastRequestId = 0;
  };

  return {
    records,
    error,
    loadHistory,
    getHistoryForStudent,
    getHistoryForCell,
    reset,
  };
});
