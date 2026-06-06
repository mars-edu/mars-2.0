<template>
  <f7-popup
    id="journal-history-dialog"
    class="journal-history-dialog"
    :opened="isOpened"
    @popup:closed="onPopupClosed"
    @popup:open="onPopupOpen"
  >
    <f7-page>
      <div class="bg-card text-card-foreground h-full flex flex-col">
        <div class="px-8 pt-8 pb-4 relative z-10 flex justify-between items-center border-b border-border">
          <div>
            <h2 class="text-2xl font-bold tracking-tight">История изменений</h2>
            <p v-if="computedSubtitle" class="text-[15px] font-medium text-muted-foreground mt-0.5">{{ computedSubtitle }}</p>
          </div>
          <button @click="handleClose" class="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-muted/80 transition-colors">
            <IconX class="w-5 h-5" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto px-8 py-6 space-y-4 no-scrollbar">
          <div v-if="error" class="text-center py-12">
            <IconAlertCircle class="w-12 h-12 text-destructive mx-auto mb-4 opacity-20" />
            <p class="text-destructive font-medium">{{ error }}</p>
          </div>

          <div v-else-if="records.length === 0" class="text-center py-12">
            <IconClock class="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p class="text-muted-foreground font-medium">История изменений пуста</p>
          </div>

          <template v-else>
            <div 
              v-for="record in records" 
              :key="record._id" 
              class="flex items-start gap-4 p-4 bg-muted/30 rounded-2xl border border-border transition-all hover:bg-muted/50"
            >
              <div class="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <IconClock class="w-5 h-5" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start gap-2">
                  <div class="text-[15px] font-semibold truncate">{{ getStudentName(record.studentId) }}</div>
                  <div class="text-[12px] text-muted-foreground whitespace-nowrap font-medium">
                    {{ formatDateTime(record.createdAt) }}
                  </div>
                </div>
                
                <div class="text-[13px] mt-1">
                  <span class="text-muted-foreground">{{ record.columnLabel || 'Оценка' }}</span>:
                  <span v-if="record.oldValue" class="text-destructive line-through mx-1">{{ record.oldValue }}</span>
                  <span v-else class="text-muted-foreground mx-1">пусто</span>
                  <span class="text-muted-foreground">→</span>
                  <span v-if="record.newValue" class="text-green-600 mx-1 font-semibold">{{ record.newValue }}</span>
                  <span v-else class="text-muted-foreground mx-1 font-semibold">пусто</span>
                </div>

                <div class="text-[12px] text-muted-foreground mt-2 font-medium flex items-center gap-1.5">
                  <IconUser class="w-3.5 h-3.5 opacity-50" />
                  <span>Изменил: {{ getTeacherName(record.changedBy) }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </f7-page>
  </f7-popup>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7Popup, f7Page } from "framework7-vue";
import IconX from "~icons/lucide/x";
import IconClock from "~icons/lucide/clock";
import IconAlertCircle from "~icons/lucide/alert-circle";
import IconUser from "~icons/lucide/user";
import { useStudentStore } from '@/stores/studentStore';
import { useTeacherStore } from '@/stores/teacherStore';
import { useJournalHistoryStore } from "@/stores/journalHistoryStore";
import { useJournalStore } from "@/stores/journalStore";
import { formatDateTime } from '@/utils/dateUtils';

interface Props {
  opened: boolean;
  journalId: string;
  studentId?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
  (e: "close"): void;
}>();

const studentStore = useStudentStore();
const teacherStore = useTeacherStore();
const historyStore = useJournalHistoryStore();
const journalStore = useJournalStore();

const isOpened = computed(() => props.opened);
const records = computed(() => historyStore.records);
const error = computed(() => historyStore.error);

const currentJournal = computed(() => journalStore.getJournalById(props.journalId));
const computedSubtitle = computed(() => {
  if (!currentJournal.value) return "";
  const discipline = journalStore.getDisciplineTitle(currentJournal.value);
  const groups = journalStore.getJournalSubtitle(currentJournal.value);
  return `${discipline} • ${groups}`;
});

const refresh = () => {
  if (!props.journalId || !isOpened.value) return;
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

const handleClose = () => {
  emit("update:opened", false);
  emit("close");
};

const onPopupClosed = () => {
  handleClose();
};

const onPopupOpen = () => {
  refresh();
};

watch(
  () => props.journalId,
  () => {
    if (isOpened.value) refresh();
  }
);

watch(
  () => isOpened.value,
  (val) => {
    if (val) refresh();
  }
);
</script>

<style>
.journal-history-dialog {
  width: 768px;
  max-width: 90vw;
  height: auto;
  max-height: 90vh;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.journal-history-dialog .page-content {
  padding: 0;
}

.journal-history-dialog .no-scrollbar::-webkit-scrollbar {
  display: none;
}

.journal-history-dialog .no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
