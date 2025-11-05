import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { JournalChangeRecord } from '@/types/journal-history';
import { useUserStore } from './userStore';

export const useJournalHistoryStore = defineStore('journal-history', () => {
  const records = ref<JournalChangeRecord[]>([]);
  const userStore = useUserStore();

  const addRecord = (
    journalId: string,
    studentId: string,
    markIndex: number,
    valueIndex: number,
    oldValue: string | null,
    newValue: string | null,
    columnLabel: string,
    columnDate?: string
  ) => {
    const record: JournalChangeRecord = {
      id: `${Date.now()}-${Math.random()}`,
      journalId,
      studentId,
      markIndex,
      valueIndex,
      oldValue,
      newValue,
      changedBy: userStore.user?.id || 'unknown',
      changedAt: new Date().toISOString(),
      columnLabel,
      columnDate,
    };
    records.value.unshift(record); // Add to beginning
  };

  const getHistoryForJournal = computed(() => {
    return (journalId: string) =>
      records.value.filter(r => r.journalId === journalId);
  });

  const getHistoryForStudent = computed(() => {
    return (journalId: string, studentId: string) =>
      records.value.filter(r => r.journalId === journalId && r.studentId === studentId);
  });

  const getHistoryForCell = computed(() => {
    return (journalId: string, studentId: string, markIndex: number, valueIndex: number) =>
      records.value.filter(r =>
        r.journalId === journalId &&
        r.studentId === studentId &&
        r.markIndex === markIndex &&
        r.valueIndex === valueIndex
      );
  });

  return {
    records,
    addRecord,
    getHistoryForJournal,
    getHistoryForStudent,
    getHistoryForCell,
  };
}, {
  persist: {
    enabled: true,
  }
});
