<template>
  <f7-page
    name="journal-details"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-4">
          <!-- Page Header -->
          <div class="flex items-center justify-between">
            <div class="text-xl font-semibold">
              <p>
                Модуль/дисциплина:
                <span class="text-green-600">{{
                  currentJournal?.title || "Загрузка..."
                }}</span>
              </p>
              <p>
                Учебная группа:
                <span class="text-green-600">{{
                  currentJournal?.groupId || "Загрузка..."
                }}</span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Select
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-[250px]"
              />
            </div>
          </div>

          <!-- Main Content Area (Table/Grid) -->
          <div
            class="bg-card text-card-foreground rounded-xl p-3 md:p-4 shadow-sm"
          >
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-muted/50">
                    <th
                      class="p-2 text-left w-12 border-r border-border align-top"
                    >
                      №
                    </th>
                    <th
                      class="p-2 text-left w-64 border-r border-border align-top"
                    >
                      Обучающийся
                    </th>
                    <!-- Dynamic date columns -->
                    <th
                      v-for="(header, index) in tableHeaders"
                      :key="index"
                      class="px-1 py-2 text-center text-xs border-r border-border w-16 cursor-pointer hover:bg-muted"
                      @click="openDateFocus(header, index)"
                    >
                      <span
                        v-html="header.label.replace('\\n', '<br/>')"
                      ></span>
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
                      {{ student.name }}
                    </td>
                    <td
                      v-for="(mark, colIndex) in student.marks"
                      :key="colIndex"
                      class="px-1 py-2 text-center border-r border-border"
                    >
                      <div class="flex flex-col gap-1">
                        <div
                          class="h-8 flex items-center justify-center transition-transform duration-300"
                          :class="{
                            'scale-175 z-10':
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === colIndex &&
                              editingCell?.markIndex === 0,
                          }"
                        >
                          <EditableMarkCell
                            v-if="
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === colIndex &&
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
                            @click="editCell(studentIndex, colIndex, 0)"
                            class="cursor-pointer w-full"
                          >
                            <MarkCell :mark="mark.values[0]" />
                          </div>
                        </div>
                        <div
                          class="h-8 flex items-center justify-center transition-transform duration-300"
                          :class="{
                            'scale-175 z-10':
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === colIndex &&
                              editingCell?.markIndex === 1,
                          }"
                        >
                          <EditableMarkCell
                            v-if="
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === colIndex &&
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
                            @click="editCell(studentIndex, colIndex, 1)"
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
        </div>
      </div>
    </div>
    <FloatingJournalRow
      :student="selectedStudent"
      :student-index="selectedStudentIndex"
      :table-headers="tableHeaders"
      @close="hideFloatingRow"
      @update-student="updateStudent"
    />
    <DateColumnFocus
      :visible="isDateFocusVisible"
      :students="students"
      :column-header="focusedColumnHeader"
      :selected-date-index="focusedDateIndex"
      @close="isDateFocusVisible = false"
      @update-students="updateStudents"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted, watch } from "vue";
import { f7Page } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useCalendarStore } from "@/stores/calendarStore";
import { useJournalStore } from "@/stores/journalStore";
import Select from "@/components/ui/Select.vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import FloatingJournalRow from "@/components/FloatingJournalRow.vue";
import DateColumnFocus from "@/components/DateColumnFocus.vue";
import { storeToRefs } from "pinia";

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

interface JournalDetailsProps {
  f7route: any;
}

const props = defineProps<JournalDetailsProps>();

const journalId = computed(() => props.f7route.params.id as string);

const activeNavItem = ref("journal-details");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const calendarStore = useCalendarStore();
const journalStore = useJournalStore();
const { getJournalById } = storeToRefs(journalStore);

const selectedAcademicYear = ref("");

const academicYearOptions = computed(() =>
  academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }))
);

const currentJournal = computed(() => {
  if (!journalId.value) return null;
  return journalStore.getJournalById(journalId.value);
});

const currentEvent = computed(() => {
  if (!journalId.value) return null;
  return calendarStore.getEventById(journalId.value);
});

const selectedStudent = ref<any>(null);
const selectedStudentIndex = ref(0);

const isDateFocusVisible = ref(false);
const focusedColumnHeader = ref<{ type: string; label: string } | null>(null);
const focusedDateIndex = ref(0);

const editingCell = ref<{
  studentIndex: number;
  colIndex: number;
  markIndex: number;
} | null>(null);
const editedValue = ref("");

const generateDates = () => {
  // If we have a current event, use its start and end dates
  if (currentEvent.value) {
    const startDate = new Date(currentEvent.value.startDate);
    const endDate = new Date(currentEvent.value.endDate);

    const dates: Mark[] = [];
    const currentDate = new Date(startDate);

    // Generate date columns
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

      // Increment to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Add special columns (PK, E, I)
    dates.push({ type: "pk", values: [null, null] });
    dates.push({ type: "e", values: [null, null] });
    dates.push({ type: "i", values: [null, null] });

    return dates;
  }

  // Fallback if no journal data available
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
    const numCols = tableHeaders.value.length;

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
  focusedColumnHeader.value = header;
  focusedDateIndex.value = index;
  isDateFocusVisible.value = true;
};

const showFloatingRow = (student: any, index: number) => {
  selectedStudent.value = student;
  selectedStudentIndex.value = index;
};

const hideFloatingRow = () => {
  selectedStudent.value = null;
};

const updateStudents = (updatedStudents: any[]) => {
  if (updatedStudents) {
    students.value = updatedStudents;
  }
};

const updateStudent = (updatedStudent: any) => {
  if (!updatedStudent) return;
  const index = students.value.findIndex((s) => s.id === updatedStudent.id);
  if (index !== -1) {
    const newStudents = [...students.value];
    newStudents[index] = updatedStudent;
    students.value = newStudents;
  }
};

onMounted(async () => {
  if (academicYearStore.academicYears.length === 0) {
    await academicYearStore.fetchAcademicYears();
  }

  selectedAcademicYear.value =
    academicYearStore.getActiveAcademicYear?.id || "";

  await calendarStore.fetchEvents();
  await journalStore.fetchJournals();

  // Generate student list based on participants from the journal
  if (currentJournal.value?.students?.length) {
    students.value = currentJournal.value.students.map(
      (student: string, index: number) => ({
        id: index + 1,
        name: student,
        marks: generateDates(),
      })
    );
  }

  window.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleGlobalKeydown);
});

const handleGlobalKeydown = (event: KeyboardEvent) => {
  if (event.key === "Escape" && editingCell.value) {
    cancelEdit();
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

const students = ref<Student[]>([
  {
    id: 1,
    name: "Салкимбаев Саке",
    marks: generateDates(),
  },
]);

watch(
  () => currentJournal.value,
  (newJournal) => {
    if (newJournal?.students?.length) {
      students.value = newJournal.students.map(
        (student: string, index: number) => ({
          id: index + 1,
          name: student,
          marks: generateDates(),
        })
      );
    }
  },
  { immediate: true }
);
</script>
