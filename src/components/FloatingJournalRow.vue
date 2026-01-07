<template>
  <transition name="fade">
    <div
      v-if="student"
      ref="floatingRowRef"
      class="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-[99999] p-4"
      tabindex="-1"
      @click.self="handleClose"
      @keydown.esc.prevent="handleClose"
    >
      <transition name="scale">
        <div
          v-if="localStudent"
          class="bg-background rounded-xl shadow-lg w-full max-w-7xl"
        >
          <div class="overflow-x-auto p-2">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-muted/50">
                  <th
                    class="p-2 text-left w-12 border-r border-border align-top rounded-tl-lg"
                  >
                    №
                  </th>
                  <th
                    class="p-2 text-left w-64 border-r border-border align-top min-w-[250px]"
                  >
                    Обучающийся
                  </th>
                  <th
                    v-for="(header, index) in tableHeaders"
                    :key="index"
                    class="px-1 py-2 text-center text-xs border-r border-border w-16 min-w-[56px] transition-all duration-300"
                    :class="[
                      {
                        'scale-125 bg-green-100 text-green-600 font-bold':
                          editingCell?.col === index,
                      },
                      {
                        'bg-muted/50 text-muted-foreground':
                          header.type === 'session' ||
                          header.type === 'pk' ||
                          header.type === 'e' ||
                          header.type === 'i',
                      },
                    ]"
                  >
                    <span v-html="header.label.replace('\\n', '<br/>')"></span>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr class="bg-card">
                  <td
                    class="px-2 py-2 text-center border-r border-border text-sm align-top rounded-bl-lg"
                  >
                    {{ studentIndex + 1 }}
                  </td>
                  <td
                    class="px-2 py-2 border-r border-border text-sm align-top min-w-[250px]"
                  >
                    <div class="flex items-center justify-between">
                      <span>{{ localStudent?.name }}</span>
                      <div
                        class="ml-2 px-2 py-1 rounded-full text-xs font-medium text-white min-w-[24px] text-center"
                        :class="getScoreBadgeClass(studentAverageScore)"
                      >
                        {{ studentAverageScore }}
                      </div>
                    </div>
                  </td>
                  <td
                    v-for="(mark, colIndex) in localStudent?.marks || []"
                    :key="colIndex"
                    class="px-1 py-2 text-center border-r border-border min-w-[56px]"
                    :class="{
                      'bg-muted/90':
                        mark.type === 'session' ||
                        mark.type === 'pk' ||
                        mark.type === 'e' ||
                        mark.type === 'i',
                      'bg-gray-100 cursor-not-allowed': mark.type === 'date' && mark.isoDate && isFutureDate(mark.isoDate),
                    }"
                  >
                    <div class="flex flex-col gap-1">
                      <div
                        v-for="(value, rowIdx) in mark.values"
                        :key="rowIdx"
                        class="h-8 flex items-center justify-center transition-transform duration-300"
                        :class="{
                          'scale-175 z-10':
                            editingCell?.row === rowIdx &&
                            editingCell?.col === colIndex,
                        }"
                      >
                        <EditableMarkCell
                          v-if="
                            editingCell?.row === rowIdx &&
                            editingCell?.col === colIndex
                          "
                          v-model="editedValue"
                          @confirm="confirmEdit"
                          @cancel="cancelEdit"
                          @navigate="navigate"
                          :is-zoomed="true"
                        />
                        <div
                          v-else
                          @click="handleCellClick(rowIdx, colIndex)"
                          :class="[
                            'w-full',
                            mark.type === 'date' && mark.isoDate && isFutureDate(mark.isoDate)
                              ? 'cursor-not-allowed'
                              : 'cursor-pointer'
                          ]"
                        >
                          <MarkCell :mark="value" />
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, computed, nextTick } from "vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import { useMarksStore } from "@/stores/marksStore";
import type { Mark } from "@/types/marks";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7 } from "framework7-vue";

const props = defineProps({
  student: {
    type: Object as () => any,
    default: null,
  },
  studentIndex: {
    type: Number,
    required: true,
  },
  tableHeaders: {
    type: Array as () => { type: string; label: string }[],
    required: true,
  },
  journalId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close", "update-student"]);

const marksStore = useMarksStore();

const editingCell = ref<{ row: number; col: number } | null>(null);
const editedValue = ref("");
const floatingRowRef = ref<HTMLDivElement | null>(null);

const localStudent = computed(() => {
  if (!props.student || !props.journalId) return null;

  const studentId = props.student.studentId || props.student.id.toString();
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);

  return {
    ...props.student,
    marks: studentMarks || props.student.marks || [],
    studentId: studentId,
  };
});

const studentAverageScore = computed((): string => {
  if (!localStudent.value || !props.journalId) return "—";

  const studentId = localStudent.value.studentId;
  const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);
  if (!studentMarks) return "—";

  const allMarks: (string | null)[] = [];

  // Collect all marks from all columns
  studentMarks.forEach((mark) => {
    mark.values.forEach((value) => {
      if (value !== null && value !== "") {
        allMarks.push(value);
      }
    });
  });

  // Filter out non-numeric values and convert to numbers
  const numericMarks = allMarks
    .filter((mark) => mark && !isNaN(Number(mark)))
    .map((mark) => Number(mark));

  if (numericMarks.length === 0) {
    return "—"; // Em dash for no scores
  }

  const average =
    numericMarks.reduce((sum, mark) => sum + mark, 0) / numericMarks.length;
  return average.toFixed(1);
});

const getScoreBadgeClass = (score: string): string => {
  if (score === "—") {
    return "bg-gray-400";
  }

  const numScore = parseFloat(score);

  if (numScore >= 4.5) {
    return "bg-emerald-500"; // Green for excellent (5-4.5)
  } else if (numScore >= 3.5) {
    return "bg-gradient-to-r from-yellow-400 to-emerald-500"; // Yellow-green gradient for good (4.4-3.5)
  } else if (numScore >= 2.5) {
    return "bg-yellow-500"; // Yellow for satisfactory (3.4-2.5)
  } else {
    return "bg-red-500"; // Red for poor (below 2.5)
  }
};

watch(
  () => props.student,
  (newStudent) => {
    if (newStudent) {
      nextTick(() => {
        floatingRowRef.value?.focus();
      });
    }
    editingCell.value = null;
  },
  { immediate: true }
);

const getMark = (row: number, col: number): string => {
  if (!localStudent.value || !localStudent.value.marks[col]) return "";
  const mark = localStudent.value.marks[col].values[row];
  if (mark === null) return "";
  return String(mark ?? "");
};

// Direct mark update function - no debounce, immediate save
const updateMark = async (row: number, col: number, value: string | null) => {
  if (!localStudent.value || !props.journalId) return;

  const studentId = localStudent.value.studentId;

  console.log("[FloatingJournalRow] Calling marksStore.updateStudentMark:", {
    journalId: props.journalId,
    studentId,
    col,
    row,
    value,
  });

  // Update in store and wait for completion
  const updateResult = await marksStore.updateStudentMark(
    props.journalId,
    studentId,
    col,
    row,
    value
  );
  console.log("[FloatingJournalRow] Mark update result:", updateResult);
};

const setMark = (row: number, col: number, value: string) => {
  console.log("[FloatingJournalRow] Setting mark:", {
    row,
    col,
    value,
    journalId: props.journalId,
    hasLocalStudent: !!localStudent.value,
    studentId: localStudent.value?.studentId,
  });

  if (!localStudent.value || !props.journalId) {
    console.log("[FloatingJournalRow] Cannot set mark - missing data:", {
      hasLocalStudent: !!localStudent.value,
      journalId: props.journalId,
    });
    return;
  }

  const newValue = value === "+" || value === "" ? null : value;

  // Direct store update - no debounce
  updateMark(row, col, newValue);
};

// Utility function to check if a date is in the future
const isFutureDate = (isoDate: string | undefined): boolean => {
  if (!isoDate) return false;
  const today = dayjs().startOf('day');
  const cellDate = dayjs(isoDate, DATE_STORAGE_FORMAT);
  return cellDate.isAfter(today);
};

const handleCellClick = (row: number, col: number) => {
  const currentMark = getMark(row, col);
  const hasExistingValue = currentMark !== "" && currentMark !== null;

  if (hasExistingValue) {
    // Show confirmation dialog for existing values
    f7.dialog.create({
      title: 'Изменить оценку?',
      text: `Текущая оценка: ${currentMark}. Вы действительно хотите изменить её?`,
      buttons: [
        {
          text: 'Нет',
          close: true,
        },
        {
          text: 'Да',
          bold: true,
          onClick: () => {
            editCell(row, col);
          }
        }
      ],
      verticalButtons: false,
    }).open();
  } else {
    // Empty cell, edit directly
    editCell(row, col);
  }
};

const editCell = (row: number, col: number) => {
  console.log("[FloatingJournalRow] Editing cell:", { row, col });

  // Check if this is a future date
  if (localStudent.value?.marks[col]) {
    const mark = localStudent.value.marks[col];
    if (mark.type === "date" && mark.isoDate && isFutureDate(mark.isoDate)) {
      f7.toast.create({
        text: 'Нельзя выставлять оценки за будущие даты',
        position: 'center',
        closeTimeout: 2000,
      }).open();
      return;
    }
  }

  editingCell.value = { row, col };
  editedValue.value = getMark(row, col);
  console.log("[FloatingJournalRow] Current mark value:", editedValue.value);
};

const confirmEdit = () => {
  console.log("[FloatingJournalRow] Confirming edit:", {
    hasEditingCell: !!editingCell.value,
    editedValue: editedValue.value,
  });

  if (!editingCell.value) return;
  const { row, col } = editingCell.value;
  setMark(row, col, editedValue.value);
  editingCell.value = null;
};

const cancelEdit = () => {
  editingCell.value = null;
};

const navigate = async (direction: "up" | "down" | "left" | "right") => {
  if (!editingCell.value) return;

  const { row: startRow, col: startCol } = editingCell.value;

  setMark(startRow, startCol, editedValue.value);

  // No need to flush - updates are immediate with tRPC
  editingCell.value = null;

  nextTick(() => {
    let nextRow = startRow;
    let nextCol = startCol;
    const numCols = props.tableHeaders.length;
    const getColRows = (colIndex: number) => {
      const mark = localStudent.value?.marks[colIndex];
      return Array.isArray(mark?.values) ? mark!.values.length : 2;
    };
    const currentColRows = getColRows(startCol);

    switch (direction) {
      case "right":
      case "down":
        if (nextRow < currentColRows - 1) {
          nextRow += 1;
        } else {
          nextRow = 0;
          nextCol += 1;
        }
        break;
      case "left":
      case "up":
        if (nextRow > 0) {
          nextRow -= 1;
        } else {
          nextCol -= 1;
          const targetRows = getColRows(
            ((nextCol % numCols) + numCols) % numCols
          );
          nextRow = Math.max(0, targetRows - 1);
        }
        break;
    }

    if (nextCol < 0) nextCol = numCols - 1;
    if (nextCol >= numCols) nextCol = 0;

    editCell(nextRow, nextCol);
  });
};

const handleClose = async () => {
  console.log("[FloatingJournalRow] Handling close:", {
    hasEditingCell: !!editingCell.value,
    hasLocalStudent: !!localStudent.value,
  });

  if (editingCell.value) {
    confirmEdit();
  }

  // No need to flush - updates are immediate with tRPC

  if (localStudent.value) {
    console.log("[FloatingJournalRow] Emitting updated student:", {
      studentId: localStudent.value.studentId,
      marksCount: localStudent.value.marks?.length || 0,
    });
    emit("update-student", localStudent.value);
  }
  emit("close");
};
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.scale-enter-active,
.scale-leave-active {
  transition: transform 0.3s ease;
}
.scale-enter-from,
.scale-leave-to {
  transform: scale(0.95);
}
</style>
