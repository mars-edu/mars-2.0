<template>
  <f7-page
    name="student-card"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header
      @searchbar-enable="handleSearchbarEnable"
      @searchbar-disable="handleSearchbarDisable"
      class="hidden md:block flex-shrink-0 border-b border-border"
    />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 md:ml-52"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">Картотека обучающихся</h1>
            <div class="student-card-filters">
              <SmartSelect
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
            <SmartSelect
              v-model="selectedCourse"
              :options="courseOptions"
              placeholder="Курс:"
              name="course"
              class="min-w-[150px]"
            />

            <SmartSelect
              v-model="selectedSpecialty"
              :options="specialtyOptions"
              placeholder="Специальность:"
              name="specialty"
              class="min-w-[150px]"
            />

            <SmartSelect
              v-model="selectedLanguage"
              :options="languageOptions"
              placeholder="Язык:"
              name="language"
              class="min-w-[150px]"
            />

            <SmartSelect
              v-model="selectedGender"
              :options="genderOptions"
              placeholder="Пол:"
              name="gender"
              class="min-w-[150px]"
            />

            <SmartSelect
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
                    <th class="px-4 py-2 text-left">Курс</th>
                    <th class="px-4 py-2 text-left">Специальность</th>
                    <th class="px-4 py-2 text-left">Язык</th>
                    <th class="px-4 py-2 text-left">База</th>
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
                  >
                    <td class="px-4 py-3">{{ index + 1 }}</td>
                    <td class="px-4 py-3">{{ student.name }}</td>
                    <td class="px-4 py-3">{{ student.course }}</td>
                    <td class="px-4 py-3">{{ student.specialty }}</td>
                    <td class="px-4 py-3">{{ student.language }}</td>
                    <td class="px-4 py-3">{{ student.base }}</td>
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
      v-for="student in filteredStudents"
      :key="`edit-${student.id}`"
      :student="student"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7Page } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddStudentButton from "@/components/AddStudentButton.vue";
import EditStudentButton from "@/components/EditStudentButton.vue";
import SmartSelect from "@/components/ui/SmartSelect.vue";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useCourseStore } from "@/stores/courseStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { storeToRefs } from "pinia";

const searchbarEnabled = ref(false);
const activeNavItem = ref("student-card");
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const courseStore = useCourseStore();
const academicYearStore = useAcademicYearStore();

const { courses } = storeToRefs(courseStore);
const { specialties } = storeToRefs(specialtyStore);
const { languages } = storeToRefs(languageStore);
const { academicYears } = storeToRefs(academicYearStore);

const selectedCourse = ref("");
const selectedSpecialty = ref("");
const selectedLanguage = ref("");
const selectedGender = ref("");
const selectedBase = ref("");
const selectedAcademicYear = ref("");

// Convert store data to options format for SmartSelect
const courseOptions = computed(() => {
  const options = [{ value: "", text: "Все" }];
  courses.value.forEach((course) => {
    options.push({
      value: course.number.toString(),
      text: course.number.toString(),
    });
  });
  return options;
});

const specialtyOptions = computed(() => {
  const options = [{ value: "", text: "Все" }];
  specialties.value.forEach((specialty) => {
    options.push({ value: specialty.code, text: specialty.name });
  });
  return options;
});

const languageOptions = computed(() => {
  const options = [{ value: "", text: "Все" }];
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
  { value: "9", text: "9" },
  { value: "11", text: "11" },
]);

const academicYearOptions = computed(() => {
  return academicYears.value.map((year) => ({
    value: year.id,
    text: year.name,
  }));
});

// Set initial active academic year
selectedAcademicYear.value = academicYearStore.getActiveAcademicYear?.id || "";

const filteredStudents = computed(() => {
  return studentStore.getAllStudents.filter((student) => {
    const courseMatch =
      !selectedCourse.value ||
      student.course.toString() === selectedCourse.value;
    const specialtyMatch =
      !selectedSpecialty.value || student.specialty === selectedSpecialty.value;
    const languageMatch =
      !selectedLanguage.value || student.language === selectedLanguage.value;
    const genderMatch =
      !selectedGender.value || student.gender === selectedGender.value;
    const baseMatch =
      !selectedBase.value || student.base.toString() === selectedBase.value;

    return (
      courseMatch && specialtyMatch && languageMatch && genderMatch && baseMatch
    );
  });
});

const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};
</script>

<style lang="postcss">
.student-card-filters .smart-select-list-container {
  @apply !bg-white;
}
</style>
