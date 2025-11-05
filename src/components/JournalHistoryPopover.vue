<template>
  <f7-popover id="journal-history-popover" class="history-popover">
    <div class="bg-card text-card-foreground" style="width: 600px; max-height: 500px;">
      <div class="p-4 border-b border-border">
        <h3 class="text-lg font-semibold">История изменений журнала</h3>
      </div>

      <div class="overflow-y-auto" style="max-height: 400px;">
        <div v-if="filteredRecords.length === 0" class="p-4 text-center text-muted-foreground">
          Нет записей в истории
        </div>

        <div
          v-for="record in filteredRecords"
          :key="record.id"
          class="p-3 border-b border-border hover:bg-muted/30 transition-colors"
        >
          <div class="flex justify-between items-start mb-1">
            <div class="font-medium">{{ getStudentName(record.studentId) }}</div>
            <div class="text-xs text-muted-foreground">
              {{ formatDateTime(record.changedAt) }}
            </div>
          </div>

          <div class="text-sm">
            <span class="text-muted-foreground">{{ record.columnLabel }}</span>:
            <span class="text-red-600 line-through mx-1">{{ record.oldValue || '—' }}</span>
            →
            <span class="text-green-600 mx-1 font-semibold">{{ record.newValue || '—' }}</span>
          </div>

          <div class="text-xs text-muted-foreground mt-1">
            Изменил: {{ getTeacherName(record.changedBy) }}
          </div>
        </div>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { f7Popover } from 'framework7-vue';
import { useJournalHistoryStore } from '@/stores/journalHistoryStore';
import { useStudentStore } from '@/stores/studentStore';
import { useTeacherStore } from '@/stores/teacherStore';
import dayjs from 'dayjs';

interface Props {
  journalId: string;
  studentId?: string; // Optional: filter by student
}

const props = defineProps<Props>();

const historyStore = useJournalHistoryStore();
const studentStore = useStudentStore();
const teacherStore = useTeacherStore();

const filteredRecords = computed(() => {
  if (props.studentId) {
    return historyStore.getHistoryForStudent(props.journalId, props.studentId);
  }
  return historyStore.getHistoryForJournal(props.journalId);
});

const getStudentName = (studentId: string) => {
  return studentStore.getStudentFullName(studentId);
};

const getTeacherName = (teacherId: string) => {
  return teacherStore.getTeacherFullName(teacherId) || 'Неизвестно';
};

const formatDateTime = (isoDate: string) => {
  return dayjs(isoDate).format('DD.MM.YYYY HH:mm');
};
</script>

<style scoped>
.history-popover {
  width: 600px !important;
}
</style>
