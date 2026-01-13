<template>
  <div class="ktp-detail-body">
    <div v-if="ktpStore.error" class="px-4 pb-2 text-destructive text-sm">
      {{ ktpStore.error }}
    </div>

    <div class="ktp-content">
      <div class="p-4 space-y-3">
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
              >{{ semesterPlannedHours }} часов</span
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
              <f7-icon
                ios="f7:arrow_down_doc"
                md="material:download"
                class="!text-sm mr-1"
              ></f7-icon>
              Скачать шаблон
            </f7-button>

            <f7-button
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="uploadDocument"
            >
              <f7-icon
                ios="f7:arrow_up_doc"
                md="material:upload_file"
                class="!text-sm mr-1"
              ></f7-icon>
              Загрузить план
            </f7-button>

            <f7-button
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="importData"
            >
              <f7-icon
                ios="f7:square_arrow_down"
                md="material:import_export"
                class="!text-sm mr-1"
              ></f7-icon>
              Импорт
            </f7-button>

            <f7-button
              id="add-ktp-detail-button"
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="addManually"
            >
              <f7-icon
                ios="f7:plus"
                md="material:add"
                class="!text-sm mr-1"
              ></f7-icon>
              Добавить
            </f7-button>

            <!-- NOTE: bulk-delete disabled by request; delete is done per-theme via edit popover. -->
            <!--
            <f7-button
              id="clear-ktp-themes-button"
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-destructive"
              :disabled="ktpDetails.length === 0"
              @click="clearAllThemes"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                class="!text-sm mr-1"
              ></f7-icon>
              Очистить темы
            </f7-button>
            -->

            <div class="separator-vertical"></div>

            <f7-button
              small
              text-color="white"
              class="!h-8 !min-h-8 !text-xs bg-sun"
              @click="downloadRup"
            >
              <f7-icon
                ios="f7:arrow_down_doc"
                md="material:download"
                class="!text-sm mr-1"
              ></f7-icon>
              Скачать РУП
            </f7-button>
          </div>
        </div>

        <div class="border border-border rounded-lg overflow-hidden">
          <div
            class="grid grid-cols-[40px_minmax(0,_1fr)_100px_100px_80px_80px_120px_160px] gap-4 px-4 py-2 bg-muted/50 text-sm text-muted-foreground"
          >
            <div class="font-medium text-center">№</div>
            <div class="font-medium">Темы занятий</div>
            <div class="font-medium text-center">Дата</div>
            <div class="font-medium text-center">Всего часов</div>
            <div class="font-medium text-center">СРСП</div>
            <div class="font-medium text-center">СРС</div>
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
                class="grid grid-cols-[40px_minmax(0,_1fr)_100px_100px_80px_80px_120px_160px] gap-4 px-4 py-3 items-start cursor-pointer hover:bg-muted/50 transition-colors"
                :class="{
                  'is-dragging': dragSourceId === item.id,
                  'is-drag-over':
                    dragOverId === item.id && dragSourceId !== item.id,
                }"
                draggable="true"
                @dragstart="onDragStart(item)"
                @dragover.prevent="onDragOver(item, idx, $event)"
                @dragenter.prevent="onDragEnter(item, idx, $event)"
                @drop.prevent="onDrop()"
                @dragend="onDragEnd"
                @click="openEditPopover(item)"
              >
                <div
                  class="flex items-center justify-center gap-2 select-none"
                >
                  <span
                    class="drag-handle inline-flex items-center justify-center p-1 rounded cursor-move text-muted-foreground/80 hover:text-foreground hover:bg-muted"
                  >
                    <f7-icon
                      ios="f7:line_horizontal_3"
                      md="material:drag_indicator"
                      class="!text-base"
                    ></f7-icon>
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
import { ref, computed } from "vue";
import { f7, f7Icon, f7Button } from "framework7-vue";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useClass9Store } from "@/stores/class9Store";
import { getEventDays } from "@/utils/eventDate";
import KtpDetailFormPopover from "@/components/KtpDetailFormPopover.vue";
import DownloadTemplateDialog from "@/components/DownloadTemplateDialog.vue";
import RupImportDialog from "@/components/RupImportDialog.vue";
import { storeToRefs } from "pinia";
import {
  parseEducationalScheduleViaConvex,
  exportKtpToExcelViaConvex,
} from "@/services/convex-excel-export";
import { parseKtpFromDocxTemplate } from "@/services/docx-ktp-import";

const props = defineProps<{
  ktpId: string | null;
}>();

const ktpStore = useKtpStore();
const calendarStore = useCalendarStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const class9Store = useClass9Store();
const { loading } = storeToRefs(ktpStore);
const selectedDetailId = ref("ktp-detail-3");

// Computed property to get filtered details for the current parent
const ktpDetails = computed(() => {
  if (!props.ktpId) return [];
  return ktpStore.getDetailsByKtpId(props.ktpId);
});

const linkedEvent = computed(() => {
  if (!props.ktpId) return null;
  const ktp = ktpStore.ktps.find((k: any) => k.id === props.ktpId);
  const byEventId = ktp?.eventId
    ? calendarStore.events.find((e: any) => e.id === ktp.eventId)
    : null;
  return byEventId || calendarStore.events.find((e: any) => e.ktpId === props.ktpId) || null;
});

const learningOutcome = computed(() => {
  const event = linkedEvent.value as any;
  if (!event?.class9Id) return null;
  const class9Item = class9Store.getClass9ById(event.class9Id);
  return class9Item?.learningOutcome || null;
});

const lessonDates = computed(() => {
  const event = linkedEvent.value as any;
  if (!event) return [];

  const getSemesterById = (id: string) => {
    const fn = (academicYearSemesterStore as any).getAcademicYearSemesterById;
    if (typeof fn === "function") return fn(id);
    if (fn && typeof fn.value === "function") return fn.value(id);
    return academicYearSemesterStore.academicYearSemesters.find(
      (s: any) => s.id === id
    );
  };

  const semester = event.semester ? getSemesterById(String(event.semester)) : null;
  const semesterInfo = semester
    ? { startDate: semester.startDate, endDate: semester.endDate }
    : undefined;

  try {
    const days = getEventDays(event, semesterInfo);
    return days.map((d) => d.day.format("DD.MM.YYYY"));
  } catch (e) {
    console.error("[KtpDetailPopupBody] Failed to compute lesson dates:", e);
    return [];
  }
});

const getLessonDateByIndex = (idx: number) => lessonDates.value[idx] || "—";

// Computed properties for hour calculations
const plannedHoursFromKtp = computed(() => {
  const details = ktpDetails.value;
  const totalHours = details.reduce((sum, detail) => {
    const hours = detail.totalHours || 0;
    return sum + hours;
  }, 0);
  return totalHours;
});

const semesterPlannedHours = computed(() => {
  const details = ktpDetails.value;
  const totalHours = details.reduce((sum, detail) => {
    const hours = detail.totalHours || 0;
    return sum + hours;
  }, 0);
  return totalHours.toString();
});

const isFormPopoverOpen = ref(false);
const editingDetail = ref<KtpDetail | null>(null);
const isImporting = ref(false);
const isRupImportDialogOpen = ref(false);
const dragSourceId = ref<string | null>(null);
const dragOverId = ref<string | null>(null);
const dropIndex = ref<number | null>(null);

const downloadTemplate = () => {
  f7.popover.open("#download-template-popover", "#download-template-button");
};

const downloadRup = async () => {
  if (!props.ktpId) {
    f7.toast
      .create({
        text: "Ошибка: не указан родительский элемент",
        closeTimeout: 3000,
        cssClass: "color-red",
      })
      .open();
    return;
  }

  f7.preloader.show();
  try {
    // Template columns: № занятия, Тема, Часы, Тип занятий, Домашнее задание, Примечание
    const dataRows = ktpDetails.value.map((item) => [
      item.position,
      item.theme,
      item.totalHours ?? null,
      null, // Тип занятий (lesson type) - not available in KTP details
      item.homework ?? null,
      item.notes ?? null,
    ]);

    const templatePath = "/rup_templates/Шаблон КТП Марса.xlsx";
    await exportKtpToExcelViaConvex(dataRows, templatePath, learningOutcome.value);

    f7.toast
      .create({
        text: "РУП успешно скачан",
        closeTimeout: 3000,
        cssClass: "color-green",
      })
      .open();
  } catch (error) {
    console.error("Error downloading RUP:", error);
    f7.toast
      .create({
        text: `Ошибка: ${(error as Error).message}`,
        closeTimeout: 5000,
        cssClass: "color-red",
      })
      .open();
  } finally {
    f7.preloader.hide();
  }
};

const uploadDocument = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".xlsx,.xls,.docx";
  input.style.display = "none";

  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    if (!props.ktpId) {
      f7.toast
        .create({
          text: "Ошибка: не указан родительский элемент",
          closeTimeout: 3000,
          cssClass: "color-red",
        })
        .open();
      return;
    }

    f7.preloader.show();
    try {
      isImporting.value = true;
      ktpStore.error = null;

      const isDocx =
        file.name.toLowerCase().endsWith(".docx") ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

      const parseResult = isDocx
        ? await parseKtpFromDocxTemplate(file)
        : await parseEducationalScheduleViaConvex(file);

      if (!parseResult.lessons.length) {
        throw new Error("В файле не найдено ни одного урока для импорта");
      }

      const importResult = await ktpStore.bulkImportKtpDetails(
        props.ktpId,
        parseResult.lessons
      );

      if (importResult.success) {
        f7.toast
          .create({
            text: `Успешно импортировано ${importResult.imported} уроков из файла ${parseResult.metadata.fileName}`,
            closeTimeout: 4000,
            cssClass: "color-green",
          })
          .open();
        // Refresh current list to ensure view shows imported data for this parent
        ktpStore.fetchDetailsForKtp(props.ktpId);
      } else {
        throw new Error(importResult.error || "Ошибка импорта данных");
      }
    } catch (error) {
      console.error("Error processing import file:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Неизвестная ошибка при обработке файла";

      f7.toast
        .create({
          text: `Ошибка: ${errorMessage}`,
          closeTimeout: 5000,
          cssClass: "color-red",
        })
        .open();

      ktpStore.error = errorMessage;
    } finally {
      isImporting.value = false;
      f7.preloader.hide();
    }
  };

  document.body.appendChild(input);
  input.click();
  document.body.removeChild(input);
};

const importData = () => {
  isRupImportDialogOpen.value = true;
};

const addManually = () => {
  openAddPopover();
};

const openAddPopover = () => {
  editingDetail.value = null;
  isFormPopoverOpen.value = true;
};

// const clearAllThemes = () => { ... } // disabled (see template note)

const openEditPopover = (detail: KtpDetail) => {
  editingDetail.value = detail;
  selectedDetailId.value = detail.id;
  isFormPopoverOpen.value = true;
};

function onDragStart(item: KtpDetail) {
  dragSourceId.value = item.id;
}

function onDragEnter(item: KtpDetail, idx: number, event?: DragEvent) {
  if (dragSourceId.value === item.id) return;

  dragOverId.value = item.id;

  // Calculate drop position based on mouse position within the item
  if (event) {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseY = event.clientY;
    const itemMiddle = rect.top + rect.height / 2;

    // If mouse is in the upper half, drop before this item
    // If mouse is in the lower half, drop after this item
    dropIndex.value = mouseY < itemMiddle ? idx : idx + 1;
  } else {
    dropIndex.value = idx;
  }
}

function onDragOver(item: KtpDetail, idx: number, event: DragEvent) {
  if (dragSourceId.value === item.id) return;

  // Continuously update drop position based on mouse position for smooth feedback
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const mouseY = event.clientY;
  const itemMiddle = rect.top + rect.height / 2;

  // Update drop index based on mouse position
  dropIndex.value = mouseY < itemMiddle ? idx : idx + 1;
  dragOverId.value = item.id;
}

function onDrop() {
  if (!props.ktpId || dragSourceId.value == null || dropIndex.value == null) {
    dragSourceId.value = null;
    dragOverId.value = null;
    dropIndex.value = null;
    return;
  }
  const ids = ktpDetails.value.map((d) => d.id);
  const fromIndex = ids.indexOf(dragSourceId.value);
  let toIndex = dropIndex.value;

  // Adjust the target index if we're moving an item down
  if (fromIndex < toIndex) {
    toIndex--;
  }

  if (
    fromIndex === -1 ||
    toIndex < 0 ||
    toIndex >= ktpDetails.value.length ||
    fromIndex === toIndex
  ) {
    dragSourceId.value = null;
    dragOverId.value = null;
    dropIndex.value = null;
    return;
  }

  const newOrder = [...ids];
  const [moved] = newOrder.splice(fromIndex, 1);
  newOrder.splice(toIndex, 0, moved);

  const result = ktpStore.reorderKtpDetails(props.ktpId, newOrder);
  if (result.success) {
    f7.toast
      .create({
        text: `Порядок элементов обновлен`,
        closeTimeout: 1500,
        cssClass: "color-green",
      })
      .open();
    ktpStore.fetchDetailsForKtp(props.ktpId);
  } else {
    f7.toast
      .create({
        text: `Ошибка при изменении порядка: ${result.error}`,
        closeTimeout: 3000,
        cssClass: "color-red",
      })
      .open();
  }
  dragSourceId.value = null;
  dragOverId.value = null;
  dropIndex.value = null;
}

function onDragEnd() {
  dragSourceId.value = null;
  dragOverId.value = null;
  dropIndex.value = null;
}

const onThemesImported = (count: number) => {
  if (props.ktpId) {
    ktpStore.fetchDetailsForKtp(props.ktpId);
  }
};

</script>

<style scoped>
.ktp-detail-body {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.ktp-content {
  flex: 1;
  overflow-y: auto;
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
