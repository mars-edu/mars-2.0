<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="schedule"
      :id="'edit-schedule-popover-' + schedule.id"
      style="width: 600px !important"
      :target="`#schedule-item-${schedule.id}`"
    
      :on-closed="resetForm">
      <div class="schedule-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
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
        </div>

        <PopoverFooter
          :on-save="handleUpdateSchedule"
          :disabled="!isFormValid || educationScheduleStore.isLoading"
          :is-loading="educationScheduleStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, watchEffect } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import { educationScheduleSchema } from "@/validators/schedule";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import type { EducationSchedule } from "@/stores/educationScheduleStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  scheduleId: string;
}>();

const educationScheduleStore = useEducationScheduleStore();

// Get schedule from store by ID - always fresh data
const schedule = computed(() => educationScheduleStore.getScheduleById(props.scheduleId));

const startTime = ref("");
const endTime = ref("");
const formError = ref("");

// Update form fields whenever schedule data changes
watchEffect(() => {
  if (schedule.value) {
    startTime.value = schedule.value.startTime;
    endTime.value = schedule.value.endTime;
  }
});

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
    },
  });
};

onMounted(() => {
  if (!schedule.value) return;
  startTimePicker = createPicker(
    `#schedule-start-time-${schedule.value.id}`,
    startTime
  );
  endTimePicker = createPicker(
    `#schedule-end-time-${schedule.value.id}`,
    endTime
  );
});

onBeforeUnmount(() => {
  startTimePicker?.destroy();
  endTimePicker?.destroy();
});

const closeEditSchedulePopover = () => {
  if (!schedule.value) return;
  f7.popover.close(`#edit-schedule-popover-${schedule.value.id}`);
  resetForm();
};

const handleUpdateSchedule = async () => {
  if (!isFormValid.value || !schedule.value) {
    if (!validationResult.value.success) {
      const issues = validationResult.value.error.issues;
      if (issues.length > 0) {
        formError.value = issues[0].message;
      }
    }
    return;
  }

  try {
    await educationScheduleStore.updateSchedule(schedule.value.id, {
      startTime: startTime.value,
      endTime: endTime.value,
    });
    closeEditSchedulePopover();
  } catch (error) {
    console.error("Failed to update schedule:", error);
  }
};



const resetForm = () => {
  if (!schedule.value) return;
  startTime.value = schedule.value.startTime;
  endTime.value = schedule.value.endTime;
  formError.value = "";
  educationScheduleStore.clearError();
};
</script>
