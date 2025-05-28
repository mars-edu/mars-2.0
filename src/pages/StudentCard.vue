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
        <div class="flex flex-col gap-4">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">Картотека обучающихся</h1>
            <div>
              <f7-input
                type="text"
                placeholder="2024-2025"
                class="border border-border rounded-lg w-32 text-center"
                readonly
              ></f7-input>
            </div>
          </div>

          <div class="flex flex-wrap gap-x-4 gap-y-2 items-center">
            <f7-list class="filter-select-list">
              <f7-list-item
                title="Курс:"
                smart-select
                :smart-select-params="{
                  openIn: 'popover',
                  closeOnSelect: true,
                  setValueText: true,
                }"
              >
                <select name="course" v-model="selectedCourse">
                  <option value="">Все</option>
                  <option
                    v-for="courseItem in courses"
                    :key="courseItem.id"
                    :value="courseItem.number"
                  >
                    {{ courseItem.number }}
                  </option>
                </select>
              </f7-list-item>
            </f7-list>
            <f7-list class="filter-select-list">
              <f7-list-item
                title="Специальность:"
                smart-select
                :smart-select-params="{
                  openIn: 'popover',
                  closeOnSelect: true,
                  setValueText: true,
                }"
              >
                <select name="specialty" v-model="selectedSpecialty">
                  <option value="">Все</option>
                  <option
                    v-for="specialtyItem in specialties"
                    :key="specialtyItem.id"
                    :value="specialtyItem.code"
                  >
                    {{ specialtyItem.name }}
                  </option>
                </select>
              </f7-list-item>
            </f7-list>
            <f7-list class="filter-select-list">
              <f7-list-item
                title="Язык:"
                smart-select
                :smart-select-params="{
                  openIn: 'popover',
                  closeOnSelect: true,
                  setValueText: true,
                }"
              >
                <select name="language" v-model="selectedLanguage">
                  <option value="">Все</option>
                  <option
                    v-for="languageItem in languages"
                    :key="languageItem.id"
                    :value="languageItem.code"
                  >
                    {{ languageItem.name }}
                  </option>
                </select>
              </f7-list-item>
            </f7-list>
            <f7-list class="filter-select-list">
              <f7-list-item
                title="Пол:"
                smart-select
                :smart-select-params="{
                  openIn: 'popover',
                  closeOnSelect: true,
                  setValueText: true,
                }"
              >
                <select name="gender" v-model="selectedGender">
                  <option value="">Все</option>
                  <option value="male">Мужской</option>
                  <option value="female">Женский</option>
                </select>
              </f7-list-item>
            </f7-list>
            <f7-list class="filter-select-list">
              <f7-list-item
                title="База:"
                smart-select
                :smart-select-params="{
                  openIn: 'popover',
                  closeOnSelect: true,
                  setValueText: true,
                }"
              >
                <select name="base" v-model="selectedBase">
                  <option value="">Все</option>
                  <option value="9">9</option>
                  <option value="11">11</option>
                </select>
              </f7-list-item>
            </f7-list>
          </div>

          <div
            class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
          >
            <div class="overflow-x-auto">
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-muted/50">
                    <th class="px-4 py-3 text-left">№</th>
                    <th class="px-4 py-3 text-left">ФИО</th>
                    <th class="px-4 py-3 text-left">Курс</th>
                    <th class="px-4 py-3 text-left">Специальность</th>
                    <th class="px-4 py-3 text-left">Язык</th>
                    <th class="px-4 py-3 text-left">База</th>
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
import { f7Page, f7Input, f7List, f7ListItem } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddStudentButton from "@/components/AddStudentButton.vue";
import EditStudentButton from "@/components/EditStudentButton.vue";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useCourseStore } from "@/stores/courseStore";
import { storeToRefs } from "pinia";

const searchbarEnabled = ref(false);
const activeNavItem = ref("student-card");
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const courseStore = useCourseStore();
const { courses } = storeToRefs(courseStore);
const { specialties } = storeToRefs(specialtyStore);
const { languages } = storeToRefs(languageStore);

// Filter states
const selectedCourse = ref("");
const selectedSpecialty = ref("");
const selectedLanguage = ref("");
const selectedGender = ref("");
const selectedBase = ref("");

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

<style scoped>
.filter-select-list {
  --f7-list-margin-vertical: 0;
  --f7-list-item-padding-horizontal: 8px;
  --f7-list-item-min-height: 36px;
  width: auto;
  min-width: 150px;
  display: inline-block;
  border: 1px solid hsl(var(--border));
  border-radius: 0.5rem;
  background-color: hsl(var(--card));
}

.filter-select-list .f7-list-item .item-content .item-inner {
  padding-right: 28px;
  padding-left: 0;
  width: 100%;
}

.filter-select-list .f7-list-item .item-content .item-inner .item-title {
  color: hsl(var(--foreground));
  font-size: 0.875rem;
  line-height: 1.25rem;
  margin-right: 0.5rem;
  white-space: nowrap;
  opacity: 1;
  flex-shrink: 0;
}

.filter-select-list .f7-list-item .item-content .item-inner .item-after {
  color: hsl(var(--foreground));
  flex-grow: 1;
  flex-shrink: 1;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.flex.flex-wrap.gap-x-4.gap-y-2.items-center {
  /* Ensures items align nicely if they wrap */
}

.filter-select-list.no-hairlines,
.filter-select-list .f7-list-item.no-hairlines {
  --f7-list-hairlines: 0;
  --f7-block-hairlines: 0;
  --f7-list-item-border-color: transparent;
}
</style>
