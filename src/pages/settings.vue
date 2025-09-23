<template>
  <f7-page
    name="settings"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

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
                >Настройки системы:</span
              >
            </div>
            <div class="flex gap-2">
              <f7-button
                fill
                @click="toggleAllAccordions"
                style="min-width: 0"
                class="gap-2"
                type="button"
              >
                <f7-icon
                  :ios="areAllExpanded ? 'f7:chevron_up' : 'f7:chevron_down'"
                  :md="
                    areAllExpanded
                      ? 'material:expand_less'
                      : 'material:expand_more'
                  "
                  size="16px"
                  ck
                />
                {{ areAllExpanded ? "Свернуть все" : "Развернуть все" }}
              </f7-button>
            </div>
          </div>

          <Accordion v-model:expanded-items="expandedAccordions">
            <!-- Courses Section -->
            <AccordionItem id="courses" :default-expanded="false">
              <template #title>Курсы:</template>
              <template #actions>
                <AddCourseButton />
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
              <div v-else-if="courses.length === 0">
                <NoData
                  title="Нет курсов"
                  description="Курсы не добавлены в систему"
                  :icon="{ ios: 'f7:book', md: 'material:menu_book' }"
                />
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="course in courses"
                  :key="course.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`course-item-${course.id}`"
                >
                  <span class="font-medium">
                    {{ course.number }}
                  </span>
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
                    />
                  </button>
                </div>
                <EditCourseButton
                  v-if="selectedCourseId"
                  :course-id="selectedCourseId"
                />
              </div>
            </AccordionItem>

            <!-- Semesters Section -->
            <AccordionItem id="semesters" :default-expanded="false">
              <template #title>Семестры:</template>
              <template #actions>
                <AddSemesterButton />
              </template>
              <div
                v-if="semesterStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="semesterStore.getError"
                class="p-4 text-destructive"
              >
                {{ semesterStore.getError }}
              </div>
              <div v-else-if="semesters.length === 0">
                <NoData
                  title="Нет семестров"
                  description="Семестры не добавлены в систему"
                  :icon="{ ios: 'f7:calendar', md: 'material:event' }"
                />
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="semester in semesters"
                  :key="semester.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`semester-item-${semester.id}`"
                >
                  <span class="font-medium">{{ semester.shortName }}</span>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditSemester(semester)"
                    aria-label="Edit Semester"
                    type="button"
                  >
                    <f7-icon
                      ios="f7:pencil"
                      md="material:edit"
                      size="18px"
                      class="text-primary"
                    />
                  </button>
                </div>
                <EditSemesterButton
                  v-if="selectedSemesterId"
                  :semester-id="selectedSemesterId"
                />
              </div>
            </AccordionItem>

            <!-- Languages Section -->
            <AccordionItem id="languages" :default-expanded="false">
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
              <div v-else-if="languages.length === 0">
                <NoData
                  title="Нет языков"
                  description="Языки не добавлены в систему"
                  :icon="{ ios: 'f7:globe', md: 'material:language' }"
                />
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
                  <span class="text-xs px-2 py-0.5">
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
                    />
                  </button>
                </div>
                <EditLanguageButton
                  v-if="selectedLanguageId"
                  :language-id="selectedLanguageId"
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
import { ref, computed, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { f7Page, f7Icon, f7, f7Preloader } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import NoData from "@/components/ui/accordion/NoData.vue";
import AddCourseButton from "@/components/AddCourseButton.vue";
import EditCourseButton from "@/components/EditCourseButton.vue";
import { useCourseStore } from "@/stores/courseStore";
import type { Course } from "@/stores/courseStore";
import AddSemesterButton from "@/components/AddSemesterButton.vue";
import EditSemesterButton from "@/components/EditSemesterButton.vue";
import { useSemesterStore } from "@/stores/semesterStore";
import type { Semester } from "@/stores/semesterStore";
import AddLanguageButton from "@/components/AddLanguageButton.vue";
import EditLanguageButton from "@/components/EditLanguageButton.vue";
import { useLanguageStore } from "@/stores/languageStore";
import type { Language } from "@/stores/languageStore";

const activeNavItem = ref("settings");
const courseStore = useCourseStore();
const semesterStore = useSemesterStore();
const languageStore = useLanguageStore();
const { courses } = storeToRefs(courseStore);
const { semesters } = storeToRefs(semesterStore);
const { languages } = storeToRefs(languageStore);

// State for tracking expanded accordions
const expandedAccordions = ref<string[]>([]);

// Accordion IDs for expand/collapse all functionality
const accordionIds = ref(["courses", "semesters", "languages"]);

// State for selected course id
const selectedCourseId = ref<string | null>(null);
const selectedSemesterId = ref<string | null>(null);
const selectedLanguageId = ref<string | null>(null);

// stores are already reactive via storeToRefs above

// Computed property to check if all accordions are expanded
const areAllExpanded = computed(() => {
  return accordionIds.value.every((id) =>
    expandedAccordions.value.includes(id)
  );
});

// Method to toggle all accordions
const toggleAllAccordions = () => {
  if (areAllExpanded.value) {
    // Collapse all
    expandedAccordions.value = [];
  } else {
    // Expand all
    expandedAccordions.value = [...accordionIds.value];
  }
};

// Method to open edit course popover
const openEditCourse = async (course: Course) => {
  selectedCourseId.value = course.id;
  await nextTick();
  const targetEl = document.getElementById(`course-item-${course.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-settings-course-popover-${course.id}`, targetEl);
  }
};

// Method to open edit semester popover
const openEditSemester = async (semester: Semester) => {
  selectedSemesterId.value = semester.id;
  await nextTick();
  const targetEl = document.getElementById(`semester-item-${semester.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-semester-popover-${semester.id}`, targetEl);
  }
};

// Method to open edit language popover
const openEditLanguage = async (language: Language) => {
  selectedLanguageId.value = language.id;
  await nextTick();
  const targetEl = document.getElementById(`language-item-${language.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-language-popover-${language.id}`, targetEl);
  }
};
</script>
