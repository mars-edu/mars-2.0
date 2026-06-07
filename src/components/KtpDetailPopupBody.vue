<template>
  <div class="ktp-detail-body">
    <div v-if="ktpStore.error" class="px-4 pb-2 text-destructive text-sm">
      {{ ktpStore.error }}
    </div>

    <div class="ktp-content">
      <div class="p-4 space-y-3 pb-8">
        <!-- Hour Counter -->
        <div class="bg-secondary p-4 border border-border rounded-lg">
          <div class="flex justify-between mb-2">
            <span class="text-foreground">Запланировано из КТП:</span>
            <span class="text-foreground font-medium"
              >{{ plannedHoursFromKtp }} часов</span
            >
          </div>
          <div class="flex justify-between mb-2">
            <span class="text-foreground">Запланировано на семестр:</span>
            <span class="text-foreground font-medium"
              >{{ semesterPlannedHours ?? "—" }} часов</span
            >
          </div>
        </div>

        <div
          class="bg-primary text-primary-foreground rounded-lg p-3 flex items-center justify-between"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <f7-button
              id="download-template-button"
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="downloadTemplate"
            >
              <IconFileDown class="w-4 h-4 mr-1" />
              Скачать шаблон
            </f7-button>

            <f7-button
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="uploadDocument"
            >
              <IconFileUp class="w-4 h-4 mr-1" />
              Загрузить план
            </f7-button>

            <f7-button
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="importData"
            >
              <IconSquareArrowDown class="w-4 h-4 mr-1" />
              Импорт
            </f7-button>

            <f7-button
              id="add-ktp-detail-button"
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="addManually"
            >
              <IconPlus class="w-4 h-4 mr-1" />
              Добавить
            </f7-button>

            <!-- NOTE: bulk-delete disabled by request; delete is done per-theme via edit popover. -->

            <div class="separator-vertical"></div>

            <f7-button
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="downloadRup"
            >
              <IconFileDown class="w-4 h-4 mr-1" />
              Скачать РУП
            </f7-button>
          </div>
        </div>

        <div class="border border-border rounded-lg overflow-hidden overflow-x-auto">
          <div
            class="grid grid-cols-[40px_minmax(0,_1fr)_100px_80px_70px_70px_70px_70px_70px_120px_140px] gap-3 px-4 py-2 bg-muted/50 text-sm text-muted-foreground min-w-[1100px]"
          >
            <div class="font-medium text-center">№</div>
            <div class="font-medium">Темы занятий</div>
            <div class="font-medium text-center">Дата</div>
            <div class="font-medium text-center">Часы</div>
            <div class="font-medium text-center">СРСП</div>
            <div class="font-medium text-center">СРС</div>
            <div class="font-medium text-center">Теория</div>
            <div class="font-medium text-center">Практ.</div>
            <div class="font-medium text-center">Индив.</div>
            <div class="font-medium text-center">Что задано?</div>
            <div class="font-medium text-center">Примечание</div>
          </div>

          <div
            v-if="loading && !isImporting"
            class="p-4 text-center text-muted-foreground"
          >
            Загрузка деталей...
          </div>
          <div v-else class="divide-y divide-border">
            <template v-for="(item, idx) in ktpDetails" :key="item.id">
              <div
                v-if="dragSourceId && dropIndex === idx"
                class="drop-indicator"
              ></div>
              <div
                :id="`ktp-detail-item-${item.id}`"
                class="grid grid-cols-[40px_minmax(0,_1fr)_100px_80px_70px_70px_70px_70px_70px_120px_140px] gap-3 px-4 py-3 items-start transition-colors min-w-[1100px]"
                :class="{
                  'is-dragging': dragSourceId === item.id,
                  'is-drag-over':
                    dragOverId === item.id && dragSourceId !== item.id,
                  'cursor-pointer hover:bg-muted/50': !isRowLocked(idx),
                  'opacity-60 cursor-default bg-muted/20': isRowLocked(idx),
                }"
                :draggable="!isRowLocked(idx)"
                @dragstart="!isRowLocked(idx) && onDragStart(item)"
                @dragover.prevent="onDragOver(item, idx, $event)"
                @dragenter.prevent="onDragEnter(item, idx, $event)"
                @drop.prevent="onDrop()"
                @dragend="onDragEnd"
                @click="handleRowClick(item, idx)"
              >
                <div
                  class="flex items-center justify-center gap-2 select-none"
                >
                  <span
                    v-if="isRowLocked(idx)"
                    class="inline-flex items-center justify-center p-1 rounded text-muted-foreground/50"
                    title="Дата прошла — редактирование заблокировано"
                  >
                    <IconLock class="w-4 h-4" />
                  </span>
                  <span
                    v-else
                    class="drag-handle inline-flex items-center justify-center p-1 rounded cursor-move text-muted-foreground/80 hover:text-foreground hover:bg-muted"
                  >
                    <IconMenu class="w-4 h-4" />
                  </span>
                  <span class="text-sm font-medium">{{
                    item.position
                  }}</span>
                </div>
                <div class="text-sm">{{ item.theme }}</div>
                <div class="text-center text-sm">
                  {{ getLessonDateByIndex(idx) }}
                </div>
                <div class="text-center text-sm">
                  {{ item.totalHours ?? "—" }}
                </div>
                <div class="text-center text-sm">
                  {{ item.srsp ?? "—" }}
                </div>
                <div class="text-center text-sm">{{ item.srs ?? "—" }}</div>
                <div class="text-center text-sm">{{ item.theoretical ?? "—" }}</div>
                <div class="text-center text-sm">{{ item.practical ?? "—" }}</div>
                <div class="text-center text-sm">{{ item.individual ?? "—" }}</div>
                <div class="text-center text-sm">
                  {{ item.homework || "—" }}
                </div>
                <div class="text-center text-sm">
                  {{ item.notes || "—" }}
                </div>
              </div>
            </template>
            <div
              v-if="dragSourceId && dropIndex === ktpDetails.length"
              class="drop-indicator"
            ></div>
          </div>
        </div>
      </div>
    </div>

    <KtpDetailFormPopover
      v-if="ktpId"
      v-model:opened="isFormPopoverOpen"
      :ktp-id="ktpId"
      :detail-to-edit="editingDetail"
      :locked="isEditingLocked"
      :remaining-hours="remainingHoursForForm"
    />

    <DownloadTemplateDialog />

    <RupImportDialog
      v-model:opened="isRupImportDialogOpen"
      :currentKtpId="ktpId"
      @imported="onThemesImported"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { f7Button } from "framework7-vue";
import IconFileDown from "~icons/lucide/file-down";
import IconFileUp from "~icons/lucide/file-up";
import IconSquareArrowDown from "~icons/lucide/square-arrow-down";
import IconPlus from "~icons/lucide/plus";
import IconMenu from "~icons/lucide/menu";
import IconLock from "~icons/lucide/lock";
import { useKtpStore } from "@/stores/ktpStore";
import KtpDetailFormPopover from "@/components/KtpDetailFormPopover.vue";
import DownloadTemplateDialog from "@/components/DownloadTemplateDialog.vue";
import RupImportDialog from "@/components/RupImportDialog.vue";
import { storeToRefs } from "pinia";
import { useKtpDetail } from "@/composables/useKtpDetail";

const props = defineProps<{
  ktpId: string | null;
}>();

const ktpStore = useKtpStore();
const { loading } = storeToRefs(ktpStore);

const {
  ktpDetails,
  getLessonDateByIndex,
  plannedHoursFromKtp,
  semesterPlannedHours,
  remainingHoursForForm,
  isRowLocked,
  isFormPopoverOpen,
  editingDetail,
  isEditingLocked,
  handleRowClick,
  addManually,
  dragSourceId,
  dragOverId,
  dropIndex,
  onDragStart,
  onDragEnter,
  onDragOver,
  onDrop,
  onDragEnd,
  isImporting,
  isRupImportDialogOpen,
  uploadDocument,
  importData,
  onThemesImported,
  downloadRup,
  downloadTemplate,
} = useKtpDetail(computed(() => props.ktpId));
</script>

<style scoped>
.ktp-detail-body {
}

.ktp-content {
}

.is-dragging {
  opacity: 0.6;
  transform: scale(0.98) rotate(2deg);
  z-index: 1000;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 2px solid var(--f7-theme-color);
  border-radius: 8px;
  transition: none;
}

.is-drag-over {
  background-color: rgba(var(--f7-theme-color-rgb), 0.08);
  border-radius: 8px;
  transition: background-color 0.2s ease;
}

.drag-handle {
  touch-action: none;
}

.drop-indicator {
  height: 4px;
  background: linear-gradient(
    90deg,
    var(--f7-theme-color) 0%,
    var(--f7-theme-color-tint) 100%
  );
  border-radius: 2px;
  margin: 2px 16px;
  position: relative;
  animation: pulse-indicator 1s ease-in-out infinite alternate;
  box-shadow: 0 0 8px rgba(var(--f7-theme-color-rgb), 0.4);
}

.drop-indicator::before {
  content: "";
  position: absolute;
  left: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--f7-theme-color);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(var(--f7-theme-color-rgb), 0.6);
}

.drop-indicator::after {
  content: "";
  position: absolute;
  right: -6px;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  background: var(--f7-theme-color);
  border-radius: 50%;
  box-shadow: 0 0 4px rgba(var(--f7-theme-color-rgb), 0.6);
}

@keyframes pulse-indicator {
  0% {
    opacity: 0.7;
    transform: scaleY(1);
  }
  100% {
    opacity: 1;
    transform: scaleY(1.2);
  }
}

.separator-vertical {
  width: 1px;
  height: 24px;
  background-color: hsl(var(--border));
  margin: 0 8px;
  flex-shrink: 0;
}
</style>
