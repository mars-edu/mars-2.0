<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4"
      @click.self="handleClose"
      @keydown.esc.prevent="handleClose"
      ref="focusContainer"
      tabindex="-1"
    >
      <div class="bg-mars-muted rounded-xl shadow-lg p-4 w-full max-w-md">
        <div class="bg-card rounded-lg p-2">
          <table class="w-full">
            <thead>
              <tr class="bg-muted/50">
                <th class="p-2 text-left w-12 rounded-tl-lg">№</th>
                <th class="p-2 text-left">Обучающийся</th>
                <th class="p-2 text-center w-24 rounded-tr-lg">
                  {{ date }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="(student, index) in localStudents"
                :key="student.id"
                class="border-b border-border last:border-b-0 transition-all duration-300"
                :class="{
                  'bg-background scale-105 shadow-lg rounded-lg':
                    highlightedStudentIndex === index &&
                    editingCell?.studentIndex !== index,
                  'scale-110 z-10 transform bg-background shadow-xl rounded-lg':
                    editingCell?.studentIndex === index,
                }"
              >
                <td
                  class="p-2 text-center rounded-l-lg"
                  :class="{
                    'font-bold': highlightedStudentIndex === index || editingCell?.studentIndex === index,
                  }"
                >
                  {{ index + 1 }}
                </td>
                <td
                  class="p-2"
                  :class="{
                    'font-bold': highlightedStudentIndex === index || editingCell?.studentIndex === index,
                  }"
                >
                  {{ student.name }}
                </td>
                <td class="p-2 text-center rounded-r-lg">
                  <div class="flex flex-col gap-1">
                    <div class="h-8 flex items-center justify-center">
                      <EditableMarkCell
                        v-if="
                          editingCell?.studentIndex === index &&
                          editingCell?.markIndex === 0
                        "
                        v-model="editedValue"
                        @confirm="confirmEdit"
                        @cancel="cancelEdit"
                        @navigate="navigate"
                        :is-zoomed="true"
                      />
                      <div
                        v-else
                        @click="editCell(index, 0)"
                        class="cursor-pointer w-full"
                      >
                        <MarkCell
                          :mark="student.marks[selectedDateIndex][0]"
                        />
                      </div>
                    </div>
                    <div class="h-8 flex items-center justify-center">
                      <EditableMarkCell
                        v-if="
                          editingCell?.studentIndex === index &&
                          editingCell?.markIndex === 1
                        "
                        v-model="editedValue"
                        @confirm="confirmEdit"
                        @cancel="cancelEdit"
                        @navigate="navigate"
                        :is-zoomed="true"
                      />
                      <div
                        v-else
                        @click="editCell(index, 1)"
                        class="cursor-pointer w-full"
                      >
                        <MarkCell
                          :mark="student.marks[selectedDateIndex][1]"
                        />
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
import { ref, watch, nextTick } from "vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "./ui/EditableMarkCell.vue";

const props = defineProps({
  visible: {
    type: Boolean,
    default: false,
  },
  students: {
    type: Array as () => any[],
    required: true,
  },
  date: {
    type: String,
    required: true,
  },
  selectedDateIndex: {
    type: Number,
    required: true,
  },
  highlightedStudentIndex: {
    type: Number,
    default: -1,
  },
});

const emit = defineEmits(["close", "update-students"]);

const focusContainer = ref<HTMLDivElement | null>(null);
const localStudents = ref<any[]>([]);
const editingCell = ref<{ studentIndex: number; markIndex: number } | null>(
  null
);
const editedValue = ref("");

watch(
  () => props.students,
  (newStudents) => {
    if (newStudents) {
      localStudents.value = JSON.parse(JSON.stringify(newStudents));
    }
  },
  { immediate: true, deep: true }
);

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
  return (
    localStudents.value[studentIndex].marks[props.selectedDateIndex][
      markIndex
    ] || ""
  );
};

const setMark = (studentIndex: number, markIndex: number, value: string) => {
  localStudents.value[studentIndex].marks[props.selectedDateIndex][
    markIndex
  ] = value;
};

const editCell = (studentIndex: number, markIndex: number) => {
  if (editingCell.value) {
    confirmEdit();
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
  const {
    studentIndex: startStudentIndex,
    markIndex: startMarkIndex,
  } = editingCell.value;

  confirmEdit();

  let nextStudentIndex = startStudentIndex;
  let nextMarkIndex = startMarkIndex;

  switch (direction) {
    case "right":
    case "down":
      if (startMarkIndex === 0) {
        nextMarkIndex = 1;
      } else {
        nextMarkIndex = 0;
        nextStudentIndex += 1;
      }
      break;
    case "left":
    case "up":
      if (startMarkIndex === 1) {
        nextMarkIndex = 0;
      } else {
        nextMarkIndex = 1;
        nextStudentIndex -= 1;
      }
      break;
  }

  if (nextStudentIndex < 0) nextStudentIndex = localStudents.value.length - 1;
  if (nextStudentIndex >= localStudents.value.length) nextStudentIndex = 0;

  editCell(nextStudentIndex, nextMarkIndex);
};

const handleClose = () => {
  if (editingCell.value) {
    confirmEdit();
  }
  emit("update-students", localStudents.value);
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
 