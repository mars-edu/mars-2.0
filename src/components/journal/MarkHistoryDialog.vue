<template>
  <div
    v-if="isOpen"
    class="fixed inset-0 z-[21000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
    @click.self="$emit('close')"
  >
    <div
      class="bg-card text-card-foreground border border-border rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-scale-in"
    >
      <!-- Header -->
      <div class="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <IconHistory class="w-5 h-5" />
          </div>
          <div>
            <h3 class="font-bold text-base text-foreground leading-tight">История оценки</h3>
            <p class="text-xs text-muted-foreground mt-0.5">{{ columnLabel }} • {{ studentName }}</p>
          </div>
        </div>
        <button
          type="button"
          @click="$emit('close')"
          class="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <IconX class="w-4 h-4" />
        </button>
      </div>

      <!-- Content -->
      <div class="p-6 overflow-y-auto flex-1 space-y-4">
        <div v-if="loading" class="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
          <div class="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          <span class="text-xs">Загрузка истории...</span>
        </div>

        <div v-else-if="history.length === 0" class="text-center py-8 text-muted-foreground">
          <div class="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3 text-muted-foreground/40">
            <IconFileText class="w-6 h-6" />
          </div>
          <p class="text-sm font-semibold">История изменений отсутствует</p>
          <p class="text-xs mt-1 text-muted-foreground/80">Оценка еще не редактировалась после создания</p>
        </div>

        <!-- Timeline of changes -->
        <div v-else class="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
          <div
            v-for="(item, idx) in history"
            :key="item._id"
            class="relative flex flex-col gap-1"
          >
            <!-- Timeline dot -->
            <div
              class="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 border-background"
              :class="idx === 0 ? 'bg-primary ring-4 ring-primary/20' : 'bg-muted-foreground/40'"
            ></div>

            <div class="flex items-center justify-between text-xs text-muted-foreground">
              <span class="font-bold text-foreground">{{ item.changedByName || 'Преподаватель' }}</span>
              <span>{{ formatDate(item.createdAt || item._creationTime) }}</span>
            </div>

            <!-- Value transition badge -->
            <div class="flex items-center gap-2 mt-1">
              <div class="flex items-center gap-1.5 px-3 py-1 bg-muted rounded-xl text-sm font-bold border border-border">
                <span :class="item.oldValue ? 'text-muted-foreground line-through' : 'text-muted-foreground/50'">
                  {{ item.oldValue || '—' }}
                </span>
                <span class="text-muted-foreground text-xs">→</span>
                <span class="text-primary">
                  {{ item.newValue || '—' }}
                </span>
              </div>
              <span v-if="idx === 0" class="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                Текущая
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="px-6 py-3 border-t border-border bg-muted/20 flex justify-end shrink-0">
        <button
          type="button"
          @click="$emit('close')"
          class="px-5 py-2 text-sm font-bold bg-muted hover:bg-muted/80 text-foreground rounded-xl transition-colors"
        >
          Закрыть
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { convex } from "@/lib/convexClient";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import dayjs from "dayjs";
import IconHistory from "~icons/lucide/history";
import IconX from "~icons/lucide/x";
import IconFileText from "~icons/lucide/file-text";

const props = defineProps<{
  isOpen: boolean;
  journalId: string;
  studentId: string;
  studentName: string;
  columnLabel: string;
  columnIndex: number;
  rowIndex: number;
}>();

defineEmits<{
  (e: "close"): void;
}>();

const loading = ref(false);
const history = ref<any[]>([]);

async function loadHistory() {
  if (!props.isOpen || !props.journalId || !props.studentId) return;
  loading.value = true;
  try {
    const res = await convex.query(api.marks.queries.getCellMarkHistory, {
      journalId: props.journalId as Id<"journals">,
      studentId: props.studentId,
      columnIndex: props.columnIndex,
      rowIndex: props.rowIndex,
    });
    history.value = res || [];
  } catch (err) {
    console.error("[MarkHistoryDialog] Failed to load cell mark history:", err);
    history.value = [];
  } finally {
    loading.value = false;
  }
}

watch(
  () => [props.isOpen, props.journalId, props.studentId, props.columnIndex, props.rowIndex],
  ([open]) => {
    if (open) {
      loadHistory();
    }
  },
  { immediate: true }
);

function formatDate(val: any): string {
  if (!val) return "";
  const d = typeof val === "number" ? new Date(val) : new Date(val);
  return dayjs(d).format("DD.MM.YYYY HH:mm");
}
</script>

<style scoped>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes scaleIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
.animate-scale-in {
  animation: scaleIn 0.15s ease-out;
}
</style>
