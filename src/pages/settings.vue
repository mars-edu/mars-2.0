<template>
  <f7-page
    name="settings"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <div class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200"
        :class="contentMargin"
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
                >{{ settings_title() }}</span
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
                <component
                  :is="areAllExpanded ? IconChevronUp : IconChevronDown"
                  class="w-4 h-4"
                />
                {{ areAllExpanded ? settings_collapse_all() : settings_expand_all() }}
              </f7-button>
            </div>
          </div>

          <Accordion v-model:expanded-items="expandedAccordions">
            <!-- Semesters Section -->
            <AccordionItem id="semesters" :default-expanded="false">
              <template #title>{{ settings_semesters() }}</template>
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
                  :title="settings_no_semesters()"
                  :description="settings_no_semesters_desc()"
                  :icon="IconCalendar"
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
                    <IconPencil class="w-[18px] h-[18px] text-primary" />
                  </button>
                </div>
                <EditSemesterButton
                  v-if="selectedSemesterId"
                  :semester-id="selectedSemesterId"
                />
              </div>
            </AccordionItem>

            <!-- Courses Section -->
            <AccordionItem id="courses" :default-expanded="false">
              <template #title>{{ settings_courses() }}</template>
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
                  :title="settings_no_courses()"
                  :description="settings_no_courses_desc()"
                  :icon="IconBookOpen"
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
                    <IconPencil class="w-[18px] h-[18px] text-primary" />
                  </button>
                </div>
                <EditCourseButton
                  v-if="selectedCourseId"
                  :course-id="selectedCourseId"
                />
              </div>
            </AccordionItem>

            <!-- Languages Section -->
            <AccordionItem id="languages" :default-expanded="false">
              <template #title>{{ settings_languages() }}</template>
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
                  :title="settings_no_languages()"
                  :description="settings_no_languages_desc()"
                  :icon="IconGlobe"
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
                    <IconPencil class="w-[18px] h-[18px] text-primary" />
                  </button>
                </div>
                <EditLanguageButton
                  v-if="selectedLanguageId"
                  :language-id="selectedLanguageId"
                />
              </div>
            </AccordionItem>

            <!-- Controls Section -->
            <AccordionItem id="controls" :default-expanded="false">
              <template #title>{{ settings_controls() }}</template>
              <Accordion v-model:expanded-items="expandedControlAccordions">
                <!-- Final Controls Section -->
                <AccordionItem id="finalControls" :default-expanded="false">
                  <template #title>{{ settings_final_controls() }}</template>
                  <template #actions>
                    <AddFinalControlButton />
                  </template>
                  <div
                    v-if="finalControlStore.isLoading"
                    class="p-4 flex justify-center"
                  >
                    <f7-preloader></f7-preloader>
                  </div>
                  <div
                    v-else-if="finalControlStore.getError"
                    class="p-4 text-destructive"
                  >
                    {{ finalControlStore.getError }}
                  </div>
                  <div v-else-if="sortedFinalControls.length === 0">
                    <NoData
                      :title="settings_no_final_controls()"
                      :description="settings_no_final_controls_desc()"
                      :icon="IconCircleCheck"
                    />
                  </div>
                  <div
                    v-else
                    class="flex flex-wrap items-center gap-2 md:gap-3"
                  >
                    <div
                      v-for="control in sortedFinalControls"
                      :key="control.id"
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                      :id="`final-control-item-${control.id}`"
                    >
                      <span class="font-medium">{{ control.shortName }}</span>
                      <button
                        class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                        @click.stop="openEditFinalControl(control)"
                        aria-label="Edit Final Control"
                        type="button"
                      >
                        <IconPencil class="w-[18px] h-[18px] text-primary" />
                      </button>
                    </div>
                    <EditFinalControlButton
                      v-if="selectedFinalControlId"
                      :control-id="selectedFinalControlId"
                    />
                  </div>
                </AccordionItem>

                <!-- Intermediate Controls Section -->
                <AccordionItem
                  id="intermediateControls"
                  :default-expanded="false"
                >
                  <template #title>{{ settings_intermediate_controls() }}</template>
                  <template #actions>
                    <AddIntermediateControlButton />
                  </template>
                  <div
                    v-if="intermediateControlStore.isLoading"
                    class="p-4 flex justify-center"
                  >
                    <f7-preloader></f7-preloader>
                  </div>
                  <div
                    v-else-if="intermediateControlStore.getError"
                    class="p-4 text-destructive"
                  >
                    {{ intermediateControlStore.getError }}
                  </div>
                  <div v-else-if="sortedIntermediateControls.length === 0">
                    <NoData
                      :title="settings_no_intermediate_controls()"
                      :description="settings_no_intermediate_controls_desc()"
                      :icon="IconCircleCheck"
                    />
                  </div>
                  <div
                    v-else
                    class="flex flex-wrap items-center gap-2 md:gap-3"
                  >
                    <div
                      v-for="control in sortedIntermediateControls"
                      :key="control.id"
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                      :id="`intermediate-control-item-${control.id}`"
                    >
                      <span class="font-medium">{{ control.shortName }}</span>
                      <button
                        class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                        @click.stop="openEditIntermediateControl(control)"
                        aria-label="Edit Intermediate Control"
                        type="button"
                      >
                        <IconPencil class="w-[18px] h-[18px] text-primary" />
                      </button>
                    </div>
                    <EditIntermediateControlButton
                      v-if="selectedIntermediateControlId"
                      :control-id="selectedIntermediateControlId"
                    />
                  </div>
                </AccordionItem>
              </Accordion>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onBeforeMount } from "vue";
import { storeToRefs } from "pinia";
import { f7Page, f7, f7Preloader } from "framework7-vue";
import IconCalendar from "~icons/lucide/calendar";
import IconBookOpen from "~icons/lucide/book-open";
import IconGlobe from "~icons/lucide/globe";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconChevronUp from "~icons/lucide/chevron-up";
import IconChevronDown from "~icons/lucide/chevron-down";
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
import AddFinalControlButton from "@/components/AddFinalControlButton.vue";
import EditFinalControlButton from "@/components/EditFinalControlButton.vue";
import { useFinalControlStore } from "@/stores/finalControlStore";
import type { FinalControl } from "@/stores/finalControlStore";
import AddIntermediateControlButton from "@/components/AddIntermediateControlButton.vue";
import EditIntermediateControlButton from "@/components/EditIntermediateControlButton.vue";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import type { IntermediateControl } from "@/stores/intermediateControlStore";
import { useSidebar } from "@/composables/useSidebar";
import IconPencil from "~icons/lucide/pencil";
import {
  settings_title,
  settings_collapse_all,
  settings_expand_all,
  settings_semesters,
  settings_no_semesters,
  settings_no_semesters_desc,
  settings_courses,
  settings_no_courses,
  settings_no_courses_desc,
  settings_languages,
  settings_no_languages,
  settings_no_languages_desc,
  settings_controls,
  settings_final_controls,
  settings_no_final_controls,
  settings_no_final_controls_desc,
  settings_intermediate_controls,
  settings_no_intermediate_controls,
  settings_no_intermediate_controls_desc,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();

console.log("[SettingsPage] Component setup initiated");

const { contentMargin } = useSidebar();

const activeNavItem = ref("settings");
const courseStore = useCourseStore();
const semesterStore = useSemesterStore();
const languageStore = useLanguageStore();
const finalControlStore = useFinalControlStore();
const intermediateControlStore = useIntermediateControlStore();

console.log("[SettingsPage] Stores initialized");

const { courses } = storeToRefs(courseStore);
const { semesters } = storeToRefs(semesterStore);
const { languages } = storeToRefs(languageStore);
const { sortedFinalControls } = storeToRefs(finalControlStore);
const { sortedIntermediateControls } = storeToRefs(intermediateControlStore);

// State for tracking expanded accordions
const expandedAccordions = ref<string[]>([]);
const expandedControlAccordions = ref<string[]>([]);

// Accordion IDs for expand/collapse all functionality
const accordionIds = ref(["semesters", "courses", "languages", "controls"]);

// State for selected ids
const selectedCourseId = ref<string | null>(null);
const selectedSemesterId = ref<string | null>(null);
const selectedLanguageId = ref<string | null>(null);
const selectedFinalControlId = ref<string | null>(null);
const selectedIntermediateControlId = ref<string | null>(null);

onBeforeMount(() => {
  console.log("[SettingsPage] Component before mount");
});

onMounted(() => {
  console.log("[SettingsPage] Component mounted");
  console.log("[SettingsPage] Initial state:", {
    activeNavItem: activeNavItem.value,
    coursesCount: courses.value.length,
    semestersCount: semesters.value.length,
    languagesCount: languages.value.length,
    finalControlsCount: sortedFinalControls.value.length,
    intermediateControlsCount: sortedIntermediateControls.value.length,
    expandedAccordions: expandedAccordions.value,
    selectedItems: {
      courseId: selectedCourseId.value,
      semesterId: selectedSemesterId.value,
      languageId: selectedLanguageId.value,
      finalControlId: selectedFinalControlId.value,
      intermediateControlId: selectedIntermediateControlId.value,
    },
  });
});

// stores are already reactive via storeToRefs above

// Computed property to check if all accordions are expanded
const areAllExpanded = computed(() => {
  return accordionIds.value.every((id) =>
    expandedAccordions.value.includes(id)
  );
});

// Method to toggle all accordions
const toggleAllAccordions = () => {
  console.log("[SettingsPage] Toggling all accordions");
  const wasExpanded = areAllExpanded.value;
  console.log("[SettingsPage] Current expanded state:", wasExpanded);

  if (wasExpanded) {
    // Collapse all
    expandedAccordions.value = [];
    console.log("[SettingsPage] Collapsing all accordions");
  } else {
    // Expand all
    expandedAccordions.value = [...accordionIds.value];
    console.log("[SettingsPage] Expanding all accordions");
  }

  console.log(
    "[SettingsPage] New expanded accordions:",
    expandedAccordions.value
  );
};

// Method to open edit course popover
const openEditCourse = async (course: Course) => {
  console.log("[SettingsPage] Opening edit course popover for course:", course);
  selectedCourseId.value = course.id;
  await nextTick();
  const targetEl = document.getElementById(`course-item-${course.id}`);
  if (targetEl) {
    console.log("[SettingsPage] Target element found, opening popover");
    f7.popover.open(`#edit-settings-course-popover-${course.id}`, targetEl);
  } else {
    console.log("[SettingsPage] Target element not found");
  }
};

// Method to open edit semester popover
const openEditSemester = async (semester: Semester) => {
  console.log(
    "[SettingsPage] Opening edit semester popover for semester:",
    semester
  );
  selectedSemesterId.value = semester.id;
  await nextTick();
  const targetEl = document.getElementById(`semester-item-${semester.id}`);
  if (targetEl) {
    console.log("[SettingsPage] Target element found, opening popover");
    f7.popover.open(`#edit-semester-popover-${semester.id}`, targetEl);
  } else {
    console.log("[SettingsPage] Target element not found");
  }
};

// Method to open edit language popover
const openEditLanguage = async (language: Language) => {
  console.log(
    "[SettingsPage] Opening edit language popover for language:",
    language
  );
  selectedLanguageId.value = language.id;
  await nextTick();
  const targetEl = document.getElementById(`language-item-${language.id}`);
  if (targetEl) {
    console.log("[SettingsPage] Target element found, opening popover");
    f7.popover.open(`#edit-language-popover-${language.id}`, targetEl);
  } else {
    console.log("[SettingsPage] Target element not found");
  }
};

// Method to open edit final control popover
const openEditFinalControl = async (control: FinalControl) => {
  console.log(
    "[SettingsPage] Opening edit final control popover for control:",
    control
  );
  selectedFinalControlId.value = control.id;
  await nextTick();
  const targetEl = document.getElementById(`final-control-item-${control.id}`);
  if (targetEl) {
    console.log("[SettingsPage] Target element found, opening popover");
    f7.popover.open(
      `#edit-settings-final-control-popover-${control.id}`,
      targetEl
    );
  } else {
    console.log("[SettingsPage] Target element not found");
  }
};

// Method to open edit intermediate control popover
const openEditIntermediateControl = async (control: IntermediateControl) => {
  console.log(
    "[SettingsPage] Opening edit intermediate control popover for control:",
    control
  );
  selectedIntermediateControlId.value = control.id;
  await nextTick();
  const targetEl = document.getElementById(
    `intermediate-control-item-${control.id}`
  );
  if (targetEl) {
    console.log("[SettingsPage] Target element found, opening popover");
    f7.popover.open(
      `#edit-settings-intermediate-control-popover-${control.id}`,
      targetEl
    );
  } else {
    console.log("[SettingsPage] Target element not found");
  }
};
</script>
