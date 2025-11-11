<template>
  <div class="flex flex-col gap-4">
    <!-- Filters Section -->
    <div v-if="showFilters" class="flex flex-col gap-3">
      <!-- Search -->
      <div class="flex gap-2">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Поиск по ФИО..."
          class="flex-1 px-4 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      <!-- Filters Row -->
      <div class="flex flex-wrap gap-2">
        <!-- Academic Year Filter -->
        <Select
          v-model="selectedAcademicYearId"
          :options="academicYearOptions"
          placeholder="Учебный год"
          class="min-w-[150px]"
        />

        <!-- Gender Filter -->
        <Select
          v-model="selectedGender"
          :options="genderOptions"
          placeholder="Пол"
          class="min-w-[120px]"
        />

        <!-- Specialty Filter -->
        <Select
          v-model="selectedSpecialty"
          :options="specialtyOptions"
          placeholder="Специальность"
          class="min-w-[200px]"
        />

        <!-- Language Filter -->
        <Select
          v-model="selectedLanguage"
          :options="languageOptions"
          placeholder="Язык"
          class="min-w-[120px]"
        />

        <!-- Course Filter -->
        <Select
          v-model="selectedCourse"
          :options="courseOptions"
          placeholder="Курс"
          class="min-w-[100px]"
        />

        <!-- Base Filter -->
        <Select
          v-model="selectedBase"
          :options="baseOptions"
          placeholder="Основа"
          class="min-w-[100px]"
        />

        <!-- Clear Filters Button -->
        <button
          v-if="hasActiveFilters"
          @click="clearFilters"
          class="px-3 py-2 text-sm text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Очистить
        </button>
      </div>
    </div>

    <!-- Results Count -->
    <div v-if="showFilters" class="text-sm text-muted-foreground">
      Найдено: {{ filteredStudents.length }} из {{ totalStudents }}
    </div>

    <!-- Students Table -->
    <div class="overflow-x-auto rounded-lg border border-border">
      <table class="w-full border-collapse">
        <thead>
          <tr class="bg-gray-500 text-white">
            <th v-if="showRowNumber" class="px-4 py-3 text-left text-sm font-semibold">
              №
            </th>
            <th class="px-4 py-3 text-left text-sm font-semibold">ФИО</th>
            <th v-if="showSpecialty" class="px-4 py-3 text-left text-sm font-semibold">
              Специальность
            </th>
            <th v-if="showLanguage" class="px-4 py-3 text-left text-sm font-semibold">
              Язык
            </th>
            <th v-if="showCourse" class="px-4 py-3 text-left text-sm font-semibold">
              Курс
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-if="filteredStudents.length === 0"
            class="border-b border-border"
          >
            <td
              :colspan="columnCount"
              class="px-4 py-8 text-center text-muted-foreground"
            >
              {{ emptyMessage }}
            </td>
          </tr>
          <tr
            v-for="(student, index) in filteredStudents"
            :key="student.id"
            :class="[
              'border-b border-border transition-colors',
              student.gender === 'male' ? 'bg-blue-100' : 'bg-pink-100',
              clickable ? 'cursor-pointer hover:bg-muted/30' : '',
            ]"
            @click="onStudentClick(student)"
          >
            <td v-if="showRowNumber" class="px-4 py-3 text-sm">
              {{ index + 1 }}
            </td>
            <td class="px-4 py-3 text-sm">
              {{ student.fullName }}
            </td>
            <td v-if="showSpecialty" class="px-4 py-3 text-sm">
              {{ student.specialtyName }}
            </td>
            <td v-if="showLanguage" class="px-4 py-3 text-sm">
              {{ student.language }}
            </td>
            <td v-if="showCourse" class="px-4 py-3 text-sm">
              {{ student.course }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import Select from "@/components/ui/Select.vue";
import type { Student } from "@/types/student";

interface Props {
  studentIds: string[];
  showFilters?: boolean;
  showRowNumber?: boolean;
  showCourse?: boolean;
  showSpecialty?: boolean;
  showLanguage?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showFilters: true,
  showRowNumber: true,
  showCourse: true,
  showSpecialty: true,
  showLanguage: true,
  clickable: true,
});

const emit = defineEmits<{
  "student-click": [student: Student];
}>();

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const academicYearStore = useAcademicYearStore();

// Filter state
const searchTerm = ref("");
const selectedAcademicYearId = ref("");
const selectedGender = ref("");
const selectedSpecialty = ref("");
const selectedLanguage = ref("");
const selectedCourse = ref("");
const selectedBase = ref("");

// Get base student data
const baseStudents = computed(() => {
  return props.studentIds
    .map((id) => studentStore.students.find((s) => s.id === id))
    .filter((s): s is Student => s !== undefined);
});

const totalStudents = computed(() => baseStudents.value.length);

// Enrich students with computed data
const enrichedStudents = computed(() => {
  return baseStudents.value.map((student) => {
    const specialty = specialtyStore.getSpecialtyById(student.specialty);
    const course = studentStore.getCourseByStudentId(student.id);

    return {
      ...student,
      fullName: `${student.surname} ${student.firstName} ${student.patronymic}`.trim(),
      specialtyName: specialty?.codeName || "—",
      course: course || "—",
    };
  });
});

// Apply filters
const filteredStudents = computed(() => {
  let result = enrichedStudents.value;

  // Search by FIO
  if (searchTerm.value.trim()) {
    const term = searchTerm.value.toLowerCase().trim();
    result = result.filter((s) =>
      s.fullName.toLowerCase().includes(term)
    );
  }

  // Filter by academic year
  if (selectedAcademicYearId.value) {
    result = result.filter((s) => s.academicYearId === selectedAcademicYearId.value);
  }

  // Filter by gender
  if (selectedGender.value) {
    result = result.filter((s) => s.gender === selectedGender.value);
  }

  // Filter by specialty
  if (selectedSpecialty.value) {
    result = result.filter((s) => s.specialty === selectedSpecialty.value);
  }

  // Filter by language
  if (selectedLanguage.value) {
    result = result.filter((s) => s.language === selectedLanguage.value);
  }

  // Filter by course
  if (selectedCourse.value) {
    const course = studentStore.getCourseByStudentId;
    result = result.filter((s) => {
      const studentCourse = studentStore.getCourseByStudentId(s.id);
      return studentCourse?.toString() === selectedCourse.value;
    });
  }

  // Filter by base
  if (selectedBase.value) {
    result = result.filter((s) => s.base?.toString() === selectedBase.value);
  }

  return result;
});

// Column count for colspan
const columnCount = computed(() => {
  let count = 1; // ФИО always shown
  if (props.showRowNumber) count++;
  if (props.showSpecialty) count++;
  if (props.showLanguage) count++;
  if (props.showCourse) count++;
  return count;
});

// Filter options
const academicYearOptions = computed(() => {
  const years = academicYearStore.academicYears || [];
  return [
    { value: "", text: "Все годы" },
    ...years.map((y) => ({
      value: y.id,
      text: y.name,
    })),
  ];
});

const genderOptions = [
  { value: "", text: "Все" },
  { value: "male", text: "Мужской" },
  { value: "female", text: "Женский" },
];

const specialtyOptions = computed(() => {
  const specialties = specialtyStore.specialties || [];
  return [
    { value: "", text: "Все специальности" },
    ...specialties.map((s) => ({
      value: s.id,
      text: s.codeName,
    })),
  ];
});

const languageOptions = computed(() => {
  // Get unique languages from students
  const languages = new Set(
    baseStudents.value.map((s) => s.language).filter(Boolean)
  );
  return [
    { value: "", text: "Все языки" },
    ...Array.from(languages).map((lang) => ({
      value: lang,
      text: lang,
    })),
  ];
});

const courseOptions = [
  { value: "", text: "Все курсы" },
  { value: "1", text: "1 курс" },
  { value: "2", text: "2 курс" },
  { value: "3", text: "3 курс" },
  { value: "4", text: "4 курс" },
];

const baseOptions = [
  { value: "", text: "Все основы" },
  { value: "9", text: "9 класс" },
  { value: "11", text: "11 класс" },
];

const hasActiveFilters = computed(() => {
  return (
    searchTerm.value.trim() !== "" ||
    selectedAcademicYearId.value !== "" ||
    selectedGender.value !== "" ||
    selectedSpecialty.value !== "" ||
    selectedLanguage.value !== "" ||
    selectedCourse.value !== "" ||
    selectedBase.value !== ""
  );
});

const emptyMessage = computed(() => {
  if (props.studentIds.length === 0) {
    return "Нет студентов в журнале";
  }
  if (hasActiveFilters.value) {
    return "Не найдено студентов по заданным фильтрам";
  }
  return "Нет студентов";
});

const clearFilters = () => {
  searchTerm.value = "";
  selectedAcademicYearId.value = "";
  selectedGender.value = "";
  selectedSpecialty.value = "";
  selectedLanguage.value = "";
  selectedCourse.value = "";
  selectedBase.value = "";
};

const onStudentClick = (student: Student) => {
  if (props.clickable) {
    emit("student-click", student);
  }
};
</script>

<style scoped>
/* Additional styles if needed */
</style>
