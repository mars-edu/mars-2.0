<template>
  <f7-page
    name="education-schedule"
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
                >График образовательного процесса:</span
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
                {{ areAllExpanded ? "Свернуть все" : "Развернуть все" }}
              </f7-button>
            </div>
          </div>

          <Accordion v-model:expanded-items="expandedAccordions">
            <AccordionItem id="academic-years" :default-expanded="false">
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
                  v-for="academicYear in academicYearStore.getSortedAcademicYears"
                  :key="academicYear.id"
                  @click.stop="handleSetActiveAcademicYear(academicYear)"
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
                    @click.stop="handleSetActiveAcademicYear(academicYear)"
                    aria-label="Set Active"
                    type="button"
                  >
                    <IconCircleCheck class="w-[18px] h-[18px] text-primary" />
                  </button>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditAcademicYear(academicYear)"
                    aria-label="Edit Academic Year"
                    type="button"
                  >
                    <IconPencil class="w-[18px] h-[18px] text-primary" />
                  </button>
                </div>
                <EditAcademicYearButton
                  v-if="selectedAcademicYearId"
                  :academic-year-id="selectedAcademicYearId"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="semesters" :default-expanded="false">
              <template #title>Семестры:</template>
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
                  title="Нет семестров"
                  description="Для данного учебного года семестры не добавлены"
                  :icon="IconCalendar"
                />
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="academicYearSemester in academicYearSemesters"
                  :key="academicYearSemester.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`academic-year-semester-item-${academicYearSemester.id}`"
                  :class="{
                    'border-primary':
                      academicYearSemesterStore.isSemesterActive(
                        academicYearSemester
                      ),
                  }"
                  @click.stop="
                    openEditAcademicYearSemester(academicYearSemester)
                  "
                >
                  <div class="flex flex-col w-full">
                    <span class="font-medium">{{
                      `Семестр ${academicYearSemester.semesterNumber}`
                    }}</span>
                    <span class="text-xs px-2 py-0.5"
                      >{{ formatUiDate(academicYearSemester.startDate) }}-
                      {{ formatUiDate(academicYearSemester.endDate) }}</span
                    >
                  </div>
                  <span
                    v-if="
                      academicYearSemesterStore.isSemesterActive(
                        academicYearSemester
                      )
                    "
                    class="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full"
                  >
                    Активный
                  </span>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="
                      openEditAcademicYearSemester(academicYearSemester)
                    "
                    aria-label="Edit Academic Year Semester"
                    type="button"
                  >
                    <IconPencil class="w-[18px] h-[18px] text-primary" />
                  </button>
                </div>
                <EditAcademicYearSemesterButton
                  v-if="selectedAcademicYearSemesterId"
                  :academic-year-semester-id="selectedAcademicYearSemesterId"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="schedule">
              <template #title>Расписание звонков:</template>
              <template #actions>
                <div class="flex gap-2">
                  <CopyEducationScheduleButton />
                  <AddEducationScheduleButton />
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
                  title="Нет расписания звонков"
                  description="Для данного учебного года расписание звонков не добавлено"
                  :icon="IconClock"
                />
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="schedule in schedules"
                  :key="schedule.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`schedule-item-${schedule.id}`"
                  @click.stop="openEditSchedule(schedule)"
                >
                  <span class="font-medium">
                    {{ schedule.lessonNumber }}.
                  </span>
                  <span class="text-sm">
                    {{ schedule.startTime }} - {{ schedule.endTime }}
                  </span>
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditSchedule(schedule)"
                    aria-label="Edit Schedule"
                    type="button"
                  >
                    <IconPencil class="w-[18px] h-[18px] text-primary" />
                  </button>
                </div>
                <EditEducationScheduleButton
                  v-if="selectedScheduleId"
                  :schedule-id="selectedScheduleId"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="vacations" :default-expanded="false">
              <template #title>Каникулы:</template>
              <template #actions>
                <AddVacationButton />
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
                  title="Нет каникул"
                  description="Для данного учебного года каникулы не добавлены"
                  :icon="IconSun"
                />
              </div>
              <div v-else class="flex flex-wrap items-center gap-2 md:gap-3">
                <div
                  v-for="vacation in vacations"
                  :key="vacation.id"
                  class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                  :id="`vacation-item-${vacation.id}`"
                  @click.stop="openEditVacation(vacation)"
                >
                  <span class="font-medium">{{ vacation.shortName }}</span>
                  <span class="text-xs px-2 py-0.5"
                    >{{ formatUiDate(vacation.startDate) }} -
                    {{ formatUiDate(vacation.endDate) }}</span
                  >
                  <button
                    class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                    @click.stop="openEditVacation(vacation)"
                    aria-label="Edit Vacation"
                    type="button"
                  >
                    <IconPencil class="w-[18px] h-[18px] text-primary" />
                  </button>
                </div>
                <EditVacationButton
                  v-if="selectedVacationId"
                  :vacation-id="selectedVacationId"
                />
              </div>
            </AccordionItem>

            <AccordionItem id="controls" :default-expanded="false">
              <template #title>Контроли:</template>
              <Accordion v-model:expanded-items="expandedControlAccordions">
                <!-- Scheduled Final Controls Section -->
                <AccordionItem
                  id="scheduled-final-controls"
                  :default-expanded="false"
                >
                  <template #title>Форма итогового контроля:</template>
                  <template #actions>
                    <AddScheduledFinalControlButton />
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
                      title="Нет итоговых контролей"
                      description="Для данного учебного года итоговые контроли не добавлены"
                      :icon="IconCircleCheck"
                    />
                  </div>
                  <div
                    v-else
                    class="flex flex-wrap items-center gap-2 md:gap-3"
                  >
                    <div
                      v-for="control in scheduledFinalControls"
                      :key="control.id"
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                      :id="`scheduled-final-control-item-${control.id}`"
                      @click.stop="openEditScheduledFinalControl(control)"
                    >
                      <div class="flex flex-col">
                        <span class="font-medium">{{ control.shortName }}</span>
                        <span class="text-xs px-2 py-0.5"
                          >{{ formatUiDate(control.startDate) }} -
                          {{ formatUiDate(control.endDate) }}</span
                        >
                      </div>
                      <button
                        class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                        @click.stop="openEditScheduledFinalControl(control)"
                        aria-label="Edit Scheduled Final Control"
                        type="button"
                      >
                        <IconPencil class="w-[18px] h-[18px] text-primary" />
                      </button>
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
                  :default-expanded="false"
                >
                  <template #title>Промежуточный контроль:</template>
                  <template #actions>
                    <AddScheduledIntermediateControlButton />
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
                      title="Нет промежуточных контролей"
                      description="Для данного учебного года промежуточные контроли не добавлены"
                      :icon="IconCircleCheck"
                    />
                  </div>
                  <div
                    v-else
                    class="flex flex-wrap items-center gap-2 md:gap-3"
                  >
                    <div
                      v-for="control in scheduledIntermediateControls"
                      :key="control.id"
                      class="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                      :id="`scheduled-intermediate-control-item-${control.id}`"
                      @click.stop="
                        openEditScheduledIntermediateControl(control)
                      "
                    >
                      <div class="flex flex-col">
                        <span class="font-medium">{{ control.shortName }}</span>
                        <span class="text-xs px-2 py-0.5"
                          >{{ formatUiDate(control.startDate) }} -
                          {{ formatUiDate(control.endDate) }}</span
                        >
                      </div>
                      <button
                        class="p-1 hover:bg-primary/10 rounded-md transition-colors"
                        @click.stop="
                          openEditScheduledIntermediateControl(control)
                        "
                        aria-label="Edit Scheduled Intermediate Control"
                        type="button"
                      >
                        <IconPencil class="w-[18px] h-[18px] text-primary" />
                      </button>
                    </div>
                    <EditScheduledIntermediateControlButton
                      v-if="selectedScheduledIntermediateControlId"
                      :control-id="selectedScheduledIntermediateControlId"
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
import { ref, computed, nextTick } from "vue";
import { f7Page, f7, f7Preloader } from "framework7-vue";
import IconCalendar from "~icons/lucide/calendar";
import IconClock from "~icons/lucide/clock";
import IconSun from "~icons/lucide/sun";
import IconCircleCheck from "~icons/lucide/circle-check";
import IconPencil from "~icons/lucide/pencil";
import IconChevronUp from "~icons/lucide/chevron-up";
import IconChevronDown from "~icons/lucide/chevron-down";
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

const { contentMargin } = useSidebar();
const activeNavItem = ref("education-schedule");
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
const selectedVacationId = ref<string | null>(null);
const selectedScheduledFinalControlId = ref<string | null>(null);
const selectedScheduledIntermediateControlId = ref<string | null>(null);
const selectedScheduleId = ref<string | null>(null);
const selectedSchedule = computed(() =>
  selectedScheduleId.value
    ? schedules.value.find((s) => s.id === selectedScheduleId.value) ?? null
    : null
);

// Accordion IDs for expand/collapse all functionality
const accordionIds = [
  "academic-years",
  "semesters",
  "schedule",
  "vacations",
  "controls",
];

// State for tracking expanded accordions
const expandedAccordions = ref<string[]>([]);
const expandedControlAccordions = ref<string[]>([]);

// Computed property to check if all accordions are expanded
const areAllExpanded = computed(() => {
  return accordionIds.every((id) => expandedAccordions.value.includes(id));
});

// Method to toggle all accordions
const toggleAllAccordions = () => {
  if (areAllExpanded.value) {
    // Collapse all
    expandedAccordions.value = [];
  } else {
    // Expand all
    expandedAccordions.value = [...accordionIds];
  }
};

const academicYearSemesters = computed(() => {
  const activeAcademicYear = academicYearStore.getActiveAcademicYear;
  if (!activeAcademicYear) return [];
  return academicYearSemesterStore.getAcademicYearSemestersByAcademicYear(
    activeAcademicYear.id
  );
});

const schedules = computed(() => {
  const activeAcademicYear = academicYearStore.getActiveAcademicYear;
  if (!activeAcademicYear) return [];
  return educationScheduleStore.getSchedulesByAcademicYear(
    activeAcademicYear.id
  );
});

const vacations = computed(() => {
  const activeAcademicYear = academicYearStore.getActiveAcademicYear;
  if (!activeAcademicYear) return [];
  return vacationStore.getVacationsByAcademicYear(activeAcademicYear.id);
});

const scheduledFinalControls = computed(() => {
  const activeAcademicYear = academicYearStore.getActiveAcademicYear;
  if (!activeAcademicYear) return [];
  return scheduledFinalControlStore.getScheduledFinalControlsByAcademicYear(
    activeAcademicYear.id
  );
});

const scheduledIntermediateControls = computed(() => {
  const activeAcademicYear = academicYearStore.getActiveAcademicYear;
  if (!activeAcademicYear) return [];
  return scheduledIntermediateControlStore.getScheduledIntermediateControlsByAcademicYear(
    activeAcademicYear.id
  );
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
</script>
