<template>
  <f7-page
    name="settings"
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
        <div
          class="bg-card text-card-foreground rounded-xl p-4 md:p-4 shadow-sm"
        >
          <div
            class="flex flex-col md:flex-row md:items-center md:gap-3 mb-4 md:mb-4"
          >
            <div
              class="flex flex-col md:flex-row md:items-center md:gap-3 flex-1 mb-4 md:mb-0"
            >
              <span
                class="text-base md:text-lg font-medium md:font-semibold mb-1 md:mb-0"
                >Настройки:</span
              >
            </div>
          </div>

          <Accordion>
            <AccordionItem id="languages" :default-expanded="true">
              <template #title>Языки:</template>
              <template #actions>
                <AddLanguageButton />
              </template>
              <div
                v-if="languageStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="languageStore.getError"
                class="p-4 text-destructive"
              >
                {{ languageStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="language in languages"
                  :key="language.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`language-item-${language.id}`"
                >
                  <span class="font-medium">
                    {{ language.name }}
                  </span>
                  <span class="text-xs px-2 py-0.5 bg-muted rounded-full">
                    {{ language.code }}
                  </span>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditLanguage(language)"
                    aria-label="Edit Language"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    ></f7-icon>
                  </button>
                </div>
                <EditLanguageButton
                  v-for="language in languages"
                  :key="`edit-${language.id}`"
                  :language="language"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="courses" :default-expanded="true">
              <template #title>Курсы:</template>
              <template #actions>
                <AddSettingsCourseButton />
              </template>
              <div v-if="courseStore.isLoading" class="p-4 flex justify-center">
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="courseStore.getError"
                class="p-4 text-destructive"
              >
                {{ courseStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="course in courses"
                  :key="course.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`course-item-${course.id}`"
                >
                  <span class="font-medium">
                    {{ course.name }}
                  </span>
                  <button
                    class="ml-auto p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click="handleToggleCourseVisibility(course.id)"
                    aria-label="Toggle Visibility"
                    type="button"
                  >
                    <f7-icon
                      :ios="course.isVisible ? 'f7:eye' : 'f7:eye_slash'"
                      :md="
                        course.isVisible
                          ? 'material:visibility'
                          : 'material:visibility_off'
                      "
                      size="18px"
                      class="text-primary"
                    ></f7-icon>
                  </button>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditCourse(course)"
                    aria-label="Edit Course"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    ></f7-icon>
                  </button>
                </div>
                <EditSettingsCourseButton
                  v-for="course in courses"
                  :key="`edit-${course.id}`"
                  :course="{
                    id: course.id,
                    name: course.name || '',
                    isVisible: course.isVisible || false,
                    number: course.number,
                    admissionYear: course.admissionYear,
                    specialtyId: course.specialtyId,
                  }"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="academic-years" :default-expanded="true">
              <template #title>Учебный год:</template>
              <template #actions>
                <AddAcademicYearButton />
              </template>
              <div
                v-if="academicYearStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="academicYearStore.getError"
                class="p-4 text-destructive"
              >
                {{ academicYearStore.getError }}
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="academicYear in academicYears"
                  :key="academicYear.id"
                  @click.stop="handleSetActiveAcademicYear(academicYear.id)"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`academic-year-item-${academicYear.id}`"
                  :class="{ 'border-primary': academicYear.isActive }"
                >
                  <span class="font-medium">
                    {{ academicYear.name }}
                  </span>
                  <span
                    v-if="academicYear.isActive"
                    class="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                  >
                    Активный
                  </span>
                  <button
                    v-if="!academicYear.isActive"
                    class="ml-auto p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="handleSetActiveAcademicYear(academicYear.id)"
                    aria-label="Set Active"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:checkmark_circle"
                      md="material:check_circle"
                      size="18px"
                      class="text-primary"
                    ></f7-icon>
                  </button>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditAcademicYear(academicYear)"
                    aria-label="Edit Academic Year"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    ></f7-icon>
                  </button>
                </div>
                <EditAcademicYearButton
                  v-for="academicYear in academicYears"
                  :key="`edit-${academicYear.id}`"
                  :academic-year="academicYear"
                />
              </div>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { f7Page, f7Icon, f7, f7Preloader } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import AddLanguageButton from "@/components/AddLanguageButton.vue";
import EditLanguageButton from "@/components/EditLanguageButton.vue";
import AddSettingsCourseButton from "@/components/AddSettingsCourseButton.vue";
import EditSettingsCourseButton from "@/components/EditSettingsCourseButton.vue";
import AddAcademicYearButton from "@/components/AddAcademicYearButton.vue";
import EditAcademicYearButton from "@/components/EditAcademicYearButton.vue";
import { useLanguageStore } from "@/stores/languageStore";
import { useCourseStore } from "@/stores/courseStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { storeToRefs } from "pinia";

const searchbarEnabled = ref(false);
const activeNavItem = ref("settings");
const languageStore = useLanguageStore();
const courseStore = useCourseStore();
const academicYearStore = useAcademicYearStore();
const { courses } = storeToRefs(courseStore);
const { languages } = storeToRefs(languageStore);
const { academicYears } = storeToRefs(academicYearStore);

const handleSearchbarEnable = () => {
  searchbarEnabled.value = true;
};

const handleSearchbarDisable = () => {
  searchbarEnabled.value = false;
};

const handleToggleCourseVisibility = async (id: string) => {
  try {
    await courseStore.toggleCourseVisibility(id);
  } catch (error) {
    console.error("Failed to toggle course visibility:", error);
    f7.dialog.alert("Произошла ошибка при изменении видимости курса.");
  }
};

const handleSetActiveAcademicYear = async (id: string) => {
  try {
    await academicYearStore.setActiveAcademicYear(id);
  } catch (error) {
    console.error("Failed to set active academic year:", error);
    f7.dialog.alert("Произошла ошибка при установке активного учебного года.");
  }
};

const openEditLanguage = (language: any) => {
  const targetEl = document.getElementById(`language-item-${language.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-language-popover-${language.id}`, targetEl);
  }
};

const openEditCourse = (course: any) => {
  const targetEl = document.getElementById(`course-item-${course.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-settings-course-popover-${course.id}`, targetEl);
  }
};

const openEditAcademicYear = (academicYear: any) => {
  console.log("Opening edit academic year popover for:", academicYear.id);
  const targetEl = document.getElementById(
    `academic-year-item-${academicYear.id}`
  );
  console.log("Target element:", targetEl);
  if (targetEl) {
    f7.popover.open(`#edit-academic-year-popover-${academicYear.id}`, targetEl);
  }
};

onMounted(async () => {
  await languageStore.fetchLanguages();
  await courseStore.fetchCourses();
  await academicYearStore.fetchAcademicYears();
});
</script>
