<template>
  <div>
    <button
      id="add-education-schedule-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      aria-label="Добавить время"
      type="button"
      @click.stop="openAddSchedulePopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-education-schedule-popover"
      style="width: 600px !important"
      target="#add-education-schedule-button"
    
      :on-closed="resetForm">
      <div class="education-schedule-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || educationScheduleStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || educationScheduleStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="schedule-start-time">
              Время начала
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="schedule-start-time"
              type="text"
              readonly
              v-model:value="startTime"
              placeholder="Введите время начала"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="schedule-end-time">
              Время окончания
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="schedule-end-time"
              type="text"
              readonly
              v-model:value="endTime"
              placeholder="Введите время окончания"
            ></f7-input>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveSchedule"
          :disabled="!isFormValid || educationScheduleStore.isLoading"
          :is-loading="educationScheduleStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { educationScheduleSchema } from "@/validators/schedule";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{ semesterId: string }>();

const educationScheduleStore = useEducationScheduleStore();
const academicYearStore = useAcademicYearStore();

const startTime = ref("");
const endTime = ref("");
const formError = ref("");

let startTimePicker: any = null;
let endTimePicker: any = null;

const validationResult = computed(() => {
  return educationScheduleSchema.safeParse({
    startTime: startTime.value,
    endTime: endTime.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const createPicker = (inputEl: string, valueRef: any) => {
  const hours = Array.from({ length: 24 }, (_, i) =>
    i.toString().padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    i.toString().padStart(2, "0")
  );

  const initialValue = valueRef.value
    ? valueRef.value.split(":")
    : ["08", "30"];

  return f7.picker.create({
    inputEl: inputEl,
    rotateEffect: true,
    value: initialValue,
    formatValue(values: any[]) {
      return `${values[0]}:${values[1]}`;
    },
    cols: [
      {
        textAlign: "center",
        values: hours,
      },
      {
        divider: true,
        content: ":",
      },
      {
        textAlign: "center",
        values: minutes,
      },
    ],
    on: {
      change: (picker: any, value: any) => {
        valueRef.value = `${value[0]}:${value[1]}`;
      },
      close: (picker: any) => {
        // Ensure value is set even if user didn't change anything
        const currentValue = picker.getValue();
        if (currentValue && currentValue.length >= 2) {
          valueRef.value = `${currentValue[0]}:${currentValue[1]}`;
        }
      },
    },
  });
};

onMounted(() => {
  startTimePicker = createPicker("#schedule-start-time", startTime);
  endTimePicker = createPicker("#schedule-end-time", endTime);
});

onBeforeUnmount(() => {
  startTimePicker?.destroy();
  endTimePicker?.destroy();
});

const openAddSchedulePopover = () => {
  // Reset form values with defaults
  startTime.value = "08:30";
  endTime.value = "08:30";
  formError.value = "";

  f7.popover.open(
    "#add-education-schedule-popover",
    "#add-education-schedule-button"
  );
};

const closeAddSchedulePopover = () => {
  f7.popover.close("#add-education-schedule-popover");
  resetForm();
};

const handleSaveSchedule = async () => {
  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      const issues = validationResult.value.error.issues;
      if (issues.length > 0) {
        formError.value = issues[0].message;
      }
    }
    return;
  }

  try {
    const activeAcademicYear = academicYearStore.getActiveAcademicYear;
    if (!activeAcademicYear) {
      formError.value = "Пожалуйста, выберите активный учебный год";
      return;
    }

    await educationScheduleStore.addSchedule({
      startTime: startTime.value,
      endTime: endTime.value,
      academicYearId: activeAcademicYear.id,
      semesterId: props.semesterId,
    });
    closeAddSchedulePopover();
  } catch (error) {
    console.error("Failed to add schedule:", error);
  }
};

const resetForm = () => {
  formError.value = "";
  educationScheduleStore.clearError();
};
</script>
