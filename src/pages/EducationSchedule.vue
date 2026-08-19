<template>
  <f7-page
    name="education-schedule"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <Sidebar v-model:activeNavItem="activeNavItem" />

    <div class="flex flex-1 overflow-hidden">
      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200"
        :class="contentMargin"
      >
        <div class="max-w-[1600px] mx-auto space-y-6">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 class="text-xl md:text-2xl font-bold text-foreground">
              {{ edu_schedule_title() }}
            </h1>
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
                {{ areAllExpanded ? edu_schedule_collapse_all() : edu_schedule_expand_all() }}
              </f7-button>
            </div>
          </div>

          <!-- Top-level view: Academic Years + Semesters -->
          <Accordion v-model:expanded-items="expandedAccordions">
            <AccordionItem id="education-technologies">
              <template #title>Технологии обучения</template>
              <template #actions>
                <AddEducationTechnologyButton />
              </template>
              <div
                v-if="educationTechnologyStore.loading"
                class="p-4 flex justify-center"
              >
                <f7-preloader></f7-preloader>
              </div>
              <div
                v-else-if="educationTechnologyStore.error"
                class="p-4 text-destructive"
              >
                {{ educationTechnologyStore.error }}
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div
                  v-for="technology in educationTechnologyStore.technologies"
                  :key="technology.id"
                  class="relative group p-4 rounded-xl border transition-all"
                  :id="`education-technology-item-${technology.id}`"
                >
                  <div class="flex flex-col gap-1 w-full">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold text-foreground flex items-center gap-2">
                        {{ technology.name }}
                        <span
                          v-if="technology.shortName"
                          class="text-[10px] font-normal px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                        >
                          {{ technology.shortName }}
                        </span>
                      </span>
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          class="p-1 text-muted-foreground hover:text-primary transition-colors"
                          @click.stop="openEditEducationTechnology(technology)"
                          aria-label="Edit Education Technology"
                          type="button"
                        >
                          <IconPencil class="w-[14px] h-[14px]" />
                        </button>
                      </div>
                    </div>
                    <div class="flex items-center justify-between mt-1">
                      <span class="text-xs text-muted-foreground">
                        {{ technology.academicHourMinutes }} мин
                      </span>
                      <span
                        v-if="technology.isDefault"
                        class="text-[10px] font-bold uppercase tracking-wider text-primary"
                      >
                        По умолчанию
                      </span>
                    </div>
                  </div>
                </div>
                <EditEducationTechnologyButton
                  v-if="selectedEducationTechnologyId"
                  :education-technology-id="selectedEducationTechnologyId"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="academic-years" >
              <template #title>{{ edu_schedule_academic_year() }}</template>
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
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div
                  v-for="academicYear in academicYearStore.getSortedAcademicYears"
                  :key="academicYear.id"
                  @click.stop="handleSelectAcademicYear(academicYear)"
                  class="relative group p-4 rounded-xl border transition-all cursor-pointer"
                  :class="getAcademicYearCardClass(academicYear)"
                  :id="`academic-year-item-${academicYear.id}`"
                >
                  <div class="flex flex-col gap-1 w-full">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold" :class="academicYear.isActive ? 'text-foreground' : 'text-muted-foreground'">
                        {{ academicYear.name }}
                      </span>
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          v-if="!academicYear.isActive"
                          class="p-1 text-muted-foreground hover:text-primary transition-colors"
                          @click.stop="handleSetActiveAcademicYear(academicYear)"
                          aria-label="Set Active"
                          type="button"
                        >
                          <IconCircleCheck class="w-[14px] h-[14px]" />
                        </button>
                        <button
                          class="p-1 text-muted-foreground hover:text-primary transition-colors"
                          @click.stop="openEditAcademicYear(academicYear)"
                          aria-label="Edit Academic Year"
                          type="button"
                        >
                          <IconPencil class="w-[14px] h-[14px]" />
                        </button>
                        <button
                          class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          @click.stop="deleteAcademicYear(academicYear)"
                          aria-label="Delete Academic Year"
                          type="button"
                        >
                          <IconTrash class="w-[14px] h-[14px]" />
                        </button>
                      </div>
                    </div>
                    <div v-if="academicYear.isActive" class="flex items-center justify-between mt-1">
                      <span class="text-[10px] font-bold uppercase tracking-wider text-primary">
                        {{ edu_schedule_active() }}
                      </span>
                    </div>
                  </div>
                </div>
                <EditAcademicYearButton
                  v-if="selectedAcademicYearId"
                  :academic-year-id="selectedAcademicYearId"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="semesters" >
              <template #title>{{ edu_schedule_semesters() }}</template>
              <template #actions>
                <AddAcademicYearSemesterButton />
              </template>
              <div
                v-if="academicYearSemesterStore.isLoading"
                class="p-4 flex justify-center"
              >
                <f7-preloader />
              </div>
              <div
                v-else-if="academicYearSemesterStore.getError"
                class="p-4 text-destructive"
              >
                {{ academicYearSemesterStore.getError }}
              </div>
              <div v-else-if="academicYearSemesters.length === 0">
                <NoData
                  :title="edu_schedule_no_semesters()"
                  :description="edu_schedule_no_semesters_desc()"
                  :icon="IconCalendar"
                />
              </div>
              <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <div
                  v-for="academicYearSemester in academicYearSemesters"
                  :key="academicYearSemester.id"
                  class="relative group p-4 rounded-xl border transition-all cursor-pointer"
                  :class="getSemesterCardClass(academicYearSemester)"
                  :id="`academic-year-semester-item-${academicYearSemester.id}`"
                  @click.stop="handleSemesterCardClick(academicYearSemester)"
                >
                  <div class="flex flex-col gap-1 w-full">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold" :class="getSemesterTextClass(academicYearSemester)">
                        {{ edu_schedule_semester_label({ number: academicYearSemester.semesterNumber }) }}
                      </span>
                      <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          class="p-1 text-muted-foreground hover:text-primary transition-colors"
                          @click.stop="openEditAcademicYearSemester(academicYearSemester)"
                          aria-label="Edit Academic Year Semester"
                          type="button"
                        >
                          <IconPencil class="w-[14px] h-[14px]" />
                        </button>
                        <button
                          class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                          @click.stop="deleteAcademicYearSemester(academicYearSemester)"
                          aria-label="Delete Academic Year Semester"
                          type="button"
                        >
                          <IconTrash class="w-[14px] h-[14px]" />
                        </button>
                      </div>
                    </div>
                    <div class="flex flex-col mt-1 gap-1">
                      <span class="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                        {{ formatUiDate(academicYearSemester.startDate) }} - {{ formatUiDate(academicYearSemester.endDate) }}
                      </span>
                      <span
                        v-if="academicYearSemesterStore.isSemesterActive(academicYearSemester)"
                        class="text-[10px] font-bold uppercase tracking-wider text-primary"
                      >
                        {{ edu_schedule_active() }}
                      </span>
                    </div>

                  </div>
                </div>
                <EditAcademicYearSemesterButton
                  v-if="selectedAcademicYearSemesterId"
                  :academic-year-semester-id="selectedAcademicYearSemesterId"
                />
              </div>
            </AccordionItem>

            <!-- Semester detail sections — shown only when a semester is selected -->
            <template v-if="selectedSemesterId">
              <BellScheduleSection
                :selected-semester-id="selectedSemesterId"
                :schedules="schedules"
              />

              <ScheduledControlsSection
                :selected-semester-id="selectedSemesterId"
                :scheduled-final-controls="scheduledFinalControls"
                :scheduled-intermediate-controls="scheduledIntermediateControls"
              />

              <VacationsSection
                :selected-semester-id="selectedSemesterId"
                :vacations="vacations"
              />
            </template>
          </Accordion>
        </div>
      </div>
    </div>
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onBeforeUnmount, watch } from "vue";
import Sortable from "sortablejs";
import { f7Page, f7, f7Preloader } from "framework7-vue";
import IconCalendar from "~icons/lucide/calendar";
import IconClock from "~icons/lucide/clock";
import IconSun from "~icons/lucide/sun";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconPencil from "~icons/lucide/pencil";
import IconChevronUp from "~icons/lucide/chevron-up";
import IconChevronDown from "~icons/lucide/chevron-down";
import IconTrash from "~icons/lucide/trash-2";
import BellScheduleSection from "@/components/schedule/BellScheduleSection.vue";
import ScheduledControlsSection from "@/components/schedule/ScheduledControlsSection.vue";
import VacationsSection from "@/components/schedule/VacationsSection.vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import Accordion from "@/components/ui/accordion/Accordion.vue";
import AccordionItem from "@/components/ui/accordion/AccordionItem.vue";
import NoData from "@/components/ui/accordion/NoData.vue";
import AddEducationScheduleButton from "@/components/AddEducationScheduleButton.vue";
import CopyEducationScheduleButton from "@/components/CopyEducationScheduleButton.vue";
import EditEducationScheduleButton from "@/components/EditEducationScheduleButton.vue";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { storeToRefs } from "pinia";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import AddAcademicYearButton from "@/components/AddAcademicYearButton.vue";
import EditAcademicYearButton from "@/components/EditAcademicYearButton.vue";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import type { AcademicYear } from "@/stores/academicYearStore";
import AddEducationTechnologyButton from "@/components/AddEducationTechnologyButton.vue";
import EditEducationTechnologyButton from "@/components/EditEducationTechnologyButton.vue";
import { useEducationTechnologyStore } from "@/stores/educationTechnologyStore";
import type { EducationTechnology } from "@/types/education-technology";
import AddAcademicYearSemesterButton from "@/components/AddAcademicYearSemesterButton.vue";
import EditAcademicYearSemesterButton from "@/components/EditAcademicYearSemesterButton.vue";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import type { AcademicYearSemester } from "@/stores/academicYearSemesterStore";
import AddVacationButton from "@/components/AddVacationButton.vue";
import CopyVacationButton from "@/components/CopyVacationButton.vue";
import EditVacationButton from "@/components/EditVacationButton.vue";
import AddScheduledFinalControlButton from "@/components/AddScheduledFinalControlButton.vue";
import CopyScheduledFinalControlButton from "@/components/CopyScheduledFinalControlButton.vue";
import EditScheduledFinalControlButton from "@/components/EditScheduledFinalControlButton.vue";
import AddScheduledIntermediateControlButton from "@/components/AddScheduledIntermediateControlButton.vue";
import CopyScheduledIntermediateControlButton from "@/components/CopyScheduledIntermediateControlButton.vue";
import EditScheduledIntermediateControlButton from "@/components/EditScheduledIntermediateControlButton.vue";
import { useVacationStore } from "@/stores/vacationStore";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import type { Vacation } from "@/stores/vacationStore";
import type { ScheduledFinalControl } from "@/stores/scheduledFinalControlStore";
import type { ScheduledIntermediateControl } from "@/stores/scheduledIntermediateControlStore";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT, DATE_UI_FORMAT } from "@/constants/calendar";
import { useSidebar } from "@/composables/useSidebar";
import {
  edu_schedule_title,
  edu_schedule_collapse_all,
  edu_schedule_expand_all,
  edu_schedule_academic_year,
  edu_schedule_active,
  edu_schedule_semesters,
  edu_schedule_no_semesters,
  edu_schedule_no_semesters_desc,
  edu_schedule_bell,
  edu_schedule_no_bell,
  edu_schedule_no_bell_desc,
  edu_schedule_vacations,
  edu_schedule_no_vacations,
  edu_schedule_no_vacations_desc,
  edu_schedule_controls,
  edu_schedule_final_controls,
  edu_schedule_no_final_controls,
  edu_schedule_no_final_controls_desc,
  edu_schedule_intermediate_controls,
  edu_schedule_no_intermediate_controls,
  edu_schedule_no_intermediate_controls_desc,
  edu_schedule_semester_label,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();

const { contentMargin } = useSidebar();
const activeNavItem = ref("schedule");
const educationScheduleStore = useEducationScheduleStore();

const academicYearStore = useAcademicYearStore();
const { academicYears } = storeToRefs(academicYearStore);

const educationTechnologyStore = useEducationTechnologyStore();
const selectedEducationTechnologyId = ref<string | null>(null);

const academicYearSemesterStore = useAcademicYearSemesterStore();
const vacationStore = useVacationStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();
const scheduledIntermediateControlStore =
  useScheduledIntermediateControlStore();

const selectedAcademicYearId = ref<string | null>(null);
const selectedAcademicYearSemesterId = ref<string | null>(null);

// Year selected for *viewing* its contents (semesters, schedules, etc.) — does NOT affect isActive
const selectedViewYearId = ref<string | null>(null);

// Selected semester for drill-down view
const selectedSemesterId = ref<string | null>(null);

const selectedVacationId = ref<string | null>(null);
const selectedScheduledFinalControlId = ref<string | null>(null);
const selectedScheduledIntermediateControlId = ref<string | null>(null);


// Accordion IDs depend on whether a semester is selected
const topLevelAccordionIds = [
  "education-technologies",
  "academic-years",
  "semesters",
];
const semesterDetailAccordionIds = [
  "schedule",
  "vacations",
  "scheduled-final-controls",
  "scheduled-intermediate-controls",
];

const currentAccordionIds = computed(() => {
  if (selectedSemesterId.value) {
    return [...topLevelAccordionIds, ...semesterDetailAccordionIds];
  }
  return topLevelAccordionIds;
});

// State for tracking expanded accordions
const expandedAccordions = ref<string[]>([...topLevelAccordionIds, ...semesterDetailAccordionIds]);

// Computed property to check if all accordions are expanded
const areAllExpanded = computed(() => {
  return currentAccordionIds.value.every((id) => expandedAccordions.value.includes(id));
});

// Method to toggle all accordions
const toggleAllAccordions = () => {
  if (areAllExpanded.value) {
    // Collapse all
    expandedAccordions.value = [];
  } else {
    // Expand all
    expandedAccordions.value = [...currentAccordionIds.value];
  }
};

// The year whose contents (semesters, schedules, etc.) are currently displayed.
// Defaults to the active year but can be overridden by clicking any card.
const viewYearId = computed(() => {
  return selectedViewYearId.value ?? academicYearStore.getActiveAcademicYear?.id ?? null;
});

const academicYearSemesters = computed(() => {
  if (!viewYearId.value) return [];
  return academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(
    viewYearId.value
  );
});

const schedules = computed(() => {
  if (selectedSemesterId.value) {
    return educationScheduleStore.getSchedulesBySemester(selectedSemesterId.value);
  }
  if (!viewYearId.value) return [];
  return educationScheduleStore.getSchedulesByAcademicYear(
    viewYearId.value
  );
});

const vacations = computed(() => {
  if (selectedSemesterId.value) {
    return vacationStore.getVacationsBySemester(selectedSemesterId.value);
  }
  if (!viewYearId.value) return [];
  return vacationStore.getVacationsByAcademicYear(viewYearId.value);
});

const scheduledFinalControls = computed(() => {
  if (selectedSemesterId.value) {
    return scheduledFinalControlStore.getScheduledFinalControlsBySemester(
      selectedSemesterId.value
    );
  }
  if (!viewYearId.value) return [];
  return scheduledFinalControlStore.getScheduledFinalControlsByAcademicYear(
    viewYearId.value
  );
});

const scheduledIntermediateControls = computed(() => {
  if (selectedSemesterId.value) {
    return scheduledIntermediateControlStore.getScheduledIntermediateControlsBySemester(
      selectedSemesterId.value
    );
  }
  if (!viewYearId.value) return [];
  return scheduledIntermediateControlStore.getScheduledIntermediateControlsByAcademicYear(
    viewYearId.value
  );
});

const selectedScheduleId = ref<string | null>(null);
const selectedSchedule = computed(() =>
  selectedScheduleId.value
    ? schedules.value.find((s) => s.id === selectedScheduleId.value) ?? null
    : null
);

const schedulesGridRef = ref<HTMLElement | null>(null);
let sortableInstance: Sortable | null = null;

const initSortable = () => {
  if (schedulesGridRef.value && !sortableInstance) {
    sortableInstance = new Sortable(schedulesGridRef.value, {
      animation: 150,
      onEnd: async (evt) => {
        if (evt.oldIndex !== undefined && evt.newIndex !== undefined && evt.oldIndex !== evt.newIndex) {
          const newOrderIds = Array.from(schedulesGridRef.value!.children)
            .map((child) => (child as HTMLElement).dataset.id)
            .filter((id): id is string => !!id);
          
          try {
            await educationScheduleStore.reorderSchedules(newOrderIds);
          } catch (error) {
            console.error("Failed to reorder:", error);
          }
        }
      },
    });
  }
};

watch(() => schedules.value.length, () => {
  nextTick(() => {
    if (schedulesGridRef.value && !sortableInstance) {
      initSortable();
    }
  });
});

// Auto-select the currently active semester when semesters load or year changes
watch(
  [() => academicYearStore.getActiveAcademicYear, () => academicYearSemesterStore.academicYearSemesters],
  ([activeYear]) => {
    if (!activeYear) return;
    // Only auto-select if nothing is selected yet, or if there's no longer a valid selection
    const currentlyValid = selectedAcademicYearSemesterId.value &&
      academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(activeYear.id)
        .some(s => s.id === selectedAcademicYearSemesterId.value);
    if (!currentlyValid) {
      const autoSemester = academicYearSemesterStore.getAutoSelectedSemesterForYear(activeYear.id);
      if (autoSemester) {
        selectedAcademicYearSemesterId.value = autoSemester.id;
        selectedSemesterId.value = autoSemester.id;
      }
    }
    // If selectedSemesterId is not valid for the current year, auto-select
    if (selectedSemesterId.value) {
      const stillValid = academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(activeYear.id)
        .some(s => s.id === selectedSemesterId.value);
      if (!stillValid) {
        const autoSemester = academicYearSemesterStore.getAutoSelectedSemesterForYear(activeYear.id);
        selectedSemesterId.value = autoSemester?.id ?? null;
      }
    } else {
      // No semester selected yet — auto-select
      const autoSemester = academicYearSemesterStore.getAutoSelectedSemesterForYear(activeYear.id);
      if (autoSemester) {
        selectedSemesterId.value = autoSemester.id;
      }
    }
  },
  { immediate: true }
);

// When a semester is selected for drill-down, auto-expand its detail sections
watch(
  selectedSemesterId,
  (newId) => {
    if (newId) {
      // Add semester detail accordion sections to expanded list
      const newExpanded = [...expandedAccordions.value];
      for (const id of semesterDetailAccordionIds) {
        if (!newExpanded.includes(id)) {
          newExpanded.push(id);
        }
      }
      expandedAccordions.value = newExpanded;
    }
  }
);

onBeforeUnmount(() => {
  if (sortableInstance) {
    sortableInstance.destroy();
  }
});

const openEditSchedule = async (schedule: EducationSchedule) => {
  selectedScheduleId.value = schedule.id;
  await nextTick();
  const targetEl = document.getElementById(`schedule-item-${schedule.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-schedule-popover-${schedule.id}`, targetEl);
  }
};

const handleSetActiveAcademicYear = (academicYear: AcademicYear) => {
  academicYearStore.setActiveAcademicYear(academicYear.id);
};

// Select a year for viewing without changing the active year
const handleSelectAcademicYear = (academicYear: AcademicYear) => {
  selectedViewYearId.value = academicYear.id;
  // Reset semester drill-down when switching year view
  selectedSemesterId.value = null;
  selectedAcademicYearSemesterId.value = null;
};

// Card styling: "selected for viewing" gets a secondary highlight, "active" gets primary
const getAcademicYearCardClass = (academicYear: AcademicYear) => {
  const isViewing = viewYearId.value === academicYear.id;
  if (academicYear.isActive && isViewing) {
    return 'bg-card border-primary ring-1 ring-primary/20 shadow-md';
  }
  if (academicYear.isActive) {
    return 'bg-card border-primary ring-1 ring-primary/20 shadow-md';
  }
  if (isViewing) {
    return 'bg-card border-secondary ring-1 ring-secondary/20 shadow-sm';
  }
  return 'bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm';
};

const openEditAcademicYear = async (academicYear: AcademicYear) => {
  selectedAcademicYearId.value = academicYear.id;
  await nextTick();
  const targetEl = document.getElementById(
    `academic-year-item-${academicYear.id}`
  );
  if (targetEl) {
    f7.popover.open(`#edit-academic-year-popover-${academicYear.id}`, targetEl);
  }
};

const openEditEducationTechnology = async (technology: EducationTechnology) => {
  selectedEducationTechnologyId.value = technology.id;
  await nextTick();
  const targetEl = document.getElementById(
    `education-technology-item-${technology.id}`
  );
  if (targetEl) {
    f7.popover.open(`#edit-education-technology-popover-${technology.id}`, targetEl);
  }
};

// Semester card click — drill down to show related sections
const handleSemesterCardClick = (academicYearSemester: AcademicYearSemester) => {
  selectedSemesterId.value = academicYearSemester.id;
  selectedAcademicYearSemesterId.value = academicYearSemester.id;
};


// Semester card styling — highlight the selected (drilled-into) semester
const getSemesterCardClass = (semester: AcademicYearSemester) => {
  if (selectedSemesterId.value === semester.id) {
    return 'bg-card border-primary ring-1 ring-primary/20 shadow-md';
  }
  if (academicYearSemesterStore.isSemesterActive(semester)) {
    return 'bg-card border-primary/50 ring-1 ring-primary/10 shadow-sm';
  }
  return 'bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm';
};

const getSemesterTextClass = (semester: AcademicYearSemester) => {
  if (selectedSemesterId.value === semester.id || academicYearSemesterStore.isSemesterActive(semester)) {
    return 'text-foreground';
  }
  return 'text-muted-foreground';
};

const openEditAcademicYearSemester = async (
  academicYearSemester: AcademicYearSemester
) => {
  selectedAcademicYearSemesterId.value = academicYearSemester.id;
  await nextTick();
  const targetEl = document.getElementById(
    `academic-year-semester-item-${academicYearSemester.id}`
  );
  if (targetEl) {
    f7.popover.open(
      `#edit-academic-year-semester-popover-${academicYearSemester.id}`,
      targetEl
    );
  }
};



function formatUiDate(value: string | Date | undefined | null) {
  if (!value) return "";
  // Try storage format first, then UI format, then generic parsing
  let d = dayjs(String(value), DATE_STORAGE_FORMAT, true);
  if (!d.isValid()) d = dayjs(String(value), DATE_UI_FORMAT, true);
  if (!d.isValid()) d = dayjs(value as any);
  return d.isValid() ? d.format(DATE_UI_FORMAT) : String(value);
}
const deleteAcademicYear = (academicYear: AcademicYear) => {
  if (academicYear.isActive) {
    f7.dialog.alert("Нельзя удалить активный учебный год.");
    return;
  }
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить учебный год "${academicYear.name}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление учебного года",
    async () => {
      try {
        await academicYearStore.deleteAcademicYear(academicYear.id);
      } catch (error) {
        console.error("Failed to delete academic year:", error);
        f7.dialog.alert("Произошла ошибка при удалении учебного года.");
      }
    }
  );
};

const deleteAcademicYearSemester = (semester: AcademicYearSemester) => {
  if (academicYearSemesterStore.isSemesterActive(semester)) {
    f7.dialog.alert("Нельзя удалить активный семестр.");
    return;
  }
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить ${semester.semesterNumber}-й семестр?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление семестра",
    async () => {
      try {
        await academicYearSemesterStore.deleteAcademicYearSemester(semester.id);
        // If the deleted semester was the one being viewed, clear selection
        if (selectedSemesterId.value === semester.id) {
          selectedSemesterId.value = null;
        }
      } catch (error) {
        console.error("Failed to delete academic year semester:", error);
        f7.dialog.alert("Произошла ошибка при удалении семестра.");
      }
    }
  );
};


</script>
