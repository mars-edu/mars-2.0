# KTP Detail View Port Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In-page KTP detail interface in KtpPage (concept-v2 layout, mars tokens), backed by a `useKtpDetail` composable shared with the existing popup body.

**Architecture:** Extract all detail logic from `KtpDetailPopupBody.vue` into `src/composables/useKtpDetail.ts` (verbatim move; Body template untouched). New `KtpDetailView.vue` renders the in-page surface from the same composable. KtpPage swaps card-click target from popup to in-page view.

**Tech Stack:** Vue 3 + Framework7, Pinia, existing `useKtpPlannedHours`, Jest, Playwright.

**Spec:** `docs/superpowers/specs/2026-06-07-ktp-detail-view-port-design.md`

---

### Task 1: useKtpDetail composable

**Files:**
- Create: `src/composables/useKtpDetail.ts`

The code below is the script logic of `src/components/KtpDetailPopupBody.vue` (lines ~230-620) moved verbatim, with `props.ktpId` → `ktpId.value`, plus `moduleTitle` (moved from `KtpDetailPopup.computedModuleTitle`). Before writing, READ the current `KtpDetailPopupBody.vue` script fully — if any handler differs from below (file may have drifted), prefer the file's current logic and note the difference in your report.

- [ ] **Step 1: Create the composable**

```ts
import { ref, computed, type ComputedRef, type Ref } from "vue";
import { f7 } from "framework7-vue";
import { useKtpStore, type KtpDetail } from "@/stores/ktpStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { getEventDays } from "@/utils/eventDate";
import { DATE_UI_FORMAT } from "@/constants/calendar";
import {
  parseEducationalScheduleViaConvex,
  exportKtpToExcelViaConvex,
} from "@/services/convex-excel-export";
import { parseKtpDocxFile } from "@/services/docx-ktp-parser";
import { useKtpPlannedHours } from "@/composables/useKtpPlannedHours";

/**
 * Shared KTP detail logic for KtpDetailPopupBody (popup) and
 * KtpDetailView (in-page). Extracted verbatim from KtpDetailPopupBody.
 */
export function useKtpDetail(
  ktpId: ComputedRef<string | null> | Ref<string | null>
) {
  const ktpStore = useKtpStore();
  const calendarStore = useCalendarStore();
  const academicYearSemesterStore = useAcademicYearSemesterStore();
  const rupEntryStore = useRupEntryStore();
  const { getPlannedHoursForKtp } = useKtpPlannedHours();
  const selectedDetailId = ref("ktp-detail-3");

  const ktpDetails = computed(() => {
    if (!ktpId.value) return [];
    return ktpStore.getDetailsByKtpId(ktpId.value);
  });

  const linkedEvent = computed(() => {
    if (!ktpId.value) return null;
    const ktp = ktpStore.ktps.find((k: any) => k.id === ktpId.value);
    const byEventId = ktp?.eventId
      ? calendarStore.events.find((e: any) => e.id === ktp.eventId)
      : null;
    return (
      byEventId ||
      calendarStore.events.find((e: any) => e.ktpId === ktpId.value) ||
      null
    );
  });

  const learningOutcome = computed(() => {
    const event = linkedEvent.value as any;
    if (!event?.rupEntryId) return null;
    const rupEntryItem = rupEntryStore.getRupEntryById(event.rupEntryId);
    return rupEntryItem?.learningOutcome || null;
  });

  // Module title for headers (moved from KtpDetailPopup.computedModuleTitle)
  const moduleTitle = computed(() => {
    if (!ktpId.value) return "Рабочие учебные программы";
    const ktpItem = ktpStore.ktps.find((ktp: any) => ktp.id === ktpId.value);
    if (!ktpItem) return "Рабочие учебные программы";
    const rupEntryItem = rupEntryStore.getRupEntryById(ktpItem.rupEntryId);
    if (!rupEntryItem) return "Рабочие учебные программы";
    return `${rupEntryItem.moduleIndex} - ${rupEntryItem.moduleName}`;
  });

  const lessonDates = computed(() => {
    const event = linkedEvent.value as any;
    if (!event) return [];

    const getSemesterById = (id: string) => {
      const fn = (academicYearSemesterStore as any)
        .getAcademicYearSemesterById;
      if (typeof fn === "function") return fn(id);
      if (fn && typeof fn.value === "function") return fn.value(id);
      return academicYearSemesterStore.academicYearSemesters.find(
        (s: any) => s.id === id
      );
    };

    const semester = event.semester
      ? getSemesterById(String(event.semester))
      : null;
    const semesterInfo = semester
      ? { startDate: semester.startDate, endDate: semester.endDate }
      : undefined;

    try {
      const days = getEventDays(event, semesterInfo);
      return days.map((d) => d.day.format(DATE_UI_FORMAT));
    } catch (e) {
      console.error("[useKtpDetail] Failed to compute lesson dates:", e);
      return [];
    }
  });

  const getLessonDateByIndex = (idx: number) => lessonDates.value[idx] || "—";

  const plannedHoursFromKtp = computed(() => {
    const details = ktpDetails.value;
    const totalHours = details.reduce((sum, detail) => {
      const hours = detail.totalHours || 0;
      return sum + hours;
    }, 0);
    return totalHours;
  });

  // Planned-hours budget from the RUP distributionEntry (null = unknown)
  const semesterPlannedHours = computed(() => {
    if (!ktpId.value) return null;
    return getPlannedHoursForKtp(ktpId.value);
  });

  const isFormPopoverOpen = ref(false);
  const editingDetail = ref<KtpDetail | null>(null);
  const isEditingLocked = ref(false);
  const isImporting = ref(false);
  const isRupImportDialogOpen = ref(false);
  const dragSourceId = ref<string | null>(null);
  const dragOverId = ref<string | null>(null);
  const dropIndex = ref<number | null>(null);

  const downloadTemplate = () => {
    f7.popover.open("#download-template-popover", "#download-template-button");
  };

  const downloadRup = async () => {
    if (!ktpId.value) {
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
      await exportKtpToExcelViaConvex(
        dataRows,
        templatePath,
        learningOutcome.value
      );

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

      if (!ktpId.value) {
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
          ? await parseKtpDocxFile(file)
          : await parseEducationalScheduleViaConvex(file);

        if (!parseResult.lessons.length) {
          throw new Error("В файле не найдено ни одного урока для импорта");
        }

        const importResult = await ktpStore.bulkImportKtpDetails(
          ktpId.value,
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
          ktpStore.fetchDetailsForKtp(ktpId.value);
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

  const openAddPopover = () => {
    editingDetail.value = null;
    isFormPopoverOpen.value = true;
  };

  const addManually = () => {
    openAddPopover();
  };

  const openEditPopover = (detail: KtpDetail) => {
    editingDetail.value = detail;
    isEditingLocked.value = false;
    selectedDetailId.value = detail.id;
    isFormPopoverOpen.value = true;
  };

  // Date-based locking: check if a row's date is in the past
  const isRowLocked = (idx: number): boolean => {
    const dateStr = lessonDates.value[idx];
    if (!dateStr || dateStr === "—") return false;
    // Parse DD.MM.YYYY format
    const parts = dateStr.split(".");
    if (parts.length !== 3) return false;
    const parsed = new Date(
      Number(parts[2]),
      Number(parts[1]) - 1,
      Number(parts[0])
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return parsed < today;
  };

  const handleRowClick = (item: KtpDetail, idx: number) => {
    if (isRowLocked(idx)) {
      // Open in view-only mode for locked rows
      editingDetail.value = item;
      isEditingLocked.value = true;
      selectedDetailId.value = item.id;
      isFormPopoverOpen.value = true;
    } else {
      openEditPopover(item);
    }
  };

  // Hours validation: remaining hours available for the form.
  // Budget comes from the RUP distributionEntry; undefined disables the warning.
  const remainingHoursForForm = computed(() => {
    const planned = semesterPlannedHours.value;
    if (planned === null) return undefined;
    const editId = editingDetail.value?.id;
    const usedByOthers = ktpDetails.value.reduce((sum, d) => {
      if (d.id === editId) return sum;
      return sum + (d.totalHours || 0);
    }, 0);
    return planned - usedByOthers;
  });

  function onDragStart(item: KtpDetail) {
    dragSourceId.value = item.id;
  }

  function onDragEnter(item: KtpDetail, idx: number, event?: DragEvent) {
    if (dragSourceId.value === item.id) return;

    dragOverId.value = item.id;

    if (event) {
      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      const mouseY = event.clientY;
      const itemMiddle = rect.top + rect.height / 2;
      dropIndex.value = mouseY < itemMiddle ? idx : idx + 1;
    } else {
      dropIndex.value = idx;
    }
  }

  function onDragOver(item: KtpDetail, idx: number, event: DragEvent) {
    if (dragSourceId.value === item.id) return;

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const mouseY = event.clientY;
    const itemMiddle = rect.top + rect.height / 2;

    dropIndex.value = mouseY < itemMiddle ? idx : idx + 1;
    dragOverId.value = item.id;
  }

  async function onDrop() {
    if (!ktpId.value || dragSourceId.value == null || dropIndex.value == null) {
      dragSourceId.value = null;
      dragOverId.value = null;
      dropIndex.value = null;
      return;
    }
    const ids = ktpDetails.value.map((d) => d.id);
    const fromIndex = ids.indexOf(dragSourceId.value);
    let toIndex = dropIndex.value;

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

    // Clear immediately so a second drop is a no-op during the pending mutation
    dragSourceId.value = null;
    dragOverId.value = null;
    dropIndex.value = null;

    const result = await ktpStore.reorderKtpDetails(ktpId.value, newOrder);
    if (result.success) {
      f7.toast
        .create({
          text: `Порядок элементов обновлен`,
          closeTimeout: 1500,
          cssClass: "color-green",
        })
        .open();
      ktpStore.fetchDetailsForKtp(ktpId.value);
    } else {
      f7.toast
        .create({
          text: `Ошибка при изменении порядка: ${result.error}`,
          closeTimeout: 3000,
          cssClass: "color-red",
        })
        .open();
    }
  }

  function onDragEnd() {
    dragSourceId.value = null;
    dragOverId.value = null;
    dropIndex.value = null;
  }

  const onThemesImported = (count: number) => {
    if (ktpId.value) {
      ktpStore.fetchDetailsForKtp(ktpId.value);
    }
  };

  return {
    // data
    ktpDetails,
    linkedEvent,
    learningOutcome,
    moduleTitle,
    lessonDates,
    getLessonDateByIndex,
    // hours
    plannedHoursFromKtp,
    semesterPlannedHours,
    remainingHoursForForm,
    // locking
    isRowLocked,
    // form popover
    isFormPopoverOpen,
    editingDetail,
    isEditingLocked,
    selectedDetailId,
    openAddPopover,
    addManually,
    openEditPopover,
    handleRowClick,
    // drag
    dragSourceId,
    dragOverId,
    dropIndex,
    onDragStart,
    onDragEnter,
    onDragOver,
    onDrop,
    onDragEnd,
    // import/export
    isImporting,
    isRupImportDialogOpen,
    uploadDocument,
    importData,
    onThemesImported,
    downloadRup,
    downloadTemplate,
  };
}
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i useKtpDetail`
Expected: empty.

- [ ] **Step 3: Commit**

```bash
git add src/composables/useKtpDetail.ts
git commit -m "refactor(ktp): extract useKtpDetail composable from KtpDetailPopupBody"
```

---

### Task 2: KtpDetailPopupBody on the composable

**Files:**
- Modify: `src/components/KtpDetailPopupBody.vue` (script block ONLY — template MUST stay byte-identical)

- [ ] **Step 1: Replace the script block**

Replace the entire `<script setup lang="ts">…</script>` with:

```vue
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
```

IMPORTANT: before finalizing, grep the Body TEMPLATE for every identifier it references (`grep -oE '\b(ktpDetails|loading|isImporting|plannedHoursFromKtp|semesterPlannedHours|remainingHoursForForm|isRowLocked|handleRowClick|addManually|dragSourceId|dragOverId|dropIndex|onDrag\w+|onDrop|getLessonDateByIndex|downloadTemplate|downloadRup|uploadDocument|importData|isFormPopoverOpen|editingDetail|isEditingLocked|isRupImportDialogOpen|onThemesImported|ktpStore)\b'` on lines 1-203). Every template identifier must be either imported, destructured from the composable, or declared. If the template uses something not in the list above (drift), destructure it too.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i KtpDetailPopupBody && npm test`
Expected: no tsc errors for this file; test suites unchanged (4 pre-existing unrelated failures OK).
Confirm template untouched: `git diff src/components/KtpDetailPopupBody.vue | grep '^[-+]' | grep -v '^[-+][-+]' | grep -cE '^\-.*<'` — template lines should not appear in the diff (script-only change).

- [ ] **Step 3: Commit**

```bash
git add src/components/KtpDetailPopupBody.vue
git commit -m "refactor(ktp): KtpDetailPopupBody consumes useKtpDetail composable"
```

---

### Task 3: KtpDetailView component

**Files:**
- Create: `src/components/KtpDetailView.vue`

- [ ] **Step 1: Create the component**

```vue
<template>
  <div>
    <!-- Back -->
    <button
      class="mb-6 flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium transition-colors"
      data-testid="ktp-detail-back"
      @click="emit('back')"
    >
      <IconChevronLeft class="w-5 h-5" />
      Назад к списку
    </button>

    <div class="bg-card text-card-foreground p-6 md:p-8 rounded-3xl shadow-sm border border-border">
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

      <!-- Action bar -->
      <div class="flex flex-wrap gap-3 mb-8">
        <button
          id="download-template-button"
          class="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          @click="downloadTemplate"
        >
          <IconFileDown class="w-4 h-4" /> Скачать шаблон
        </button>
        <button
          class="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          @click="downloadRup"
        >
          <IconFileDown class="w-4 h-4" /> Скачать план
        </button>
        <button
          class="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          @click="uploadDocument"
        >
          <IconFileUp class="w-4 h-4" /> Загрузить план
        </button>
        <button
          class="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
          @click="importData"
        >
          <IconSquareArrowDown class="w-4 h-4" /> Импорт
        </button>
        <button
          class="flex items-center gap-2 bg-emerald-500 text-white hover:bg-emerald-600 px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
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
    <DownloadTemplateDialog />
    <RupImportDialog
      v-model:opened="isRupImportDialogOpen"
      :current-ktp-id="ktpId"
      @imported="onThemesImported"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import IconChevronLeft from "~icons/lucide/chevron-left";
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
import { useKtpDetail } from "@/composables/useKtpDetail";

const props = defineProps<{
  ktpId: string;
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
  downloadTemplate,
} = useKtpDetail(computed(() => props.ktpId));
</script>
```

NOTE: before finalizing, check `RupImportDialog.vue` props (`currentKtpId` casing) and `KtpDetailFormPopover.vue` prop names against how `KtpDetailPopupBody.vue`'s TEMPLATE binds them (lines 185-200) — mirror the popup body's exact bindings.

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -i KtpDetailView`
Expected: empty.

- [ ] **Step 3: Commit**

```bash
git add src/components/KtpDetailView.vue
git commit -m "feat(ktp): in-page KTP detail view (concept-v2 layout)"
```

---

### Task 4: KtpPage wiring

**Files:**
- Modify: `src/pages/KtpPage.vue`

- [ ] **Step 1: Script changes**

- Add import: `import KtpDetailView from "@/components/KtpDetailView.vue";`
- Remove import of `KtpDetailPopup` and its usages.
- Replace state `isPopupOpened` + `selectedKtpParentId` (and `selectedItemId` if only used by selectItem) with:

```ts
const selectedKtpId = ref<string | null>(null);
```

- Replace `selectItem`:

```ts
const selectItem = (item: any) => {
  if (!item.ktpId) return;
  selectedKtpId.value = item.ktpId;
  ktpStore.fetchDetailsForKtp(item.ktpId);
};
```

(`getKtpIdForRupEntry` stays — still used by `getTopicCount`.)

- [ ] **Step 2: Template changes**

Inside the main content card container (`<div class="bg-card text-card-foreground rounded-xl …">`):
- Wrap the existing header row + filter row + card-list block in `<template v-else>` (or `v-else` on a wrapper div).
- Add before them:

```html
          <KtpDetailView
            v-if="selectedKtpId"
            :ktp-id="selectedKtpId"
            @back="selectedKtpId = null"
          />
```

- Remove the `<KtpDetailPopup …/>` mount entirely (keep `<AddKtpItemForm>` and `<KtpEditPopover>` mounts).

- [ ] **Step 3: Verify**

Run: `npx tsc --noEmit 2>&1 | grep -iE "KtpPage|KtpDetailView" && npm test -- src/lib/__tests__/ktpHelpers.spec.ts`
Expected: no tsc errors; 19 tests pass.
Manual: `npm run dev:all` → КТП page → card click swaps to detail view (metrics, title, action bar, table); back returns to list; Добавить opens form popover; journal planning tab still renders Body.

- [ ] **Step 4: Commit**

```bash
git add src/pages/KtpPage.vue
git commit -m "feat(ktp): card click opens in-page detail view instead of popup"
```

---

### Task 5: e2e coverage

**Files:**
- Modify: `tests/e2e/ktp.spec.ts`

- [ ] **Step 1: Add test** (inside existing describe; copy the file's login-guard idiom verbatim)

```ts
  test("card click opens in-page detail view and back returns to list", async ({ page }) => {
    const url = page.url();
    if (url.includes("login")) return;

    await page.waitForTimeout(2000);

    const cards = page.locator(".group.relative.bg-card");
    if ((await cards.count()) === 0) return; // no data in this environment

    await cards.first().click();
    await expect(page.getByTestId("ktp-detail-back")).toBeVisible();
    await expect(page.getByText("Тема занятия")).toBeVisible();
    await expect(page.getByTestId("ktp-detail-add")).toBeVisible();

    await page.getByTestId("ktp-detail-back").click();
    await expect(page.getByRole("button", { name: "Создать" })).toBeVisible();
  });
```

NOTE: verify the card locator matches KtpPage's actual card classes (`group relative bg-card border border-border rounded-2xl`); adjust selector to the real DOM if it drifted, prefer adding `data-testid="ktp-card"` to the card root in KtpPage if the class selector is brittle (then use `getByTestId`).

- [ ] **Step 2: Verify**

Run: `npx playwright test tests/e2e/ktp.spec.ts --list`
Expected: parses, previous count + 1 tests.

- [ ] **Step 3: Commit**

```bash
git add tests/e2e/ktp.spec.ts src/pages/KtpPage.vue
git commit -m "test(ktp): e2e for in-page detail view navigation"
```

---

## Verification checklist (after all tasks)

- `npm test` — ktp suites green (24), 4 pre-existing unrelated failures unchanged.
- `npx tsc --noEmit` — no ktp-related errors.
- Manual: list → detail → back; add/edit/drag/upload/import/export inside detail view; journal planning tab unchanged; wizard КТП popup unchanged.
