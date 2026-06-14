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
                  @click.stop="handleSetActiveAcademicYear(academicYear)"
                  class="relative group p-4 rounded-xl border transition-all cursor-pointer"
                  :class="academicYear.isActive ? 'bg-card border-primary ring-1 ring-primary/20 shadow-md' : 'bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm'"
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
              <AccordionItem id="schedule">
                <template #title>{{ edu_schedule_bell() }}</template>
                <template #actions>
                  <div class="flex gap-2">
                    <CopyEducationScheduleButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
                    <AddEducationScheduleButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
                  </div>
                </template>
                <div
                  v-if="educationScheduleStore.isLoading"
                  class="p-4 flex justify-center"
                >
                  <f7-preloader></f7-preloader>
                </div>
                <div
                  v-else-if="educationScheduleStore.getError"
                  class="p-4 text-destructive"
                >
                  {{ educationScheduleStore.getError }}
                </div>
                <div v-else-if="schedules.length === 0">
                  <NoData
                    :title="edu_schedule_no_bell()"
                    :description="edu_schedule_no_bell_desc()"
                    :icon="IconClock"
                  />
                </div>
                <div v-else ref="schedulesGridRef" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <div
                    v-for="schedule in schedules"
                    :key="schedule.id"
                    :data-id="schedule.id"
                    class="relative group p-4 bg-muted/20 border border-border rounded-xl hover:bg-card hover:shadow-sm transition-all cursor-pointer"
                    :id="`schedule-item-${schedule.id}`"
                    @click.stop="openEditSchedule(schedule)"
                  >
                    <div class="flex flex-col gap-1">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-bold text-foreground">
                          Урок {{ schedule.lessonNumber }}
                        </span>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            class="p-1 text-muted-foreground hover:text-primary transition-colors"
                            @click.stop="openEditSchedule(schedule)"
                            aria-label="Edit Schedule"
                            type="button"
                          >
                            <IconPencil class="w-[14px] h-[14px]" />
                          </button>
                          <button
                            class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            @click.stop="deleteSchedule(schedule)"
                            aria-label="Delete Schedule"
                            type="button"
                          >
                            <IconTrash class="w-[14px] h-[14px]" />
                          </button>
                        </div>
                      </div>
                      <div class="flex items-center justify-between mt-1">
                        <span class="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                          {{ schedule.startTime }} - {{ schedule.endTime }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <EditEducationScheduleButton
                    v-if="selectedScheduleId"
                    :schedule-id="selectedScheduleId"
                  />
                </div>
              </AccordionItem>

              <!-- Scheduled Final Controls Section -->
              <AccordionItem
                id="scheduled-final-controls"
                
              >
                    <template #title>{{ edu_schedule_final_controls() }}</template>
                    <template #actions>
                      <AddScheduledFinalControlButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
                    </template>
                    <div
                      v-if="scheduledFinalControlStore.isLoading"
                      class="p-4 flex justify-center"
                    >
                      <f7-preloader />
                    </div>
                    <div
                      v-else-if="scheduledFinalControlStore.getError"
                      class="p-4 text-destructive"
                    >
                      {{ scheduledFinalControlStore.getError }}
                    </div>
                    <div v-else-if="scheduledFinalControls.length === 0">
                      <NoData
                        :title="edu_schedule_no_final_controls()"
                        :description="edu_schedule_no_final_controls_desc()"
                        :icon="IconCircleCheck"
                      />
                    </div>
                    <div
                      v-else
                      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    >
                      <div
                        v-for="control in scheduledFinalControls"
                        :key="control.id"
                        class="relative group p-4 rounded-xl border transition-all cursor-pointer bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm"
                        :id="`scheduled-final-control-item-${control.id}`"
                        @click.stop="openEditScheduledFinalControl(control)"
                      >
                        <div class="flex flex-col gap-1 w-full">
                          <div class="flex items-center justify-between">
                            <span class="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                              {{ control.shortName }}
                            </span>
                            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                class="p-1 text-muted-foreground hover:text-primary transition-colors"
                                @click.stop="openEditScheduledFinalControl(control)"
                                aria-label="Edit Scheduled Final Control"
                                type="button"
                              >
                                <IconPencil class="w-[14px] h-[14px]" />
                              </button>
                              <button
                                class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                @click.stop="deleteScheduledFinalControl(control)"
                                aria-label="Delete Scheduled Final Control"
                                type="button"
                              >
                                <IconTrash class="w-[14px] h-[14px]" />
                              </button>
                            </div>
                          </div>
                          <div class="flex items-center justify-between mt-1">
                            <span class="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                              {{ formatUiDate(control.startDate) }} - {{ formatUiDate(control.endDate) }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <EditScheduledFinalControlButton
                        v-if="selectedScheduledFinalControlId"
                        :control-id="selectedScheduledFinalControlId"
                      />
                    </div>
                  </AccordionItem>

                  <!-- Scheduled Intermediate Controls Section -->
                  <AccordionItem
                    id="scheduled-intermediate-controls"
                    
                  >
                    <template #title>{{ edu_schedule_intermediate_controls() }}</template>
                    <template #actions>
                      <AddScheduledIntermediateControlButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
                    </template>
                    <div
                      v-if="scheduledIntermediateControlStore.isLoading"
                      class="p-4 flex justify-center"
                    >
                      <f7-preloader />
                    </div>
                    <div
                      v-else-if="scheduledIntermediateControlStore.getError"
                      class="p-4 text-destructive"
                    >
                      {{ scheduledIntermediateControlStore.getError }}
                    </div>
                    <div v-else-if="scheduledIntermediateControls.length === 0">
                      <NoData
                        :title="edu_schedule_no_intermediate_controls()"
                        :description="edu_schedule_no_intermediate_controls_desc()"
                        :icon="IconCircleCheck"
                      />
                    </div>
                    <div
                      v-else
                      class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                    >
                      <div
                        v-for="control in scheduledIntermediateControls"
                        :key="control.id"
                        class="relative group p-4 rounded-xl border transition-all cursor-pointer bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm"
                        :id="`scheduled-intermediate-control-item-${control.id}`"
                        @click.stop="openEditScheduledIntermediateControl(control)"
                      >
                        <div class="flex flex-col gap-1 w-full">
                          <div class="flex items-center justify-between">
                            <span class="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                              {{ control.shortName }}
                            </span>
                            <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                class="p-1 text-muted-foreground hover:text-primary transition-colors"
                                @click.stop="openEditScheduledIntermediateControl(control)"
                                aria-label="Edit Scheduled Intermediate Control"
                                type="button"
                              >
                                <IconPencil class="w-[14px] h-[14px]" />
                              </button>
                              <button
                                class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                                @click.stop="deleteScheduledIntermediateControl(control)"
                                aria-label="Delete Scheduled Intermediate Control"
                                type="button"
                              >
                                <IconTrash class="w-[14px] h-[14px]" />
                              </button>
                            </div>
                          </div>
                          <div class="flex items-center justify-between mt-1">
                            <span class="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                              {{ formatUiDate(control.startDate) }} - {{ formatUiDate(control.endDate) }}
                            </span>
                          </div>
                        </div>
                      </div>
                      <EditScheduledIntermediateControlButton
                        v-if="selectedScheduledIntermediateControlId"
                        :control-id="selectedScheduledIntermediateControlId"
                      />
                    </div>
                  </AccordionItem>

              <AccordionItem id="vacations" >
                <template #title>{{ edu_schedule_vacations() }}</template>
                <template #actions>
                  <AddVacationButton v-if="selectedSemesterId" :semester-id="selectedSemesterId" />
                </template>
                <div
                  v-if="vacationStore.isLoading"
                  class="p-4 flex justify-center"
                >
                  <f7-preloader />
                </div>
                <div
                  v-else-if="vacationStore.getError"
                  class="p-4 text-destructive"
                >
                  {{ vacationStore.getError }}
                </div>
                <div v-else-if="vacations.length === 0">
                  <NoData
                    :title="edu_schedule_no_vacations()"
                    :description="edu_schedule_no_vacations_desc()"
                    :icon="IconSun"
                  />
                </div>
                <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  <div
                    v-for="vacation in vacations"
                    :key="vacation.id"
                    class="relative group p-4 rounded-xl border transition-all cursor-pointer bg-muted/30 border-border hover:border-border/80 hover:bg-card hover:shadow-sm"
                    :id="`vacation-item-${vacation.id}`"
                    @click.stop="openEditVacation(vacation)"
                  >
                    <div class="flex flex-col gap-1 w-full">
                      <div class="flex items-center justify-between">
                        <span class="text-sm font-bold text-muted-foreground group-hover:text-foreground transition-colors">
                          {{ vacation.shortName }}
                        </span>
                        <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            class="p-1 text-muted-foreground hover:text-primary transition-colors"
                            @click.stop="openEditVacation(vacation)"
                            aria-label="Edit Vacation"
                            type="button"
                          >
                            <IconPencil class="w-[14px] h-[14px]" />
                          </button>
                          <button
                            class="p-1 text-muted-foreground hover:text-destructive transition-colors"
                            @click.stop="deleteVacation(vacation)"
                            aria-label="Delete Vacation"
                            type="button"
                          >
                            <IconTrash class="w-[14px] h-[14px]" />
                          </button>
                        </div>
                      </div>
                      <div class="flex items-center justify-between mt-1">
                        <span class="text-[10px] uppercase tracking-wider font-medium text-muted-foreground">
                          {{ formatUiDate(vacation.startDate) }} - {{ formatUiDate(vacation.endDate) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <EditVacationButton
                    v-if="selectedVacationId"
                    :vacation-id="selectedVacationId"
                  />
                </div>
              </AccordionItem>
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
import AddAcademicYearSemesterButton from "@/components/AddAcademicYearSemesterButton.vue";
import EditAcademicYearSemesterButton from "@/components/EditAcademicYearSemesterButton.vue";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import type { AcademicYearSemester } from "@/stores/academicYearSemesterStore";
import AddVacationButton from "@/components/AddVacationButton.vue";
import EditVacationButton from "@/components/EditVacationButton.vue";
import AddScheduledFinalControlButton from "@/components/AddScheduledFinalControlButton.vue";
import EditScheduledFinalControlButton from "@/components/EditScheduledFinalControlButton.vue";
import AddScheduledIntermediateControlButton from "@/components/AddScheduledIntermediateControlButton.vue";
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

const academicYearSemesterStore = useAcademicYearSemesterStore();
const vacationStore = useVacationStore();
const scheduledFinalControlStore = useScheduledFinalControlStore();
const scheduledIntermediateControlStore =
  useScheduledIntermediateControlStore();

const selectedAcademicYearId = ref<string | null>(null);
const selectedAcademicYearSemesterId = ref<string | null>(null);

// Selected semester for drill-down view
const selectedSemesterId = ref<string | null>(null);

const selectedVacationId = ref<string | null>(null);
const selectedScheduledFinalControlId = ref<string | null>(null);
const selectedScheduledIntermediateControlId = ref<string | null>(null);


// Accordion IDs depend on whether a semester is selected
const topLevelAccordionIds = [
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

const academicYearSemesters = computed(() => {
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (!activeYear) return [];
  return academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(
    activeYear.id
  );
});

const schedules = computed(() => {
  if (selectedSemesterId.value) {
    return educationScheduleStore.getSchedulesBySemester(selectedSemesterId.value);
  }
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (!activeYear) return [];
  return educationScheduleStore.getSchedulesByAcademicYear(
    activeYear.id
  );
});

const vacations = computed(() => {
  if (selectedSemesterId.value) {
    return vacationStore.getVacationsBySemester(selectedSemesterId.value);
  }
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (!activeYear) return [];
  return vacationStore.getVacationsByAcademicYear(activeYear.id);
});

const scheduledFinalControls = computed(() => {
  if (selectedSemesterId.value) {
    return scheduledFinalControlStore.getScheduledFinalControlsBySemester(
      selectedSemesterId.value
    );
  }
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (!activeYear) return [];
  return scheduledFinalControlStore.getScheduledFinalControlsByAcademicYear(
    activeYear.id
  );
});

const scheduledIntermediateControls = computed(() => {
  if (selectedSemesterId.value) {
    return scheduledIntermediateControlStore.getScheduledIntermediateControlsBySemester(
      selectedSemesterId.value
    );
  }
  const activeYear = academicYearStore.getActiveAcademicYear;
  if (!activeYear) return [];
  return scheduledIntermediateControlStore.getScheduledIntermediateControlsByAcademicYear(
    activeYear.id
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

watch(() => schedules.value, () => {
  nextTick(() => {
    if (schedulesGridRef.value && !sortableInstance) {
      initSortable();
    }
  });
}, { deep: true });

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

const openEditVacation = async (vacation: Vacation) => {
  selectedVacationId.value = vacation.id;
  await nextTick();
  const targetEl = document.getElementById(`vacation-item-${vacation.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-vacation-popover-${vacation.id}`, targetEl);
  }
};

const openEditScheduledFinalControl = async (
  control: ScheduledFinalControl
) => {
  selectedScheduledFinalControlId.value = control.id;
  await nextTick();
  const targetEl = document.getElementById(
    `scheduled-final-control-item-${control.id}`
  );
  if (targetEl) {
    f7.popover.open(
      `#edit-scheduled-final-control-popover-${control.id}`,
      targetEl
    );
  }
};

const openEditScheduledIntermediateControl = async (
  control: ScheduledIntermediateControl
) => {
  selectedScheduledIntermediateControlId.value = control.id;
  await nextTick();
  const targetEl = document.getElementById(
    `scheduled-intermediate-control-item-${control.id}`
  );
  if (targetEl) {
    f7.popover.open(
      `#edit-scheduled-intermediate-control-popover-${control.id}`,
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

const deleteSchedule = (schedule: EducationSchedule) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить занятие номер ${schedule.lessonNumber}?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление расписания",
    async () => {
      try {
        await educationScheduleStore.deleteSchedule(schedule.id);
      } catch (error) {
        console.error("Failed to delete schedule:", error);
        f7.dialog.alert("Произошла ошибка при удалении расписания.");
      }
    }
  );
};

const deleteVacation = (vacation: Vacation) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить каникулы "${vacation.shortName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление каникул",
    async () => {
      try {
        await vacationStore.deleteVacation(vacation.id);
      } catch (error) {
        console.error("Failed to delete vacation:", error);
        f7.dialog.alert("Произошла ошибка при удалении каникул.");
      }
    }
  );
};

const deleteScheduledFinalControl = (control: ScheduledFinalControl) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить контроль "${control.shortName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление контроля",
    async () => {
      try {
        await scheduledFinalControlStore.deleteScheduledFinalControl(control.id);
      } catch (error) {
        console.error("Failed to delete scheduled final control:", error);
        f7.dialog.alert("Произошла ошибка при удалении контроля.");
      }
    }
  );
};

const deleteScheduledIntermediateControl = (control: ScheduledIntermediateControl) => {
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить промежуточный контроль "${control.shortName}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление контроля",
    async () => {
      try {
        await scheduledIntermediateControlStore.deleteScheduledIntermediateControl(control.id);
      } catch (error) {
        console.error("Failed to delete scheduled intermediate control:", error);
        f7.dialog.alert("Произошла ошибка при удалении контроля.");
      }
    }
  );
};
</script>
