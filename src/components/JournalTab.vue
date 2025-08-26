<template>
  <div>
    <div class="overflow-x-auto">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-muted/50">
            <th class="p-2 text-left w-12 border-r border-border align-top">
              №
            </th>
            <th class="p-2 text-left w-64 border-r border-border align-top">
              Обучающийся
            </th>
            <!-- Dynamic date columns -->
            <th
              v-for="(header, index) in visibleHeaders"
              :key="header.index"
              class="px-1 py-2 text-center text-xs border-r border-border w-16 cursor-pointer hover:bg-muted"
              @click="openDateFocus(header, header.index)"
            >
              <div class="flex flex-col items-center">
                <f7-icon
                  v-if="header.type === 'date'"
                  f7="paperclip"
                  class="h-8 text-gray-400"
                  @click.stop="onPaperclipClick(header, index)"
                  :id="`paperclip-${index}`"
                ></f7-icon>
                <span v-html="header.label.replace('\n', '<br/>')"></span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="(student, studentIndex) in students"
            :key="student.id"
            class="border-b border-border"
          >
            <td
              class="px-2 py-2 text-center border-r border-border text-sm align-top"
            >
              {{ studentIndex + 1 }}
            </td>
            <td
              class="px-2 py-2 border-r border-border text-sm align-top cursor-pointer hover:bg-muted/50 transition-colors"
              @click="showFloatingRow(student, studentIndex)"
            >
              <div class="flex items-center justify-between">
                <span>{{ student.name }}</span>
                <div
                  class="ml-2 px-2 py-1 rounded-full text-xs font-medium text-white min-w-[24px] text-center"
                  :class="getScoreBadgeClass(getStudentAverageScore(student))"
                >
                  {{ getStudentAverageScore(student) }}
                </div>
              </div>
            </td>
            <td
              v-for="(header, vColIdx) in visibleHeaders"
              :key="header.index"
              class="px-1 py-2 text-center border-r border-border"
            >
              <div class="flex flex-col gap-1">
                <div
                  class="h-8 flex items-center justify-center transition-transform duration-300"
                  :class="{
                    'scale-175 z-10':
                      editingCell?.studentIndex === studentIndex &&
                      editingCell?.colIndex === header.index &&
                      editingCell?.markIndex === 0,
                  }"
                >
                  <EditableMarkCell
                    v-if="
                      editingCell?.studentIndex === studentIndex &&
                      editingCell?.colIndex === header.index &&
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
                    @click="editCell(studentIndex, header.index, 0)"
                    class="cursor-pointer w-full"
                  >
                    <MarkCell :mark="student.marks[header.index].values[0]" />
                  </div>
                </div>
                <div
                  class="h-8 flex items-center justify-center transition-transform duration-300"
                  :class="{
                    'scale-175 z-10':
                      editingCell?.studentIndex === studentIndex &&
                      editingCell?.colIndex === header.index &&
                      editingCell?.markIndex === 1,
                  }"
                >
                  <EditableMarkCell
                    v-if="
                      editingCell?.studentIndex === studentIndex &&
                      editingCell?.colIndex === header.index &&
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
                    @click="editCell(studentIndex, header.index, 1)"
                    class="cursor-pointer w-full"
                  >
                    <MarkCell :mark="student.marks[header.index].values[1]" />
                  </div>
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- KtpDetailFormPopover -->
    <KtpDetailFormPopover
      v-model:opened="ktpPopoverOpened"
      :target="ktpPopoverTarget"
      :parent-id="props.journalId"
      :detail-to-edit="null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from "vue";
import { f7Icon } from "framework7-vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import KtpDetailFormPopover from "@/components/KtpDetailFormPopover.vue";
import { useCalendarStore } from "@/stores/calendarStore";
import { useStudentStore } from "@/stores/studentStore";

type MarkType = "date" | "pk" | "e" | "i";

interface Mark {
  type: MarkType;
  date?: string;
  values: Array<string | null>;
}

interface Student {
  id: number;
  name: string;
  marks: Mark[];
}

interface Props {
  journalId: string;
  currentJournal: any;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  "show-floating-row": [student: any, index: number];
  "open-date-focus": [header: { type: string; label: string }, index: number];
  "update-students": [students: Student[]];
  "open-ktp-details": [header: { type: string; label: string }, index: number];
}>();

const calendarStore = useCalendarStore();
const studentStore = useStudentStore();
const { getStudentFullName } = studentStore;

const editingCell = ref<{
  studentIndex: number;
  colIndex: number;
  markIndex: number;
} | null>(null);
const editedValue = ref("");

const currentEvent = computed(() => {
  if (!props.journalId) return null;
  return calendarStore.getEventById(props.journalId);
});

const generateDates = () => {
  if (currentEvent.value) {
    const startDate = new Date(currentEvent.value.startDate);
    const endDate = new Date(currentEvent.value.endDate);

    const dates: Mark[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = `${currentDate.getDate().toString().padStart(2, "0")}.${(
        currentDate.getMonth() + 1
      )
        .toString()
        .padStart(2, "0")}\n${currentDate.getFullYear()}`;
      dates.push({
        type: "date",
        date: dateStr,
        values: [null, null],
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    dates.push({ type: "pk", values: [null, null] });
    dates.push({ type: "e", values: [null, null] });
    dates.push({ type: "i", values: [null, null] });

    return dates;
  }

  return Array.from({ length: 17 }, () => ({
    type: "date" as const,
    date: "",
    values: [null, null],
  }));
};

const getMark = (studentIndex: number, colIndex: number, markIndex: number) => {
  const mark = students.value[studentIndex].marks[colIndex].values[markIndex];
  if (mark === null) return "";
  return String(mark ?? "");
};

const setMark = (
  studentIndex: number,
  colIndex: number,
  markIndex: number,
  value: string
) => {
  const newValue = value === "+" || value === "" ? null : value;
  students.value[studentIndex].marks[colIndex].values[markIndex] = newValue;
  emit("update-students", students.value);
};

const editCell = (
  studentIndex: number,
  colIndex: number,
  markIndex: number
) => {
  editingCell.value = { studentIndex, colIndex, markIndex };
  editedValue.value = getMark(studentIndex, colIndex, markIndex);
};

const confirmEdit = () => {
  if (!editingCell.value) return;
  const { studentIndex, colIndex, markIndex } = editingCell.value;
  setMark(studentIndex, colIndex, markIndex, editedValue.value);
  editingCell.value = null;
};

const cancelEdit = () => {
  editingCell.value = null;
};

const navigate = (direction: "up" | "down" | "left" | "right") => {
  if (!editingCell.value) return;

  const {
    studentIndex: startStudent,
    colIndex: startCol,
    markIndex: startMark,
  } = editingCell.value;
  setMark(startStudent, startCol, startMark, editedValue.value);
  editingCell.value = null;

  nextTick(() => {
    let nextStudent = startStudent;
    let nextCol = startCol;
    let nextMark = startMark;

    const numStudents = students.value.length;
    const numCols = visibleHeaders.value.length;

    switch (direction) {
      case "up":
        nextStudent -= 1;
        break;
      case "down":
        nextStudent += 1;
        break;
      case "right":
        if (nextMark === 0) {
          nextMark = 1;
        } else {
          nextMark = 0;
          nextCol += 1;
        }
        break;
      case "left":
        if (nextMark === 1) {
          nextMark = 0;
        } else {
          nextMark = 1;
          nextCol -= 1;
        }
        break;
    }

    if (nextStudent < 0) nextStudent = numStudents - 1;
    if (nextStudent >= numStudents) nextStudent = 0;
    if (nextCol < 0) nextCol = numCols - 1;
    if (nextCol >= numCols) nextCol = 0;

    editCell(nextStudent, nextCol, nextMark);
  });
};

const openDateFocus = (
  header: { type: string; label: string },
  index: number
) => {
  if (header.type !== "date") return;
  emit("open-date-focus", header, index);
};

const showFloatingRow = (student: any, index: number) => {
  emit("show-floating-row", student, index);
};

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && editingCell.value) {
    cancelEdit();
  }
};

const ktpPopoverOpened = ref(false);
const ktpPopoverTarget = ref("");

const onPaperclipClick = (
  header: { type: string; label: string },
  index: number
) => {
  ktpPopoverTarget.value = `#paperclip-${index}`;
  ktpPopoverOpened.value = true;
};

const getStudentAverageScore = (student: Student): string => {
  const allMarks: (string | null)[] = [];

  // Collect all marks from all columns
  student.marks.forEach((mark) => {
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
};

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

const tableHeaders = computed(() => {
  if (students.value.length === 0) return [];
  return students.value[0].marks.map((mark) => {
    if (mark.type === "date") {
      return { type: "date", label: mark.date || "" };
    }
    if (mark.type === "pk") {
      return { type: "pk", label: "РК" };
    }
    if (mark.type === "e") {
      return { type: "e", label: "Э" };
    }
    if (mark.type === "i") {
      return { type: "i", label: "И" };
    }
    return { type: "unknown", label: "" };
  });
});

const visibleHeaders = computed(() => {
  return tableHeaders.value
    .map((header, index) => ({ ...header, index }))
    .filter(
      (h) => h.type !== "date" || (h.label && String(h.label).trim() !== "")
    );
});

const visibleColumnIndices = computed(() => {
  return visibleHeaders.value.map((h) => h.index);
});

const students = ref<Student[]>([
  {
    id: 1,
    name: "Салкимбаев Саке",
    marks: generateDates(),
  },
]);

const updateStudent = (updatedStudent: any) => {
  if (!updatedStudent) return;
  const index = students.value.findIndex((s) => s.id === updatedStudent.id);
  if (index !== -1) {
    const newStudents = [...students.value];
    newStudents[index] = updatedStudent;
    students.value = newStudents;
    emit("update-students", students.value);
  }
};

const updateStudents = (updatedStudents: any[]) => {
  if (updatedStudents) {
    students.value = updatedStudents;
    emit("update-students", students.value);
  }
};

defineExpose({
  updateStudent,
  updateStudents,
  tableHeaders: computed(() => tableHeaders.value),
  students: computed(() => students.value),
});

onMounted(() => {
  if (props.currentJournal?.students?.length) {
    students.value = props.currentJournal.students.map(
      (student: string, index: number) => ({
        id: index + 1,
        name: getStudentFullName(student),
        marks: generateDates(),
      })
    );
  }

  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
});

watch(
  () => props.currentJournal,
  (newJournal) => {
    if (newJournal?.students?.length) {
      students.value = newJournal.students.map(
        (student: string, index: number) => ({
          id: index + 1,
          name: getStudentFullName(student),
          marks: generateDates(),
        })
      );
    }
  },
  { immediate: true }
);
</script>
