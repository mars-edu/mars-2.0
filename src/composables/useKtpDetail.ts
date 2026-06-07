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
 * Shared KTP detail logic for KtpDetailView (KTP page, detail popup,
 * and journal planning tab).
 */
export function useKtpDetail(
  ktpId: ComputedRef<string | null> | Ref<string | null>
) {
  const ktpStore = useKtpStore();
  const calendarStore = useCalendarStore();
  const academicYearSemesterStore = useAcademicYearSemesterStore();
  const rupEntryStore = useRupEntryStore();
  const { getPlannedHoursForKtp } = useKtpPlannedHours();

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
