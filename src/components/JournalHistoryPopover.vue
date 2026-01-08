<template>
  <f7-popover
    id="journal-history-popover"
    class="history-popover"
    @popover:open="refresh"
  >
    <div class="bg-card text-card-foreground" style="width: 600px; max-height: 500px;">
      <div class="p-4 border-b border-border">
        <h3 class="text-lg font-semibold">История изменений журнала</h3>
      </div>

      <div class="overflow-y-auto" style="max-height: 400px;">
        <div v-if="error" class="p-4 text-center text-red-500">
          {{ error }}
        </div>

        <div
          v-else-if="historyRecords.length === 0"
          class="p-4 text-center text-muted-foreground"
        >
          Нет записей в истории
        </div>

        <template v-else>
          <div
            v-for="record in historyRecords"
            :key="record._id"
            class="p-3 border-b border-border hover:bg-muted/30 transition-colors"
          >
            <div class="flex justify-between items-start mb-1">
              <div class="font-medium">{{ getStudentName(record.studentId) }}</div>
              <div class="text-xs text-muted-foreground">
                {{ formatDateTime(record.createdAt) }}
              </div>
            </div>

            <div class="text-sm">
              <span class="text-muted-foreground">{{ record.columnLabel || 'Оценка' }}</span>:
              <span class="text-red-600 line-through mx-1">{{ record.oldValue || '—' }}</span>
              →
              <span class="text-green-600 mx-1 font-semibold">{{ record.newValue || '—' }}</span>
            </div>

            <div class="text-xs text-muted-foreground mt-1">
              Изменил: {{ getTeacherName(record.changedBy) }}
            </div>
          </div>
        </template>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useStudentStore } from '@/stores/studentStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useJournalHistoryStore } from "@/stores/journalHistoryStore";
import { formatDateTime } from '@/utils/dateUtils';

interface Props {
  journalId: string;
  studentId?: string; // Optional: filter by student
}

const props = defineProps<Props>();

const studentStore = useStudentStore();
const teacherStore = useTeacherStore();
const historyStore = useJournalHistoryStore();

const historyRecords = computed(() => historyStore.records);
const error = computed(() => historyStore.error);

const refresh = () => {
  if (!props.journalId) return;
  void historyStore.loadHistory(props.journalId, {
    studentId: props.studentId,
    limit: 100,
  });
};

const getStudentName = (studentId: string) => {
  return studentStore.getStudentFullName(studentId);
};

const getTeacherName = (userId: string) => {
  const name = teacherStore.getTeacherFullNameByUserId(userId);
  return name ? name : 'Неизвестно';
};

watch(
  () => props.journalId,
  () => {
    refresh();
  },
  { immediate: true }
);

watch(() => props.studentId, () => {
  refresh();
});
</script>

<style scoped>
.history-popover {
  width: 600px !important;
}
</style>
