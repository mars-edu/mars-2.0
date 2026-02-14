<template>
  <div>
    <button
      id="copy-education-schedule-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Копировать расписание"
      type="button"
      @click.stop="openCopySchedulePopover"
      :disabled="!hasOtherYearsWithSchedules"
      :title="hasOtherYearsWithSchedules ? 'Копировать расписание из другого учебного года' : 'Нет доступных учебных годов с расписанием для копирования'"
    >
      <f7-icon
        ios="f7:doc_on_doc"
        md="material:content_copy"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="copy-education-schedule-popover"
      style="width: 600px !important"
      target="#copy-education-schedule-button"
    
      :on-closed="resetForm">
      <div class="copy-schedule-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Копировать расписание звонков"
          :disabled="!selectedYearId || educationScheduleStore.isLoading"
          :is-loading="educationScheduleStore.isLoading"
          :on-cancel="requestClose"
          :on-save="handleCopySchedule"
          save-text="Копировать"
        />

        <div
          v-if="formError || educationScheduleStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || educationScheduleStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground">
              Выберите учебный год для копирования
              <span class="text-destructive ml-1">*</span>
            </label>
            <div
              v-if="availableYearsWithSchedules.length === 0"
              class="p-4 text-center text-muted-foreground"
            >
              Нет доступных учебных годов с расписанием звонков
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="yearData in availableYearsWithSchedules"
                :key="yearData.year.id"
                @click="selectedYearId = yearData.year.id"
                class="flex items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                :class="{
                  'border-primary bg-primary/5':
                    selectedYearId === yearData.year.id,
                }"
              >
                <div class="flex flex-col">
                  <span class="font-medium">{{ yearData.year.name }}</span>
                  <span class="text-xs text-muted-foreground">
                    {{ yearData.scheduleCount }}
                    {{ pluralizeSchedule(yearData.scheduleCount) }}
                  </span>
                </div>
                <f7-icon
                  v-if="selectedYearId === yearData.year.id"
                  ios="f7:checkmark_circle_fill"
                  md="material:check_circle"
                  size="24px"
                  class="text-primary"
                />
              </div>
            </div>
          </div>

          <div
            v-if="selectedYearId"
            class="p-3 bg-muted/30 rounded-lg border border-border"
          >
            <p class="text-sm text-muted-foreground">
              Расписание звонков из выбранного учебного года будет скопировано в
              активный учебный год
              <span class="font-medium text-foreground">
                ({{ activeAcademicYear?.name }})
              </span>
            </p>
          </div>
        </div>
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Icon } from "framework7-vue";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const educationScheduleStore = useEducationScheduleStore();
const academicYearStore = useAcademicYearStore();

const selectedYearId = ref<string | null>(null);
const formError = ref("");

const activeAcademicYear = computed(
  () => academicYearStore.getActiveAcademicYear
);

const availableYearsWithSchedules = computed(() => {
  const activeYear = activeAcademicYear.value;
  if (!activeYear) return [];

  return academicYearStore.getSortedAcademicYears
    .filter((year) => year.id !== activeYear.id)
    .map((year) => {
      const schedules = educationScheduleStore.getSchedulesByAcademicYear(
        year.id
      );
      return {
        year,
        scheduleCount: schedules.length,
      };
    })
    .filter((yearData) => yearData.scheduleCount > 0)
    .reverse();
});

const hasOtherYearsWithSchedules = computed(
  () => availableYearsWithSchedules.value.length > 0
);

const pluralizeSchedule = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) {
    return "урок";
  } else if (
    [2, 3, 4].includes(count % 10) &&
    ![12, 13, 14].includes(count % 100)
  ) {
    return "урока";
  } else {
    return "уроков";
  }
};

const openCopySchedulePopover = () => {
  console.log("[CopyEducationScheduleButton] openCopySchedulePopover called");
  console.log("[CopyEducationScheduleButton] hasOtherYearsWithSchedules:", hasOtherYearsWithSchedules.value);
  console.log("[CopyEducationScheduleButton] availableYearsWithSchedules:", availableYearsWithSchedules.value);
  console.log("[CopyEducationScheduleButton] activeAcademicYear:", activeAcademicYear.value);
  console.log("[CopyEducationScheduleButton] allAcademicYears:", academicYearStore.getSortedAcademicYears);

  if (!hasOtherYearsWithSchedules.value) {
    console.log("[CopyEducationScheduleButton] No other years with schedules, not opening popover");
    return;
  }

  console.log("[CopyEducationScheduleButton] Opening popover...");
  f7.popover.open(
    "#copy-education-schedule-popover",
    "#copy-education-schedule-button"
  );
};

const closeCopySchedulePopover = () => {
  f7.popover.close("#copy-education-schedule-popover");
  resetForm();
};

const handleCopySchedule = async () => {
  if (!selectedYearId.value) {
    formError.value = "Пожалуйста, выберите учебный год";
    return;
  }

  const activeYear = activeAcademicYear.value;
  if (!activeYear) {
    formError.value = "Нет активного учебного года";
    return;
  }

  try {
    await educationScheduleStore.copySchedulesFromYear(
      selectedYearId.value,
      activeYear.id
    );

    f7.toast.show({
      text: "Расписание звонков успешно скопировано",
      closeTimeout: 2000,
      position: "center",
    });

    closeCopySchedulePopover();
  } catch (error) {
    console.error("Failed to copy schedules:", error);
    formError.value = "Произошла ошибка при копировании расписания";
  }
};

const resetForm = () => {
  selectedYearId.value = null;
  formError.value = "";
  educationScheduleStore.clearError();
};
</script>

