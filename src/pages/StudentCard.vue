<template>
  <f7-page
    name="student-card"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">Картотека обучающихся</h1>
            <div class="student-card-filters flex items-center gap-2">
              <f7-input
                type="text"
                placeholder="Поиск по ФИО..."
                v-model:value="searchTerm"
                @input="handleSearchInput"
                class="w-[250px] !bg-white h-full !py-2"
                clear-button
              />
              <Select
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                placeholder="Учебный год:"
                name="academic-year"
                class="w-[250px]"
              />
            </div>
          </div>

          <div
            class="flex flex-wrap gap-x-4 gap-y-2 items-center student-card-filters"
          >
            <Select
              v-model="selectedGender"
              :options="genderOptions"
              placeholder="Пол:"
              name="gender"
              class="min-w-[150px]"
            />

            <Select
              v-model="selectedBase"
              :options="baseOptions"
              placeholder="База:"
              name="base"
              class="min-w-[150px]"
            />
          </div>

          <div class="bg-card text-card-foreground rounded-xl p-3 shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse rounded-lg">
                <thead>
                  <tr class="bg-gray-500 text-white">
                    <th class="px-4 py-2 text-left">№</th>
                    <th class="px-4 py-2 text-left">ФИО</th>
                    <th class="px-4 py-2 text-left">Специальность</th>
                    <th class="px-4 py-2 text-left">Язык</th>
                    <th class="px-4 py-2 text-left">Курс</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(student, index) in filteredStudents"
                    :key="student.id"
                    :id="`student-item-${student.id}`"
                    class="border-b border-border hover:bg-muted/30"
                    :class="{
                      'bg-blue-100': student.gender === 'male',
                      'bg-pink-100': student.gender === 'female',
                    }"
                    @click="selectStudent(student)"
                  >
                    <td class="px-4 py-3">{{ index + 1 }}</td>
                    <td class="px-4 py-3">
                      {{ student.surname }} {{ student.firstName }}
                      {{ student.patronymic }}
                    </td>
                    <td class="px-4 py-3">{{ student.specialty }}</td>
                    <td class="px-4 py-3">{{ student.language }}</td>
                    <td class="px-4 py-3">{{ student.course }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #fixed>
      <AddStudentButton />
    </template>

    <EditStudentButton
      v-if="selectedStudent"
      :key="`edit-${selectedStudent.id}`"
      :student="selectedStudent"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { f7Page, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddStudentButton from "@/components/AddStudentButton.vue";
import EditStudentButton from "@/components/EditStudentButton.vue";
import Select from "@/components/ui/Select.vue";
import { useStudentStore, type Student } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useBaseStore } from "@/stores/baseStore";
import { storeToRefs } from "pinia";

const activeNavItem = ref("student-card");
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const academicYearStore = useAcademicYearStore();
const baseStore = useBaseStore();

const { specialties } = storeToRefs(specialtyStore);
const { languages } = storeToRefs(languageStore);
const { academicYears } = storeToRefs(academicYearStore);
const { filteredStudents } = storeToRefs(studentStore);
const { bases } = storeToRefs(baseStore);

const selectedSpecialty = ref("");
const selectedLanguage = ref("");
const selectedGender = ref("");
const selectedBase = ref("");
const selectedAcademicYear = ref("");
const searchTerm = ref("");
const selectedStudent = ref<Student | null>(null);

onMounted(() => {
  studentStore.clearFilters();
  selectedSpecialty.value = "";
  selectedLanguage.value = "";
  selectedGender.value = "";
  selectedBase.value = "";
  selectedAcademicYear.value = "";
  searchTerm.value = "";
  selectedStudent.value = null;
});

const specialtyOptions = computed(() => {
  const options = [{ value: "all", text: "Все" }];
  specialties.value.forEach((specialty) => {
    options.push({ value: specialty.code, text: specialty.name });
  });
  return options;
});

const languageOptions = computed(() => {
  const options = [{ value: "all", text: "Все" }];
  languages.value.forEach((language) => {
    options.push({ value: language.code, text: language.name });
  });
  return options;
});

const genderOptions = computed(() => [
  { value: "", text: "Все" },
  { value: "male", text: "Мужской" },
  { value: "female", text: "Женский" },
]);

const baseOptions = computed(() => [
  { value: "", text: "Все" },
  ...bases.value.map((base) => ({
    value: base.value,
    text: base.text,
  })),
]);

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

selectedAcademicYear.value = academicYearStore.getActiveAcademicYear?.id || "";

watch(selectedGender, (newValue) => {
  studentStore.setFilter("gender", newValue);
});

watch(selectedBase, (newValue) => {
  studentStore.setFilter("base", newValue);
});

watch(selectedAcademicYear, (newValue) => {
  studentStore.setFilter("academicYearId", newValue);
});

watch(searchTerm, (newValue) => {
  studentStore.setFilter("searchTerm", newValue);
});

const selectStudent = async (student: Student) => {
  selectedStudent.value = student;
  await nextTick();
  f7.popover.open(
    `#edit-student-popover-${student.id}`,
    `#student-item-${student.id}`
  );
};

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  searchTerm.value = target.value;
};
</script>

<style lang="postcss">
.student-card-filters .smart-select-list-container {
  @apply !bg-white;
}
</style>
