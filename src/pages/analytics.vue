<template>
  <f7-page
    name="analytics"
    class="analytics-page flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-32"
      >
        <div class="flex flex-col gap-4">
          <div
            class="flex flex-col md:flex-row md:items-center justify-between gap-3 analytics-page-header"
          >
            <div>
              <h1 class="text-2xl font-semibold">Аналитика</h1>
              <p class="text-sm text-muted-foreground">
                Успеваемость обучающихся
              </p>
            </div>
            <div class="flex items-center gap-3">
              <Select
                v-model="selectedAcademicYearModel"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-44"
              />
              <Select
                v-model="selectedSemesterId"
                :options="semesterOptions"
                placeholder="Семестр:"
                name="semester"
                class="w-44"
              />
            </div>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-5 shadow-md"
          >
            <!-- Report Configuration Section -->
            <div class="grid grid-cols-1 gap-4 mb-6">
              <Select
                v-model="selectedReportCategory"
                :options="reportCategoryOptions"
                placeholder="Категория:"
                name="report-category"
                class="w-full"
              />
            </div>

            <!-- Expandable Sections -->
            <Accordion>
              <AccordionItem id="specialties" :default-expanded="true">
                <template #title>Специальности:</template>
                <template #selected-item>
                  <span
                    v-if="selectedSpecialties.length > 0"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedSpecialties.length }} выбрано
                  </span>
                </template>
                <div class="flex flex-wrap items-center gap-2 md:gap-3">
                  <div
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedSpecialties.length === specialties.length &&
                        specialties.length > 0,
                    }"
                    @click="toggleSelectAllSpecialties"
                  >
                    <span class="font-medium">Все</span>
                    <f7-icon
                      v-if="
                        selectedSpecialties.length === specialties.length &&
                        specialties.length > 0
                      "
                      ios="f7:checkmark_circle_fill"
                      md="material:check_circle"
                      size="18px"
                      class="text-primary"
                    />
                  </div>
                  <div
                    v-for="specialty in specialties"
                    :key="specialty.id"
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedSpecialties.includes(specialty.code),
                    }"
                    @click="toggleSpecialtySelection(specialty.code)"
                  >
                    <span class="font-medium">
                      {{ specialty.codeName || specialty.name }}
                    </span>
                    <f7-icon
                      ios="f7:info_circle"
                      md="material:info"
                      size="18px"
                      :id="`specialty-item-${specialty.id}`"
                      class="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                      @click.stop="
                        handleSpecialtyInfoClick(
                          specialty,
                          `#specialty-item-${specialty.id}`
                        )
                      "
                    />
                  </div>
                  <div
                    v-if="specialties.length === 0"
                    class="text-muted-foreground"
                  >
                    Нет специальностей
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="courses" :default-expanded="true">
                <template #title>Курсы:</template>
                <template #selected-item>
                  <span
                    v-if="selectedCourses.length > 0"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedCourses.length }} выбрано
                  </span>
                </template>
                <div class="flex flex-wrap items-center gap-2 md:gap-3">
                  <button
                    class="w-fit flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedCourses.length === courseNumbers.length &&
                        courseNumbers.length > 0,
                    }"
                    @click="toggleSelectAllCourses"
                  >
                    <span class="font-medium">Все</span>
                    <f7-icon
                      v-if="
                        selectedCourses.length === courseNumbers.length &&
                        courseNumbers.length > 0
                      "
                      ios="f7:checkmark_circle_fill"
                      md="material:check_circle"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                  <button
                    v-for="course in courseNumbers"
                    :key="course"
                    @click="toggleCourseSelection(course)"
                    class="w-fit flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedCourses.includes(course),
                    }"
                  >
                    <span class="font-medium">{{ course }} курс</span>
                  </button>
                  <div
                    v-if="courseNumbers.length === 0"
                    class="text-muted-foreground"
                  >
                    Нет курсов
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="languages" :default-expanded="true">
                <template #title>Языки:</template>
                <template #selected-item>
                  <span
                    v-if="selectedLanguageGroups.length > 0"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedLanguageGroups.length }} выбрано
                  </span>
                </template>
                <div class="flex flex-wrap items-center gap-2 md:gap-3">
                  <div
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedLanguageGroups.length === languages.length &&
                        languages.length > 0,
                    }"
                    @click="toggleSelectAllLanguages"
                  >
                    <span class="font-medium">Все</span>
                    <f7-icon
                      v-if="
                        selectedLanguageGroups.length === languages.length &&
                        languages.length > 0
                      "
                      ios="f7:checkmark_circle_fill"
                      md="material:check_circle"
                      size="18px"
                      class="text-primary"
                    />
                  </div>
                  <div
                    v-for="language in languages"
                    :key="language.id"
                    class="flex items-center justify-between gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                    :class="{
                      'ring-2 ring-primary bg-primary/10':
                        selectedLanguageGroups.includes(language.code),
                    }"
                    @click="toggleLanguageSelection(language.code)"
                  >
                    <span class="font-medium">{{ language.name }}</span>
                    <f7-icon
                      v-if="selectedLanguageGroups.includes(language.code)"
                      ios="f7:checkmark_circle_fill"
                      md="material:check_circle"
                      size="18px"
                      class="text-primary"
                    />
                  </div>
                  <div
                    v-if="languages.length === 0"
                    class="text-muted-foreground"
                  >
                    Нет языков
                  </div>
                </div>
              </AccordionItem>

              <AccordionItem id="students" :default-expanded="true">
                <template #title>Обучающиеся:</template>
                <template #selected-item>
                  <span
                    v-if="selectedStudents.length > 0"
                    class="ml-2 text-xs md:text-sm px-2 py-1 rounded-md ring-2 ring-primary bg-primary/10"
                  >
                    {{ selectedStudents.length }} выбрано
                  </span>
                </template>
                <div class="overflow-y-auto border border-input rounded-lg">
                  <table class="w-full text-sm">
                    <thead class="sticky top-0 bg-card z-10">
                      <tr class="border-b border-input">
                        <th class="p-2 text-left w-12">
                          <f7-checkbox
                            :checked="isAllStudentsSelected"
                            @change="toggleSelectAllStudents"
                          />
                        </th>
                        <th class="p-2 text-left font-medium">Полное имя</th>
                        <th class="p-2 text-left font-medium">Курс</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr
                        v-for="student in filteredStudentsForAnalytics"
                        :key="student.id"
                        class="border-b border-input last:border-b-0 hover:bg-muted/50"
                      >
                        <td class="p-2">
                          <f7-checkbox
                            :checked="selectedStudents.includes(student.id)"
                            @change="toggleStudentSelection(student.id)"
                          />
                        </td>
                        <td class="p-2">{{ student.fullName }}</td>
                        <td class="p-2 text-center">{{ student.course }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div
                    v-if="filteredStudentsForAnalytics.length === 0"
                    class="p-4 text-center text-muted-foreground"
                  >
                    Нет обучающихся, соответствующих фильтрам
                  </div>
                </div>
              </AccordionItem>
            </Accordion>

            <!-- Action Buttons -->
            <div
              class="flex justify-end gap-3 mt-6 pt-4 border-t border-border"
            >
              <f7-button
                small
                default
                @click="resetFilters"
                class="bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
              >
                <f7-icon
                  ios="f7:arrow_clockwise"
                  md="material:refresh"
                  size="16px"
                  class="mr-2"
                />
                Сбросить
              </f7-button>
              <f7-button
                small
                default
                @click="generateReport"
                class="bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <f7-icon
                  ios="f7:chart_bar"
                  md="material:analytics"
                  size="16px"
                  class="mr-2"
                />
                Создать отчет
              </f7-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <f7-popover
      class="specialty-info-popover"
      :arrow="true"
      close-on-escape
      style="width: 320px !important"
    >
      <div
        v-if="selectedSpecialtyInfo"
        class="bg-card text-card-foreground p-4"
      >
        <div class="space-y-3">
          <div>
            <h3 class="font-semibold text-lg text-foreground mb-1">
              {{ selectedSpecialtyInfo.name }}
            </h3>
            <p class="text-sm text-muted-foreground font-medium">
              {{ selectedSpecialtyInfo.codeName }}
            </p>
          </div>

          <div class="border-t border-border pt-3">
            <p class="text-sm text-foreground leading-relaxed">
              {{
                selectedSpecialtyInfo.details ||
                "Дополнительная информация отсутствует."
              }}
            </p>
          </div>
        </div>
      </div>
    </f7-popover>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  f7Page,
  f7Icon,
  f7Button,
  f7,
  f7Popover,
  f7Checkbox,
} from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Select from "@/components/ui/Select.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useCourseStore } from "@/stores/courseStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { storeToRefs } from "pinia";
import { f7Accordion } from "framework7-vue";
import { useLanguageStore } from "@/stores/languageStore";
import { useStudentStore } from "@/stores/studentStore";

const activeNavItem = ref("analytics");

const academicYearStore = useAcademicYearStore();
const semesterStore = useSemesterStore();
const courseStore = useCourseStore();
const specialtyStore = useSpecialtyStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const selectedItemsStore = useSelectedItemsStore();
const languageStore = useLanguageStore();
const studentStore = useStudentStore();

const { academicYears } = storeToRefs(academicYearStore);
const { sortedSemesters } = storeToRefs(semesterStore);
const { courses } = storeToRefs(courseStore);
const { specialties } = storeToRefs(specialtyStore);
const { languages } = storeToRefs(languageStore);
const { students } = storeToRefs(studentStore);

const selectedReportType = ref("");
const selectedReportCategory = ref("");
const selectedSemesterId = ref("");

const selectedSpecialties = ref<string[]>([]);
const selectedCourses = ref<string[]>([]);
const selectedLanguageGroups = ref<string[]>([]);
const selectedSpecialtyInfo = ref<any>(null);
const selectedStudents = ref<string[]>([]);

const reportTypeOptions = [
  { value: "student-performance", text: "Успеваемость обучающихся" },
  { value: "attendance", text: "Посещаемость" },
  { value: "grades", text: "Оценки" },
];

const reportCategoryOptions = [
  { value: "final", text: "Итоговые" },
  { value: "current", text: "Текущие" },
  { value: "intermediate", text: "Промежуточные" },
];

const selectedAcademicYearModel = computed({
  get: () => selectedItemsStore.selectedAcademicYearId ?? "",
  set: (v: string) => {
    selectedItemsStore.setSelectedAcademicYear(v || null);
    if (v !== (selectedItemsStore.selectedAcademicYearId ?? "")) {
      selectedSemesterId.value = "";
    }
  },
});

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

const semesterOptions = computed(() => {
  const yearId = selectedItemsStore.selectedAcademicYearId;
  const list = yearId
    ? academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(yearId)
    : [];
  return list.map((ays) => ({
    value: ays.id,
    text: `Семестр ${ays.semesterNumber}`,
  }));
});

const courseNumbers = computed(() => {
  return courses.value.map((course) => course.number).sort();
});

const filteredStudentsForAnalytics = computed(() => {
  return students.value
    .map((s) => ({
      id: s.id,
      fullName: studentStore.getStudentFullName(s.id),
      course: studentStore.getCourseByStudentId(s.id) ?? 0,
    }))
    .filter((s) => {
      if (selectedSpecialties.value.length === 0) return true;
      const student = students.value.find((st) => st.id === s.id);
      return student && selectedSpecialties.value.includes(student.specialty);
    })
    .filter((s) => {
      if (selectedCourses.value.length === 0) return true;
      return selectedCourses.value.includes(String(s.course));
    })
    .filter((s) => {
      if (selectedLanguageGroups.value.length === 0) return true;
      const student = students.value.find((st) => st.id === s.id);
      return student && selectedLanguageGroups.value.includes(student.language);
    });
});

const isAllStudentsSelected = computed(() => {
  return (
    filteredStudentsForAnalytics.value.length > 0 &&
    selectedStudents.value.length === filteredStudentsForAnalytics.value.length
  );
});

const toggleSelectAllStudents = () => {
  if (isAllStudentsSelected.value) {
    selectedStudents.value = [];
  } else {
    filteredStudentsForAnalytics.value.forEach((student) =>
      selectedStudents.value.push(student.id)
    );
  }
};

const toggleStudentSelection = (studentId: string) => {
  const index = selectedStudents.value.indexOf(studentId);
  if (index > -1) {
    selectedStudents.value.splice(index, 1);
  } else {
    selectedStudents.value.push(studentId);
  }
};

const toggleCourseSelection = (courseNumber: string) => {
  const index = selectedCourses.value.indexOf(courseNumber);
  if (index > -1) {
    selectedCourses.value.splice(index, 1);
  } else {
    selectedCourses.value.push(courseNumber);
  }
};

const toggleSelectAllCourses = () => {
  if (
    selectedCourses.value.length === courseNumbers.value.length &&
    courseNumbers.value.length > 0
  ) {
    selectedCourses.value = [];
  } else {
    selectedCourses.value = courseNumbers.value;
  }
};

const toggleSpecialtySelection = (specialtyCode: string) => {
  const index = selectedSpecialties.value.indexOf(specialtyCode);
  if (index > -1) {
    selectedSpecialties.value.splice(index, 1);
  } else {
    selectedSpecialties.value.push(specialtyCode);
  }
};

const toggleSelectAllSpecialties = () => {
  if (
    selectedSpecialties.value.length === specialties.value.length &&
    specialties.value.length > 0
  ) {
    selectedSpecialties.value = [];
  } else {
    selectedSpecialties.value = specialties.value.map((s) => s.code);
  }
};

const toggleLanguageSelection = (languageCode: string) => {
  const index = selectedLanguageGroups.value.indexOf(languageCode);
  if (index > -1) {
    selectedLanguageGroups.value.splice(index, 1);
  } else {
    selectedLanguageGroups.value.push(languageCode);
  }
};

const toggleSelectAllLanguages = () => {
  if (
    selectedLanguageGroups.value.length === languages.value.length &&
    languages.value.length > 0
  ) {
    selectedLanguageGroups.value = [];
  } else {
    selectedLanguageGroups.value = languages.value.map((l) => l.code);
  }
};

const handleSpecialtyInfoClick = (specialty: any, iconId: string) => {
  selectedSpecialtyInfo.value = specialty;
  f7.popover.open(".specialty-info-popover", iconId);
};

const resetFilters = () => {
  selectedReportType.value = "";
  selectedReportCategory.value = "";
  selectedItemsStore.setSelectedAcademicYear(null);
  selectedSemesterId.value = "";
  selectedSpecialties.value = [];
  selectedCourses.value = [];
  selectedLanguageGroups.value = [];
  selectedStudents.value = [];
};

const generateReport = () => {
  const filters = {
    reportType: selectedReportType.value,
    reportCategory: selectedReportCategory.value,
    semester: selectedSemesterId.value,
    academicYear: selectedItemsStore.selectedAcademicYearId,
    specialties: selectedSpecialties.value,
    courses: selectedCourses.value,
    languageGroups: selectedLanguageGroups.value,
    students: selectedStudents.value,
  };

  console.log("Generating report with filters:", filters);
};

onMounted(async () => {
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (activeYear) {
    selectedItemsStore.setSelectedAcademicYear(activeYear.id);
  }

  selectedReportType.value = "student-performance";
  selectedReportCategory.value = "final";

  f7.on("popoverClosed", (popover) => {
    if (popover.el.classList.contains("specialty-info-popover")) {
      selectedSpecialtyInfo.value = null;
    }
  });
});
</script>

<style>
.analytics-page-header .smart-select-list-container {
  background-color: hsl(var(--card)) !important;
}

.analytics-page-header .smart-select-list-container .item-inner {
  background-color: hsl(var(--card)) !important;
}

.specialty-info-popover.popover {
  margin-top: -160px !important;
}
</style>
