<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[9999] p-4"
      @click.self="handleClose"
      @keydown.esc.prevent="handleClose"
      ref="focusContainer"
      tabindex="-1"
    >
      <div class="bg-mars-muted rounded-xl shadow-lg p-4 w-full max-w-md max-h-[90vh] flex flex-col">
        <div
          class="bg-card rounded-lg p-2 overflow-y-auto"
          :class="{ 'bg-gray-100': isColumnFutureDate }"
        >
          <table class="w-full">
            <thead class="sticky top-0 bg-card z-10">
              <tr class="bg-muted/50">
                <th class="p-2 text-left w-12 rounded-tl-lg">№</th>
                <th class="p-2 text-left">Обучающийся</th>
                <th class="p-2 text-center w-24 rounded-tr-lg">
                  <span
                    v-if="columnHeader"
                    v-html="columnHeader.label.replace('\\n', '<br/>')"
                  ></span>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(student, index) in localStudents"
                :key="student.id"
                class="border-b border-border last:border-b-0 transition-all duration-300"
                :class="{
                  'scale-110 z-10 transform bg-background shadow-xl rounded-lg':
                    editingCell?.studentIndex === index,
                }"
              >
                <td
                  class="p-2 text-center rounded-l-lg"
                  :class="{
                    'font-bold': editingCell?.studentIndex === index,
                  }"
                >
                  {{ index + 1 }}
                </td>
                <td
                  class="p-2"
                  :class="{
                    'font-bold': editingCell?.studentIndex === index,
                  }"
                >
                  {{ student.name }}
                </td>
                <td class="p-2 text-center rounded-r-lg">
                  <div class="flex flex-col gap-1">
                    <div
                      v-for="(value, rowIdx) in student.marks[selectedDateIndex]
                        .values"
                      :key="rowIdx"
                      class="h-8 flex items-center justify-center"
                    >
                      <EditableMarkCell
                        v-if="
                          editingCell?.studentIndex === index &&
                          editingCell?.markIndex === rowIdx
                        "
                        v-model="editedValue"
                        @confirm="confirmEdit"
                        @cancel="cancelEdit"
                        @navigate="navigate"
                        :is-zoomed="true"
                      />
                      <div
                        v-else
                        @click="handleCellClick(index, rowIdx)"
                        :class="[
                          'w-full',
                          isColumnFutureDate ? 'cursor-not-allowed' : 'cursor-pointer'
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
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, computed } from "vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "./ui/EditableMarkCell.vue";
import { useMarksStore } from "@/stores/marksStore";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7 } from "framework7-vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  students: {
    type: Array as () => any[],
    required: true,
  },
  columnHeader: {
    type: Object as () => { type: string; label: string; isoDate?: string } | null,
    required: false,
    default: null,
  },
  selectedDateIndex: {
    type: Number,
    required: true,
  },
  journalId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["close"]);

const marksStore = useMarksStore();

const focusContainer = ref<HTMLDivElement | null>(null);
const editingCell = ref<{ studentIndex: number; markIndex: number } | null>(
  null
);
const editedValue = ref("");

// Use computed to get fresh data from store instead of copying
const localStudents = computed(() => {
  if (!props.students || !props.journalId) return [];

  return props.students.map((student) => {
    const studentId = student.studentId || student.id?.toString();
    const studentMarks = marksStore.getStudentMarks(props.journalId, studentId);

    return {
      ...student,
      marks: studentMarks || student.marks || [],
      studentId: studentId,
    };
  });
});

watch(
  () => props.visible,
  (isVisible) => {
    if (isVisible) {
      nextTick(() => {
        focusContainer.value?.focus();
      });
    } else {
      editingCell.value = null;
    }
  }
);

const getMark = (studentIndex: number, markIndex: number) => {
  const student = localStudents.value[studentIndex];
  if (!student) return "";
  const mark = student.marks[props.selectedDateIndex]?.values[markIndex];
  if (mark === null) return "";
  return String(mark ?? "");
};

// Direct mark update function - immediate save like FloatingJournalRow
const updateMark = async (studentIndex: number, markIndex: number, value: string | null) => {
  const student = localStudents.value[studentIndex];
  if (!student || !props.journalId) return;

  const studentId = student.studentId;

  // Update in store directly
  await marksStore.updateStudentMark(
    props.journalId,
    studentId,
    props.selectedDateIndex,
    markIndex,
    value
  );
};

const setMark = (studentIndex: number, markIndex: number, value: string) => {
  const newValue = value === "+" || value === "" ? null : value;
  // Direct store update - no debounce
  updateMark(studentIndex, markIndex, newValue);
};

// Utility function to check if a date is in the future
const isFutureDate = (isoDate: string | undefined): boolean => {
  if (!isoDate) return false;
  const today = dayjs().startOf('day');
  const cellDate = dayjs(isoDate, DATE_STORAGE_FORMAT);
  return cellDate.isAfter(today);
};

// Check if the current column is a future date
const isColumnFutureDate = computed(() => {
  return props.columnHeader?.type === 'date' &&
         props.columnHeader?.isoDate &&
         isFutureDate(props.columnHeader.isoDate);
});

const handleCellClick = (studentIndex: number, markIndex: number) => {
  const currentMark = getMark(studentIndex, markIndex);
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
            editCell(studentIndex, markIndex);
          }
        }
      ],
      verticalButtons: false,
    }).open();
  } else {
    // Empty cell, edit directly
    editCell(studentIndex, markIndex);
  }
};

const editCell = (studentIndex: number, markIndex: number) => {
  // Check if this is a future date column
  if (isColumnFutureDate.value) {
    f7.toast.create({
      text: 'Нельзя выставлять оценки за будущие даты',
      position: 'center',
      closeTimeout: 2000,
    }).open();
    return;
  }

  editingCell.value = { studentIndex, markIndex };
  editedValue.value = getMark(studentIndex, markIndex);
};

const confirmEdit = () => {
  if (!editingCell.value) return;
  const { studentIndex, markIndex } = editingCell.value;
  setMark(studentIndex, markIndex, editedValue.value);
  editingCell.value = null;
};

const cancelEdit = () => {
  editingCell.value = null;
};

const navigate = (direction: "up" | "down" | "left" | "right") => {
  if (!editingCell.value) return;
  const { studentIndex: startStudentIndex, markIndex: startMarkIndex } =
    editingCell.value;

  setMark(startStudentIndex, startMarkIndex, editedValue.value);
  editingCell.value = null;

  nextTick(() => {
    let nextStudentIndex = startStudentIndex;
    let nextMarkIndex = startMarkIndex;
    const rowCount =
      localStudents.value[0]?.marks[props.selectedDateIndex]?.values?.length ||
      2;

    switch (direction) {
      case "right":
      case "down":
        if (nextMarkIndex < rowCount - 1) {
          nextMarkIndex += 1;
        } else {
          nextMarkIndex = 0;
          nextStudentIndex += 1;
        }
        break;
      case "left":
      case "up":
        if (nextMarkIndex > 0) {
          nextMarkIndex -= 1;
        } else {
          nextMarkIndex = Math.max(0, rowCount - 1);
          nextStudentIndex -= 1;
        }
        break;
    }

    if (nextStudentIndex < 0) nextStudentIndex = localStudents.value.length - 1;
    if (nextStudentIndex >= localStudents.value.length) nextStudentIndex = 0;

    editCell(nextStudentIndex, nextMarkIndex);
  });
};

const handleClose = () => {
  if (editingCell.value) {
    confirmEdit();
  }
  // No need to emit updates - they're already saved directly to the store
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
</style>
