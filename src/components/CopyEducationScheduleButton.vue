<template>
  <div>
    <button
      id="copy-education-schedule-button"
      class="h-7 px-3 flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-1.5"
      aria-label="Копировать из предыдущего семестра"
      type="button"
      @click.stop="openCopySchedulePopover"
      :disabled="!hasOtherSemestersWithSchedules"
      :title="hasOtherSemestersWithSchedules ? 'Копировать расписание' : 'Нет доступных расписаний для копирования'"
    >
      <IconCopy class="w-3.5 h-3.5 text-white" />
      <span>Копировать</span>
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="copy-education-schedule-popover"
      style="width: 600px !important"
      target="#copy-education-schedule-button"
    
      :on-closed="resetForm"
    >
      <div class="copy-schedule-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Копировать расписание звонков"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || educationScheduleStore.error"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || educationScheduleStore.error }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground">
              Выберите семестр для копирования
              <span class="text-destructive ml-1">*</span>
            </label>
            <div
              v-if="availableSemestersWithSchedules.length === 0"
              class="p-4 text-center text-muted-foreground"
            >
              Нет доступных семестров с расписанием звонков
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="semData in availableSemestersWithSchedules"
                :key="semData.semester.id"
                @click="selectedSemesterId = semData.semester.id"
                class="flex items-center justify-between p-3 border border-border rounded-lg bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                :class="{
                  'border-primary bg-primary/5':
                    selectedSemesterId === semData.semester.id,
                }"
              >
                <div class="flex flex-col">
                  <span class="font-medium">
                    {{ semData.yearName }} — {{ semData.semester.semesterName || `Семестр ${semData.semester.semesterNumber}` }}
                  </span>
                  <span class="text-xs text-muted-foreground">
                    {{ semData.scheduleCount }}
                    {{ pluralizeSchedule(semData.scheduleCount) }}
                  </span>
                </div>
                <IconCircleCheck
                  v-if="selectedSemesterId === semData.semester.id"
                  class="w-6 h-6 text-primary"
                />
              </div>
            </div>
          </div>

          <div
            v-if="selectedSemesterId"
            class="p-3 bg-muted/30 rounded-lg border border-border"
          >
            <p class="text-sm text-muted-foreground">
              Расписание звонков из выбранного семестра будет скопировано в
              текущий семестр. Существующие записи будут заменены.
            </p>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleCopySchedule"
          :disabled="!selectedSemesterId || educationScheduleStore.loading"
          :is-loading="educationScheduleStore.loading"
          save-text="Копировать"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7 } from "framework7-vue";
import IconCopy from "~icons/lucide/copy";
import IconCircleCheck from "~icons/lucide/circle-check";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  semesterId: string;
}>();

const educationScheduleStore = useEducationScheduleStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();

const selectedSemesterId = ref<string | null>(null);
const formError = ref("");

const activeAcademicYear = computed(
  () => academicYearStore.getActiveAcademicYear
);

const availableSemestersWithSchedules = computed(() => {
  if (!activeAcademicYear.value) return [];

  // Get all semesters across all academic years
  const allSemesters = academicYearSemesterStore.academicYearSemesters;

  return allSemesters
    .filter((semester) => semester.id !== props.semesterId) // Exclude current semester
    .map((semester) => {
      const schedules = educationScheduleStore.getSchedulesBySemester(semester.id);
      const year = academicYearStore.getAcademicYearById(semester.academicYearId);
      return {
        semester,
        yearName: year?.name || "",
        scheduleCount: schedules.length,
      };
    })
    .filter((semData) => semData.scheduleCount > 0)
    .sort((a, b) => {
      // Sort by year name desc, then semester number desc (most recent first)
      if (a.yearName !== b.yearName) return b.yearName.localeCompare(a.yearName);
      return b.semester.semesterNumber - a.semester.semesterNumber;
    });
});

const hasOtherSemestersWithSchedules = computed(
  () => availableSemestersWithSchedules.value.length > 0
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
  if (!hasOtherSemestersWithSchedules.value) {
    return;
  }

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
  if (!selectedSemesterId.value) {
    formError.value = "Пожалуйста, выберите семестр";
    return;
  }

  const activeYear = activeAcademicYear.value;
  if (!activeYear) {
    formError.value = "Нет активного учебного года";
    return;
  }

  try {
    await educationScheduleStore.copySchedulesFromSemester(
      selectedSemesterId.value,
      props.semesterId,
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
  selectedSemesterId.value = null;
  formError.value = "";
  educationScheduleStore.clearError();
};
</script>
