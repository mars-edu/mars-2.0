import { ref, watch, nextTick, type Ref, type ComputedRef } from "vue";
import { f7 } from "framework7-vue";
import {
  exportJournalViaConvex,
  importJournalViaConvex,
  type JournalExportParams,
} from "@/services/convex-excel-export";
import {
  createImportMapping,
  prepareMarksUpdate,
  applyUpdatesToMarks,
} from "@/services/journal-import-mapper";
import { prepareJournalExportMetadata } from "@/utils/journalExport";
import { useStudentStore } from "@/stores/studentStore";
import { useTeacherStore } from "@/stores/teacherStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useJournalStore } from "@/stores/journalStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useMarksStore } from "@/stores/marksStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { storeToRefs } from "pinia";

type JournalStudentRow = JournalExportParams["students"][number];

interface JournalTabRef {
  getExportSnapshot?: () => {
    students: Array<{
      studentId: string;
      fullName: string;
      attendance: any[];
      finalSummary?: string;
    }>;
    columns: Array<{ label: string }>;
  } | null;
}

export function useJournalExportImport(
  journalId: Ref<string>,
  currentJournal: ComputedRef<any>,
  journalTabRef: Ref<JournalTabRef | null>
) {
  // Import dialog state
  const isImportDialogOpened = ref(false);
  const importOverwriteMode = ref(false);
  const importPreparedData = ref<ReturnType<typeof prepareMarksUpdate> | null>(
    null
  );
  const importMapping = ref<ReturnType<typeof createImportMapping> | null>(
    null
  );
  const importResult = ref<
    Awaited<ReturnType<typeof importJournalViaConvex>>["result"] | null
  >(null);

  // Store instances
  const studentStore = useStudentStore();
  const teacherStore = useTeacherStore();
  const specialtyStore = useSpecialtyStore();
  const academicYearStore = useAcademicYearStore();
  const academicYearSemesterStore = useAcademicYearSemesterStore();
  const rupEntryStore = useRupEntryStore();
  const journalStore = useJournalStore();
  const calendarStore = useCalendarStore();
  const selectedItemsStore = useSelectedItemsStore();
  const marksStore = useMarksStore();
  const scheduledFinalControlStore = useScheduledFinalControlStore();
  const finalControlStore = useFinalControlStore();

  const { students: studentStoreStudents } = storeToRefs(studentStore);

  // Watch overwrite mode changes and recalculate
  watch(importOverwriteMode, (newMode) => {
    if (!importMapping.value || !importResult.value) return;

    // Recalculate prepared data with new overwrite mode
    importPreparedData.value = prepareMarksUpdate(
      importResult.value,
      importMapping.value,
      newMode
    );
  });

  const onDownloadClick = async () => {
    const journal = currentJournal.value;
    if (!journal) {
      f7.dialog.alert("Журнал не найден");
      return;
    }

    try {
      f7.preloader.show();

      const snapshot = journalTabRef.value?.getExportSnapshot?.();
      if (!snapshot) {
        f7.preloader.hide();
        f7.dialog.alert(
          "Данные журнала ещё загружаются. Повторите попытку позже."
        );
        return;
      }

      const event = calendarStore.getEventById(journal.id);

      const studentRows: JournalStudentRow[] = snapshot.students.map(
        (row) => ({
          id: row.studentId,
          fullName: row.fullName,
          attendance: [...row.attendance],
          finalGrade:
            row.finalSummary && row.finalSummary !== "—"
              ? row.finalSummary
              : undefined,
        })
      );

      const academicYearId = selectedItemsStore.selectedAcademicYearId;
      const academicYear = academicYearId
        ? academicYearStore.getAcademicYearById(academicYearId)
        : academicYearStore.getActiveAcademicYear;

      const semesters = academicYear
        ? academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(
            academicYear.id
          )
        : [];

      const metadata = prepareJournalExportMetadata({
        journal,
        event,
        students: studentStoreStudents.value,
        academicYear: academicYear || null,
        selectedAcademicYearId: academicYearId,
        rupEntries: rupEntryStore.rupEntries,
        academicYearSemesters: semesters,
        scheduledFinalControls:
          scheduledFinalControlStore.scheduledFinalControls,
        finalControls: finalControlStore.finalControls,
        getSpecialtyByCode: (code: string) =>
          specialtyStore.getSpecialtyByCode(code),
        getTeacherFullName: (id: string) =>
          teacherStore.getTeacherFullName(id),
        getDisciplineTitle: (j) => journalStore.getDisciplineTitle(j),
        getJournalTitle: (j) => journalStore.getJournalTitle(j),
      });

      const { filename, ...restMetadata } = metadata;

      await exportJournalViaConvex(
        {
          ...restMetadata,
          students: studentRows,
          lessonDates: snapshot.columns.map((column) => column.label),
        },
        metadata.filename
      );
    } catch (error) {
      console.error("Failed to export journal", error);
      const message =
        error instanceof Error
          ? error.message
          : "Не удалось экспортировать журнал";
      f7.dialog.alert(message);
    } finally {
      f7.preloader.hide();
    }
  };

  const onUploadClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.multiple = false;

    input.onchange = async (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      try {
        f7.preloader.show();
        const summary = await importJournalViaConvex(file);

        if (summary.issues.some((issue) => issue.type === "error")) {
          f7.preloader.hide();
          const errorText = summary.issues
            .filter((issue) => issue.type === "error")
            .map((issue) => `• ${issue.message}`)
            .join("\n");
          f7.dialog.alert(errorText || "Не удалось импортировать журнал");
          return;
        }

        const result = summary.result;
        if (!result) {
          f7.preloader.hide();
          f7.dialog.alert("Файл обработан, но данные журнала не получены");
          return;
        }

        // Get journal data
        if (!journalId.value || !currentJournal.value) {
          f7.preloader.hide();
          f7.dialog.alert("Журнал не найден");
          return;
        }

        const journalMarks = marksStore.getJournalMarks(journalId.value);
        if (!journalMarks || journalMarks.studentMarks.length === 0) {
          f7.preloader.hide();
          f7.dialog.alert(
            "Журнал пуст. Сначала инициализируйте журнал с датами и студентами."
          );
          return;
        }

        // Get first student's marks as template
        const firstStudentMarks = journalMarks.studentMarks[0].marks;
        const studentIds = journalMarks.studentMarks.map(
          (sm) => sm.studentId
        );

        // Create mapping
        const mapping = createImportMapping(
          result,
          studentIds,
          firstStudentMarks,
          (id: string) => {
            const student = studentStore.students.find((s) => s.id === id);
            if (!student) return null;
            return {
              fullName: `${student.surname} ${student.firstName} ${student.patronymic}`.trim(),
            };
          }
        );

        // Prepare updates with default overwrite mode (false)
        const prepared = prepareMarksUpdate(result, mapping, false);

        f7.preloader.hide();

        // Store for dialog
        importResult.value = result;
        importMapping.value = mapping;
        importPreparedData.value = prepared;
        importOverwriteMode.value = false;

        // Show confirmation dialog
        isImportDialogOpened.value = true;
        nextTick(() => {
          f7.popover.open("#journal-import-confirm-popover");
        });
      } catch (error) {
        f7.preloader.hide();
        const message =
          error instanceof Error
            ? error.message
            : "Не удалось импортировать журнал";
        f7.dialog.alert(message);
      }
    };

    input.click();
  };

  const onImportConfirm = async () => {
    if (
      !importPreparedData.value ||
      !importMapping.value ||
      !journalId.value
    ) {
      f7.dialog.alert("Ошибка: данные для импорта не подготовлены");
      return;
    }

    try {
      f7.preloader.show();
      f7.popover.close("#journal-import-confirm-popover");

      // Apply updates to marks store
      await applyUpdatesToMarks(
        journalId.value,
        importPreparedData.value,
        marksStore.getStudentMarks,
        marksStore.updateStudentMark
      );

      f7.preloader.hide();

      // Show success message
      const stats = importPreparedData.value.stats;
      f7.toast
        .create({
          text: `Импорт завершен! Обновлено ${stats.totalUpdates} значений для ${stats.matchedStudents} студентов.`,
          closeTimeout: 3000,
          position: "center",
        })
        .open();

      // Clear import data
      isImportDialogOpened.value = false;
      importPreparedData.value = null;
      importMapping.value = null;
      importResult.value = null;
    } catch (error) {
      f7.preloader.hide();
      const message =
        error instanceof Error ? error.message : "Не удалось применить импорт";
      f7.dialog.alert(message);
    }
  };

  const onImportCancel = () => {
    isImportDialogOpened.value = false;
    importPreparedData.value = null;
    importMapping.value = null;
    importResult.value = null;
    f7.popover.close("#journal-import-confirm-popover");
  };

  return {
    // State
    isImportDialogOpened,
    importOverwriteMode,
    importPreparedData,
    importMapping,
    importResult,

    // Functions
    onDownloadClick,
    onUploadClick,
    onImportConfirm,
    onImportCancel,
  };
}
