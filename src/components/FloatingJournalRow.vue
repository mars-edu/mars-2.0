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
                    class="p-2 text-left w-64 border-r border-border align-top"
                  >
                    Обучающийся
                  </th>
                  <th
                    v-for="(header, index) in tableHeaders"
                    :key="index"
                    class="px-1 py-2 text-center text-xs border-r border-border w-16 transition-all duration-300"
                    :class="{
                      'scale-125 bg-green-100 text-green-600 font-bold':
                        editingCell?.col === index,
                    }"
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
                  <td class="px-2 py-2 border-r border-border text-sm align-top">
                    {{ localStudent.name }}
                  </td>
                  <td
                    v-for="(mark, colIndex) in localStudent.marks"
                    :key="colIndex"
                    class="px-1 py-2 text-center border-r border-border"
                  >
                    <div class="flex flex-col gap-1">
                      <!-- First mark in pair (row 0) -->
                      <div
                        class="h-8 flex items-center justify-center transition-transform duration-300"
                        :class="{
                          'scale-175 z-10':
                            editingCell?.row === 0 &&
                            editingCell?.col === colIndex,
                        }"
                      >
                        <EditableMarkCell
                          v-if="
                            editingCell?.row === 0 &&
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
                          @click="editCell(0, colIndex)"
                          class="cursor-pointer w-full"
                        >
                          <MarkCell :mark="mark.values[0]" />
                        </div>
                      </div>

                      <!-- Second mark in pair (row 1) -->
                      <div
                        class="h-8 flex items-center justify-center transition-transform duration-300"
                        :class="{
                          'scale-175 z-10':
                            editingCell?.row === 1 &&
                            editingCell?.col === colIndex,
                        }"
                      >
                        <EditableMarkCell
                          v-if="
                            editingCell?.row === 1 &&
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
                          @click="editCell(1, colIndex)"
                          class="cursor-pointer w-full"
                        >
                          <MarkCell :mark="mark.values[1]" />
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
});

const emit = defineEmits(["close", "update-student"]);

const localStudent = ref<any>(null);
const editingCell = ref<{ row: number; col: number } | null>(null);
const editedValue = ref("");
const floatingRowRef = ref<HTMLDivElement | null>(null);

watch(
  () => props.student,
  (newStudent) => {
    if (newStudent) {
      localStudent.value = JSON.parse(JSON.stringify(newStudent));
      nextTick(() => {
        floatingRowRef.value?.focus();
      });
    } else {
      localStudent.value = null;
    }
    editingCell.value = null;
  },
  { immediate: true }
);

const getMark = (row: number, col: number): string => {
  const mark = localStudent.value.marks[col].values[row];
  if (mark === null) return "";
  return String(mark ?? "");
};

const setMark = (row: number, col: number, value: string) => {
  const newValue = value === "+" || value === "" ? null : value;
  localStudent.value.marks[col].values[row] = newValue;
};

const editCell = (row: number, col: number) => {
  editingCell.value = { row, col };
  editedValue.value = getMark(row, col);
};

const confirmEdit = () => {
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

    switch (direction) {
      case "right":
      case "down": // Treat 'down' similar to 'right' for mark-level navigation
        if (startRow === 0) {
          nextRow = 1;
        } else {
          nextRow = 0;
          nextCol += 1;
        }
        break;
      case "left":
      case "up": // Treat 'up' similar to 'left' for mark-level navigation
        if (startRow === 1) {
          nextRow = 0;
        } else {
          nextRow = 1;
          nextCol -= 1;
        }
        break;
    }

    if (nextCol < 0) nextCol = numCols - 1;
    if (nextCol >= numCols) nextCol = 0;
    // No need to wrap rows, as they are handled by the inner logic

    editCell(nextRow, nextCol);
  });
};

const handleClose = () => {
  if (editingCell.value) {
    confirmEdit();
  }
  emit("update-student", localStudent.value);
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