<template>
  <div>
    <!-- Back -->
    <button
      v-if="!embedded"
      class="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
      data-testid="ktp-detail-back"
      @click="emit('back')"
    >
      <IconChevronLeft class="w-5 h-5" />
      Назад к списку
    </button>

    <div
      :class="embedded
        ? 'p-4'
        : 'bg-card text-card-foreground p-6 md:p-8 rounded-3xl shadow-sm border border-border'"
    >
      <div v-if="ktpStore.error" class="mb-4 text-destructive text-sm">
        {{ ktpStore.error }}
      </div>

      <!-- Metric cards -->
      <div class="flex gap-12 mb-6">
        <div class="flex flex-col">
          <span class="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Запланировано</span>
          <span class="text-2xl font-bold">{{ semesterPlannedHours ?? "—" }} ч.</span>
        </div>
        <div class="flex flex-col">
          <span class="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Добавлено</span>
          <span class="text-2xl font-bold">{{ plannedHoursFromKtp }} ч.</span>
        </div>
      </div>

      <!-- Title -->
      <h2 class="text-3xl font-bold mb-8">{{ moduleTitle }}</h2>

      <!-- Action bar: single row (scrolls horizontally on narrow screens) -->
      <div class="w-fit flex flex-nowrap gap-3 mb-8 overflow-x-auto max-w-full">
        <!-- concept-v2 pattern: «Скачать шаблон» opens a dropdown (Word/Excel).
             DropdownMenu teleports the panel to body, so overflow-x-auto
             cannot clip it. -->
        <DropdownMenu class="flex-shrink-0" align="left" width="12rem">
          <template #trigger="{ toggle }">
            <button
              id="download-template-button"
              class="w-fit flex items-center gap-2 whitespace-nowrap bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
              @click="toggle"
            >
              <IconFileDown class="w-4 h-4" /> Скачать шаблон
            </button>
          </template>
          <template #default="{ close }">
            <button
              class="block w-full text-left px-5 py-3 hover:bg-muted text-sm transition-colors"
              @click="close(); downloadWordTemplate()"
            >
              Word (.docx)
            </button>
            <button
              class="block w-full text-left px-5 py-3 hover:bg-muted text-sm transition-colors"
              @click="close(); downloadExcelTemplate()"
            >
              Excel (.xlsx)
            </button>
          </template>
        </DropdownMenu>
        <button
          class="w-fit flex items-center gap-2 whitespace-nowrap flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          @click="downloadRup"
        >
          <IconFileDown class="w-4 h-4" /> Скачать план
        </button>
        <button
          class="w-fit flex items-center gap-2 whitespace-nowrap flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          @click="uploadDocument"
        >
          <IconFileUp class="w-4 h-4" /> Загрузить план
        </button>
        <button
          class="w-fit flex items-center gap-2 whitespace-nowrap flex-shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          @click="importData"
        >
          <IconSquareArrowDown class="w-4 h-4" /> Импорт
        </button>
        <button
          class="w-fit flex items-center gap-2 whitespace-nowrap flex-shrink-0 bg-emerald-500 text-white hover:bg-emerald-600 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          data-testid="ktp-detail-add"
          @click="addManually"
        >
          <IconPlus class="w-4 h-4" /> Добавить
        </button>
      </div>

      <!-- Topic table -->
      <div class="overflow-x-auto">
        <div class="min-w-[760px]">
          <!-- Header -->
          <div
            class="grid grid-cols-[40px_minmax(0,1fr)_110px_80px_minmax(0,0.6fr)_minmax(0,0.6fr)_40px] gap-2 py-3 px-2 text-sm text-muted-foreground border-b border-border"
          >
            <div>№</div>
            <div>Тема занятия</div>
            <div>Дата</div>
            <div>Часы</div>
            <div>Что задано?</div>
            <div>Примечание</div>
            <div></div>
          </div>

          <div v-if="ktpStore.loading && !isImporting" class="py-8 text-center text-muted-foreground text-sm">
            Загрузка деталей...
          </div>

          <template v-else>
            <template v-for="(item, idx) in ktpDetails" :key="item.id">
              <!-- Drop indicator before row -->
              <div
                v-if="dragSourceId && dropIndex === idx"
                class="h-0.5 bg-primary rounded"
              />
              <div
                :id="`ktp-detail-row-${item.id}`"
                class="grid grid-cols-[40px_minmax(0,1fr)_110px_80px_minmax(0,0.6fr)_minmax(0,0.6fr)_40px] gap-2 py-4 px-2 border-b border-border transition-colors"
                :class="[
                  dragSourceId === item.id ? 'opacity-50' : '',
                  dragOverId === item.id && dragSourceId !== item.id ? 'bg-primary/5' : '',
                  isRowLocked(idx)
                    ? 'opacity-60 bg-muted/20 cursor-default'
                    : 'cursor-pointer hover:bg-muted/40',
                ]"
                :draggable="!isRowLocked(idx)"
                @dragstart="!isRowLocked(idx) && onDragStart(item)"
                @dragenter="onDragEnter(item, idx, $event)"
                @dragover.prevent="onDragOver(item, idx, $event)"
                @drop.prevent="onDrop()"
                @dragend="onDragEnd"
                @click="handleRowClick(item, idx)"
              >
                <div class="flex items-center gap-1">
                  <IconLock
                    v-if="isRowLocked(idx)"
                    class="w-3.5 h-3.5 text-amber-500 flex-shrink-0"
                    title="Дата прошла — редактирование заблокировано"
                  />
                  <span>{{ item.position }}</span>
                </div>
                <div class="font-medium break-words">
                  <span v-if="item.theme">{{ item.theme }}</span>
                  <span v-else class="text-muted-foreground/60 italic">Тема еще не загружена</span>
                </div>
                <div class="text-muted-foreground">{{ getLessonDateByIndex(idx) }}</div>
                <div class="text-muted-foreground">{{ item.totalHours ?? "—" }}</div>
                <div class="text-muted-foreground break-words">{{ item.homework || "—" }}</div>
                <div class="text-muted-foreground break-words">{{ item.notes || "—" }}</div>
                <div class="flex items-center justify-center text-muted-foreground/50">
                  <IconMenu v-if="!isRowLocked(idx)" class="w-4 h-4" />
                </div>
              </div>
            </template>
            <!-- Drop indicator after last row -->
            <div
              v-if="dragSourceId && dropIndex === ktpDetails.length"
              class="h-0.5 bg-primary rounded"
            />
            <div
              v-if="!ktpDetails.length"
              class="py-8 text-center text-muted-foreground text-sm"
            >
              Темы еще не добавлены
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Children -->
    <KtpDetailFormPopover
      v-if="ktpId"
      v-model:opened="isFormPopoverOpen"
      :ktp-id="ktpId"
      :detail-to-edit="editingDetail"
      :locked="isEditingLocked"
      :remaining-hours="remainingHoursForForm"
    />
    <RupImportDialog
      v-model:opened="isRupImportDialogOpen"
      :currentKtpId="ktpId"
      @imported="onThemesImported"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { f7 } from "framework7-vue";
import { saveAs } from "file-saver";
import IconChevronLeft from "~icons/lucide/chevron-left";
import IconFileDown from "~icons/lucide/file-down";
import IconFileUp from "~icons/lucide/file-up";
import IconSquareArrowDown from "~icons/lucide/square-arrow-down";
import IconPlus from "~icons/lucide/plus";
import IconMenu from "~icons/lucide/menu";
import IconLock from "~icons/lucide/lock";
import { useKtpStore } from "@/stores/ktpStore";
import KtpDetailFormPopover from "@/components/KtpDetailFormPopover.vue";
import RupImportDialog from "@/components/RupImportDialog.vue";
import DropdownMenu from "@/components/ui/DropdownMenu.vue";
import { useKtpDetail } from "@/composables/useKtpDetail";

const props = defineProps<{
  ktpId: string;
  /** Popup/host already provides chrome: hides back button and card shell */
  embedded?: boolean;
}>();

const emit = defineEmits<{
  (e: "back"): void;
}>();

const ktpStore = useKtpStore();

const {
  ktpDetails,
  moduleTitle,
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
} = useKtpDetail(computed(() => props.ktpId));

// «Скачать шаблон» dropdown items (concept-v2 pattern: Word/Excel options)
const downloadTemplateFile = async (path: string, filename: string) => {
  try {
    const response = await fetch(path);
    const blob = await response.blob();
    saveAs(blob, filename);
  } catch (error) {
    console.error("Error downloading template:", error);
    f7.toast
      .create({
        text: "Не удалось скачать шаблон",
        closeTimeout: 3000,
        cssClass: "color-red",
      })
      .open();
  }
};

const downloadWordTemplate = () =>
  downloadTemplateFile("/rup_templates/Шаблон КТП Мрас.docx", "Шаблон КТП Мрас.docx");
const downloadExcelTemplate = () =>
  downloadTemplateFile("/rup_templates/Шаблон КТП Марса.xlsx", "Шаблон КТП Марса.xlsx");
</script>
