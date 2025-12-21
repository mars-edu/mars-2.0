<template>
  <div>
    <f7-popover
      :id="'edit-schedule-popover-' + schedule.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#schedule-item-${schedule.id}`"
    >
      <div class="schedule-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || educationScheduleStore.isLoading"
          :is-loading="educationScheduleStore.isLoading"
          :on-cancel="closeEditSchedulePopover"
          :on-save="handleUpdateSchedule"
        />

        <div
          v-if="formError || educationScheduleStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || educationScheduleStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="schedule-lesson-number">
              Номер урока
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="schedule-lesson-number"
              type="number"
              v-model:value="lessonNumber"
              placeholder="Введите номер урока"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              :for="'schedule-start-time-' + schedule.id"
            >
              Время начала
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              :id="'schedule-start-time-' + schedule.id"
              type="text"
              readonly
              :value="startTime"
              placeholder="Введите время начала"
            ></f7-input>
          </div>
          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              :for="'schedule-end-time-' + schedule.id"
            >
              Время окончания
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              :id="'schedule-end-time-' + schedule.id"
              type="text"
              readonly
              :value="endTime"
              placeholder="Введите время окончания"
            ></f7-input>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="educationScheduleStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  schedule: EducationSchedule;
}>();

const emit = defineEmits<{
  (e: "close"): void;
}>();

const educationScheduleStore = useEducationScheduleStore();

const lessonNumber = ref(props.schedule.lessonNumber.toString());
const startTime = ref(props.schedule.startTime);
const endTime = ref(props.schedule.endTime);
const formError = ref("");

let startTimePicker: any = null;
let endTimePicker: any = null;

const timeRegex = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

const scheduleSchema = z.object({
  lessonNumber: z.coerce.number().min(1, "Пожалуйста, введите номер урока"),
  startTime: z.string().regex(timeRegex, "Неверный формат времени (HH:mm)"),
  endTime: z.string().regex(timeRegex, "Неверный формат времени (HH:mm)"),
});

const validationResult = computed(() => {
  return scheduleSchema.safeParse({
    lessonNumber: lessonNumber.value,
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
    },
  });
};

onMounted(() => {
  startTimePicker = createPicker(
    `#schedule-start-time-${props.schedule.id}`,
    startTime
  );
  endTimePicker = createPicker(
    `#schedule-end-time-${props.schedule.id}`,
    endTime
  );

  // Open the popover after the component is mounted
  const targetEl = document.getElementById(`schedule-item-${props.schedule.id}`);
  if (targetEl) {
    f7.popover.open(`#edit-schedule-popover-${props.schedule.id}`, targetEl);
  }
});

onBeforeUnmount(() => {
  startTimePicker?.destroy();
  endTimePicker?.destroy();
});

const closeEditSchedulePopover = () => {
  f7.popover.close(`#edit-schedule-popover-${props.schedule.id}`);
  resetForm();
  emit("close");
};

const handleUpdateSchedule = async () => {
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
    await educationScheduleStore.updateSchedule(props.schedule.id, {
      lessonNumber: Number(lessonNumber.value),
      startTime: startTime.value,
      endTime: endTime.value,
    });
    closeEditSchedulePopover();
  } catch (error) {
    console.error("Failed to update schedule:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(`#edit-schedule-popover-${props.schedule.id}`);
  emit("close");

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить расписание для урока "${props.schedule.lessonNumber}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление",
    async () => {
      try {
        await educationScheduleStore.deleteSchedule(props.schedule.id);
      } catch (error) {
        console.error("Failed to delete schedule:", error);
        f7.dialog.alert("Произошла ошибка при удалении.");
      }
    }
  );
};

const resetForm = () => {
  lessonNumber.value = props.schedule.lessonNumber.toString();
  startTime.value = props.schedule.startTime;
  endTime.value = props.schedule.endTime;
  formError.value = "";
  educationScheduleStore.clearError();
};
</script>
