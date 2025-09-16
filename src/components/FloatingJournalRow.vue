<template>
  <transition name="fade">
    <div
      v-if="student"
      ref="floatingRowRef"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
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
                    {{ localStudent?.name }}
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
                          @click="editCell(rowIdx, colIndex)"
                          class="cursor-pointer w-full"
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
  const studentId = localStudent.value.studentId;

  console.log("[FloatingJournalRow] Calling marksStore.updateStudentMark:", {
    journalId: props.journalId,
    studentId,
    col,
    row,
    newValue,
  });

  // Update in store
  const updateResult = marksStore.updateStudentMark(
    props.journalId,
    studentId,
    col,
    row,
    newValue
  );
  console.log("[FloatingJournalRow] Mark update result:", updateResult);
};

const editCell = (row: number, col: number) => {
  console.log("[FloatingJournalRow] Editing cell:", { row, col });
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

const navigate = (direction: "up" | "down" | "left" | "right") => {
  if (!editingCell.value) return;

  const { row: startRow, col: startCol } = editingCell.value;

  setMark(startRow, startCol, editedValue.value);
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

const handleClose = () => {
  console.log("[FloatingJournalRow] Handling close:", {
    hasEditingCell: !!editingCell.value,
    hasLocalStudent: !!localStudent.value,
  });

  if (editingCell.value) {
    confirmEdit();
  }
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
