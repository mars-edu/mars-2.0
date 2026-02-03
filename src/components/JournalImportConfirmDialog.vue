<template>
  <f7-popover
    id="journal-import-confirm-popover"
    :arrow="false"
    style="
      width: calc(100vw - 60px) !important;
      max-width: 500px !important;
      height: auto !important;
      max-height: 80dvh !important;
    "
    @popover:closed="$emit('update:opened', false)"
  >
    <div class="journal-import-dialog bg-card text-card-foreground">
      <div class="fixed-header">
        <div class="p-4 border-b border-border">
          <h3 class="text-lg font-semibold text-center">Подтверждение импорта</h3>
        </div>
      </div>

      <div class="scrollable-content p-4 space-y-4">
        <!-- Statistics -->
        <div class="bg-muted/20 rounded-lg p-4 space-y-2">
          <div class="text-sm font-medium">Статистика импорта:</div>
          <div class="grid grid-cols-2 gap-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Всего студентов:</span>
              <span class="font-medium">{{ stats.totalStudents }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Совпадений:</span>
              <span class="font-medium text-green-600">{{ stats.matchedStudents }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Всего дат:</span>
              <span class="font-medium">{{ stats.totalDates }}</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-muted-foreground">Совпадений:</span>
              <span class="font-medium text-green-600">{{ stats.matchedDates }}</span>
            </div>
          </div>
          <div class="pt-2 border-t border-border mt-3">
            <div class="flex items-center justify-between text-sm">
              <span class="text-muted-foreground">Будет обновлено значений:</span>
              <span class="font-bold text-primary">{{ stats.totalUpdates }}</span>
            </div>
          </div>
        </div>

        <!-- Overwrite Mode Toggle -->
        <div class="border border-border rounded-lg p-3">
          <div class="flex items-start gap-3">
            <f7-toggle
              :checked="overwriteMode"
              @toggle:change="$emit('update:overwriteMode', $event)"
            />
            <div class="flex-1">
              <div class="text-sm font-medium">Перезаписать существующие значения</div>
              <div class="text-xs text-muted-foreground mt-1">
                Если выключено, будут обновлены только пустые ячейки
              </div>
            </div>
          </div>
        </div>

        <!-- Warnings -->
        <div v-if="warnings.length > 0" class="space-y-2">
          <div class="text-sm font-medium text-yellow-600">Предупреждения:</div>
          <div
            v-for="(warning, index) in warnings"
            :key="index"
            class="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800"
          >
            {{ warning }}
          </div>
        </div>

        <!-- Unmatched Items Details (Collapsible) -->
        <div v-if="unmatchedStudents.length > 0 || unmatchedDates.length > 0" class="space-y-2">
          <div
            class="text-xs text-muted-foreground cursor-pointer hover:text-foreground"
            @click="showDetails = !showDetails"
          >
            <span v-if="!showDetails">▶ Показать подробности</span>
            <span v-else>▼ Скрыть подробности</span>
          </div>

          <div v-if="showDetails" class="space-y-3 text-xs">
            <div v-if="unmatchedStudents.length > 0">
              <div class="font-medium mb-1">Не найдены студенты:</div>
              <div class="bg-muted/30 rounded p-2 max-h-32 overflow-y-auto">
                <div v-for="(name, idx) in unmatchedStudents" :key="idx" class="py-1">
                  • {{ name }}
                </div>
              </div>
            </div>

            <div v-if="unmatchedDates.length > 0">
              <div class="font-medium mb-1">Не найдены даты:</div>
              <div class="bg-muted/30 rounded p-2 max-h-32 overflow-y-auto">
                <div v-for="(date, idx) in unmatchedDates" :key="idx" class="py-1">
                  • {{ date }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div
          v-if="stats.totalUpdates === 0"
          class="text-center py-6 text-muted-foreground"
        >
          <div class="text-sm">Нет данных для импорта</div>
          <div class="text-xs mt-1">Все студенты или даты не совпадают с журналом</div>
        </div>
      </div>

      <!-- Footer with action buttons -->
      <div class="fixed-footer border-t border-border bg-card p-4">
        <div class="flex gap-3 justify-end">
          <f7-button fill color="gray" @click="handleCancel">
            {{ cancelText }}
          </f7-button>
          <f7-button
            fill
            color="green"
            :disabled="stats.totalUpdates === 0"
            @click="handleConfirm"
          >
            {{ confirmText }}
          </f7-button>
        </div>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { f7Popover, f7Button, f7Toggle } from "framework7-vue";

interface Props {
  stats: {
    totalStudents: number;
    matchedStudents: number;
    totalDates: number;
    matchedDates: number;
    totalUpdates: number;
  };
  warnings: string[];
  unmatchedStudents: string[];
  unmatchedDates: string[];
  overwriteMode: boolean;
  cancelText?: string;
  confirmText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  cancelText: "Отмена",
  confirmText: "Импортировать",
});

const emit = defineEmits<{
  (e: "update:opened", value: boolean): void;
  (e: "update:overwriteMode", value: boolean): void;
  (e: "cancel"): void;
  (e: "confirm"): void;
}>();

const showDetails = ref(false);

function handleCancel() {
  emit("cancel");
  emit("update:opened", false);
}

function handleConfirm() {
  emit("confirm");
}
</script>

<style scoped>
.journal-import-dialog {
  height: 100%;
  display: flex;
  flex-direction: column;
  max-height: 80dvh;
}

.fixed-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
}

.scrollable-content {
  flex: 1;
  overflow-y: auto;
}

.fixed-footer {
  position: sticky;
  bottom: 0;
  z-index: 10;
  background-color: var(--f7-popover-bg-color);
}

#journal-import-confirm-popover {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}
</style>
