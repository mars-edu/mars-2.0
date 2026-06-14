<template>
  <div>
    <button
      id="copy-final-control-button"
      class="h-7 px-3 flex items-center justify-center text-white bg-blue-500 hover:bg-blue-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed gap-1.5"
      aria-label="Копировать итоговый контроль"
      type="button"
      @click.stop="openPopover"
      :disabled="!hasData"
      :title="hasData ? 'Копировать итоговый контроль' : 'Нет доступных данных для копирования'"
    >
      <IconCopy class="w-3.5 h-3.5 text-white" />
      <span>Копировать</span>
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="copy-final-control-popover"
      style="width: 600px !important"
      target="#copy-final-control-button"
      :on-closed="resetForm"
    >
      <div class="bg-card text-card-foreground">
        <PopoverHeader
          title="Копировать итоговый контроль"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || scheduledFinalControlStore.error"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || scheduledFinalControlStore.error }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground">
              Выберите семестр для копирования
              <span class="text-destructive ml-1">*</span>
            </label>
            <div
              v-if="availableSemesters.length === 0"
              class="p-4 text-center text-muted-foreground"
            >
              Нет доступных семестров с итоговым контролем
            </div>
            <div v-else class="space-y-2">
              <div
                v-for="semData in availableSemesters"
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
                    {{ semData.itemCount }}
                    {{ pluralize(semData.itemCount) }}
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
              Итоговый контроль из выбранного семестра будет скопирован в
              текущий семестр. Существующие записи будут заменены.
            </p>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleCopy"
          :disabled="!selectedSemesterId || scheduledFinalControlStore.loading"
          :is-loading="scheduledFinalControlStore.loading"
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
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  semesterId: string;
}>();

const scheduledFinalControlStore = useScheduledFinalControlStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();

const selectedSemesterId = ref<string | null>(null);
const formError = ref("");

const activeAcademicYear = computed(
  () => academicYearStore.getActiveAcademicYear
);

const availableSemesters = computed(() => {
  if (!activeAcademicYear.value) return [];

  const allSemesters = academicYearSemesterStore.academicYearSemesters;

  return allSemesters
    .filter((semester) => semester.id !== props.semesterId)
    .map((semester) => {
      const items = scheduledFinalControlStore.getScheduledFinalControlsBySemester(semester.id);
      const year = academicYearStore.getAcademicYearById(semester.academicYearId);
      return {
        semester,
        yearName: year?.name || "",
        itemCount: items.length,
      };
    })
    .filter((semData) => semData.itemCount > 0)
    .sort((a, b) => {
      if (a.yearName !== b.yearName) return b.yearName.localeCompare(a.yearName);
      return b.semester.semesterNumber - a.semester.semesterNumber;
    });
});

const hasData = computed(() => availableSemesters.value.length > 0);

const pluralize = (count: number): string => {
  if (count % 10 === 1 && count % 100 !== 11) return "запись";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return "записи";
  return "записей";
};

const openPopover = () => {
  if (!hasData.value) return;
  f7.popover.open("#copy-final-control-popover", "#copy-final-control-button");
};

const closePopover = () => {
  f7.popover.close("#copy-final-control-popover");
  resetForm();
};

const handleCopy = async () => {
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
    await scheduledFinalControlStore.copyFromSemester(
      selectedSemesterId.value,
      props.semesterId,
      activeYear.id
    );

    f7.toast.show({
      text: "Итоговый контроль успешно скопирован",
      closeTimeout: 2000,
      position: "center",
    });

    closePopover();
  } catch (error) {
    console.error("Failed to copy final controls:", error);
    formError.value = "Произошла ошибка при копировании";
  }
};

const resetForm = () => {
  selectedSemesterId.value = null;
  formError.value = "";
  scheduledFinalControlStore.clearError();
};
</script>
