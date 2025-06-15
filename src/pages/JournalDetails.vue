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
              <p>Модуль/дисциплина: <span class="text-green-600">ОДД7 - История Казахстана</span></p>
              <p>Учебная группа: <span class="text-green-600">1 курс ФКРХТ</span></p>
            </div>
            <div class="flex items-center gap-2">
              <SmartSelect
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
                    <th class="p-2 text-left w-12 border-r border-border align-top">№</th>
                    <th class="p-2 text-left w-64 border-r border-border align-top">Обучающийся</th>
                    <!-- Dynamic date columns -->
                    <th v-for="(date, index) in dates" :key="date" class="px-1 py-2 text-center text-xs border-r border-border w-16 cursor-pointer hover:bg-muted" @click="openDateFocus(date, index)">
                      {{ date.split('\n')[0] }}<br/>{{ date.split('\n')[1] }}
                    </th>
                    <th class="px-2 py-2 text-center text-xs border-r border-border w-16 align-top">РК</th>
                    <th class="px-2 py-2 text-center text-xs border-r border-border w-16 align-top">Э</th>
                    <th class="px-2 py-2 text-center text-xs w-16 align-top">И</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(student, studentIndex) in students" :key="student.id" class="border-b border-border">
                    <td class="px-2 py-2 text-center border-r border-border text-sm align-top">{{ studentIndex + 1 }}</td>
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
                            <MarkCell :mark="mark[0]" />
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
                            <MarkCell :mark="mark[1]" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-1 py-2 text-center border-r border-border">
                      <div class="flex flex-col gap-1">
                        <div
                          class="h-8 flex items-center justify-center transition-transform duration-300"
                          :class="{
                            'scale-175 z-10':
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length &&
                              editingCell?.markIndex === 0,
                          }"
                        >
                          <EditableMarkCell
                            v-if="
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length &&
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
                            @click="editCell(studentIndex, dates.length, 0)"
                            class="cursor-pointer w-full"
                          >
                            <MarkCell :mark="student.pk_mark[0]" />
                          </div>
                        </div>
                        <div
                          class="h-8 flex items-center justify-center transition-transform duration-300"
                          :class="{
                            'scale-175 z-10':
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length &&
                              editingCell?.markIndex === 1,
                          }"
                        >
                          <EditableMarkCell
                            v-if="
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length &&
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
                            @click="editCell(studentIndex, dates.length, 1)"
                            class="cursor-pointer w-full"
                          >
                            <MarkCell :mark="student.pk_mark[1]" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-1 py-2 text-center border-r border-border">
                      <div class="flex flex-col gap-1">
                        <div
                          class="h-8 flex items-center justify-center transition-transform duration-300"
                          :class="{
                            'scale-175 z-10':
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length + 1 &&
                              editingCell?.markIndex === 0,
                          }"
                        >
                          <EditableMarkCell
                            v-if="
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length + 1 &&
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
                            @click="editCell(studentIndex, dates.length + 1, 0)"
                            class="cursor-pointer w-full"
                          >
                            <MarkCell :mark="student.e_mark[0]" />
                          </div>
                        </div>
                        <div
                          class="h-8 flex items-center justify-center transition-transform duration-300"
                          :class="{
                            'scale-175 z-10':
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length + 1 &&
                              editingCell?.markIndex === 1,
                          }"
                        >
                          <EditableMarkCell
                            v-if="
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length + 1 &&
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
                            @click="editCell(studentIndex, dates.length + 1, 1)"
                            class="cursor-pointer w-full"
                          >
                            <MarkCell :mark="student.e_mark[1]" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-1 py-2 text-center">
                      <div class="flex flex-col gap-1">
                        <div
                          class="h-8 flex items-center justify-center transition-transform duration-300"
                          :class="{
                            'scale-175 z-10':
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length + 2 &&
                              editingCell?.markIndex === 0,
                          }"
                        >
                          <EditableMarkCell
                            v-if="
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length + 2 &&
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
                            @click="editCell(studentIndex, dates.length + 2, 0)"
                            class="cursor-pointer w-full"
                          >
                            <MarkCell :mark="student.i_mark[0]" />
                          </div>
                        </div>
                        <div
                          class="h-8 flex items-center justify-center transition-transform duration-300"
                          :class="{
                            'scale-175 z-10':
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length + 2 &&
                              editingCell?.markIndex === 1,
                          }"
                        >
                          <EditableMarkCell
                            v-if="
                              editingCell?.studentIndex === studentIndex &&
                              editingCell?.colIndex === dates.length + 2 &&
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
                            @click="editCell(studentIndex, dates.length + 2, 1)"
                            class="cursor-pointer w-full"
                          >
                            <MarkCell :mark="student.i_mark[1]" />
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
      :dates="dates"
      @close="hideFloatingRow"
      @update-student="updateStudent"
    />
    <DateColumnFocus
      :visible="isDateFocusVisible"
      :students="students"
      :date="focusedDate"
      :selected-date-index="focusedDateIndex"
      @close="isDateFocusVisible = false"
      @update-students="updateStudents"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, nextTick, onUnmounted } from "vue";
import { f7Page } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import SmartSelect from "@/components/ui/SmartSelect.vue";
import MarkCell from "@/components/ui/MarkCell.vue";
import EditableMarkCell from "@/components/ui/EditableMarkCell.vue";
import FloatingJournalRow from "@/components/FloatingJournalRow.vue";
import DateColumnFocus from "@/components/DateColumnFocus.vue";
import { storeToRefs } from "pinia";

const activeNavItem = ref("journal-details");

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);
const selectedAcademicYear = ref("");

const academicYearOptions = computed(() =>
  academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }))
);

const selectedStudent = ref<any>(null);
const selectedStudentIndex = ref(0);

const isDateFocusVisible = ref(false);
const focusedDate = ref("");
const focusedDateIndex = ref(0);

const editingCell = ref<{
  studentIndex: number;
  colIndex: number;
  markIndex: number;
} | null>(null);
const editedValue = ref("");

const getMark = (
  studentIndex: number,
  colIndex: number,
  markIndex: number
) => {
  const student = students.value[studentIndex];
  let mark;
  if (colIndex < dates.value.length) {
    mark = student.marks[colIndex][markIndex];
  } else if (colIndex === dates.value.length) {
    mark = student.pk_mark[markIndex];
  } else if (colIndex === dates.value.length + 1) {
    mark = student.e_mark[markIndex];
  } else if (colIndex === dates.value.length + 2) {
    mark = student.i_mark[markIndex];
  }
  if (mark === null) return "";
  return String(mark ?? "");
};

const setMark = (
  studentIndex: number,
  colIndex: number,
  markIndex: number,
  value: string
) => {
  const student = students.value[studentIndex];
  const newValue = value === "+" || value === "" ? null : value;
  if (colIndex < dates.value.length) {
    student.marks[colIndex][markIndex] = newValue;
  } else if (colIndex === dates.value.length) {
    student.pk_mark[markIndex] = newValue;
  } else if (colIndex === dates.value.length + 1) {
    student.e_mark[markIndex] = newValue;
  } else if (colIndex === dates.value.length + 2) {
    student.i_mark[markIndex] = newValue;
  }
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
    const numCols = dates.value.length + 3;

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

const openDateFocus = (date: string, index: number) => {
  focusedDate.value = date.split("\n")[0];
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
  selectedAcademicYear.value = academicYearStore.getActiveAcademicYear?.id || "";
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

const dates = ref<string[]>(
  Array.from({ length: 15 }, (_, i) => {
    const day = (27 + i).toString().padStart(2, "0");
    return `27.01\n2025`;
  })
);

const students = ref([
  {
    id: 1,
    name: "Салкимбаев Саке",
    marks: [
      ["90", "90"],
      ["90", "90"],
      ["90", null],
      ["90", null],
      ["90", null],
      [null, null],
      ["90", null],
      [null, null],
      ["90", "90"],
      [null, null],
      [null, null],
      [null, null],
      [null, null],
      [null, null],
      [null, null],
    ],
    pk_mark: ["90", null],
    e_mark: ["", ""],
    i_mark: ["", ""],
  },
  {
    id: 2,
    name: "Салкимбаев Саке",
    marks: Array.from({ length: 15 }, () => [null, null]),
    pk_mark: [null, null],
    e_mark: [null, null],
    i_mark: [null, null],
  },
  {
    id: 3,
    name: "Салкимбаев Саке",
    marks: Array.from({ length: 15 }, () => [null, null]),
    pk_mark: [null, null],
    e_mark: [null, null],
    i_mark: [null, null],
  },
  {
    id: 4,
    name: "Салкимбаев Саке",
    marks: Array.from({ length: 15 }, () => [null, null]),
    pk_mark: [null, null],
    e_mark: [null, null],
    i_mark: [null, null],
  },
  {
    id: 5,
    name: "Салкимбаев Саке",
    marks: Array.from({ length: 15 }, () => [null, null]),
    pk_mark: [null, null],
    e_mark: [null, null],
    i_mark: [null, null],
  },
]);
</script> 