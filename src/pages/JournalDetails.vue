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
                    <td v-for="(mark, markIndex) in student.marks" :key="markIndex" class="px-1 py-2 text-center border-r border-border">
                      <div class="flex flex-col gap-1">
                        <MarkCell :mark="mark[0]" />
                        <MarkCell :mark="mark[1]" />
                      </div>
                    </td>
                    <td class="px-1 py-2 text-center border-r border-border">
                      <div class="flex flex-col gap-1">
                        <MarkCell :mark="student.pk_mark[0]" />
                        <MarkCell :mark="student.pk_mark[1]" />
                      </div>
                    </td>
                    <td class="px-1 py-2 text-center border-r border-border">
                       <div class="flex flex-col gap-1">
                        <MarkCell :mark="student.e_mark[0]" />
                        <MarkCell :mark="student.e_mark[1]" />
                      </div>
                    </td>
                    <td class="px-1 py-2 text-center">
                       <div class="flex flex-col gap-1">
                        <MarkCell :mark="student.i_mark[0]" />
                        <MarkCell :mark="student.i_mark[1]" />
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
import { ref, onMounted, computed } from "vue";
import { f7Page } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import SmartSelect from "@/components/ui/SmartSelect.vue";
import MarkCell from "@/components/ui/MarkCell.vue";
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

const openDateFocus = (date: string, index: number) => {
  focusedDate.value = date.split('\n')[0];
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
});

const dates = ref<string[]>(
  Array.from({ length: 15 }, (_, i) => {
    const day = (27 + i).toString().padStart(2, '0');
    return `27.01\n2025`;
  })
);

const students = ref([
  {
    id: 1,
    name: "Салкимбаев Саке",
    marks: [
      ["90", "90"], ["90", "90"], ["90", "+"], ["90", "+"], ["90", "+"],
      ["+", "+"], ["90", "+"], ["+", "+"], ["90", "90"], ["+", "+"],
      ["+", "+"], ["+", "+"], ["+", "+"], ["+", "+"], ["+", "+"],
    ],
    pk_mark: ["90", "+"],
    e_mark: ["", ""],
    i_mark: ["", ""],
  },
  {
    id: 2,
    name: "Салкимбаев Саке",
    marks: Array(15).fill(["+", "+"]),
    pk_mark: ["", ""], e_mark: ["", ""], i_mark: ["", ""],
  },
  {
    id: 3,
    name: "Салкимбаев Саке",
    marks: Array(15).fill(["+", "+"]),
    pk_mark: ["", ""], e_mark: ["", ""], i_mark: ["", ""],
  },
  {
    id: 4,
    name: "Салкимбаев Саке",
    marks: Array(15).fill(["+", "+"]),
    pk_mark: ["", ""], e_mark: ["", ""], i_mark: ["", ""],
  },
  {
    id: 5,
    name: "Салкимбаев Саке",
    marks: Array(15).fill(["+", "+"]),
    pk_mark: ["", ""], e_mark: ["", ""], i_mark: ["", ""],
  },
]);
</script> 