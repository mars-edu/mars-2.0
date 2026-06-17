<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="replace-journal-popover"
    style="width: 500px !important"
    :is-dirty="isDirty"
    :on-closed="resetLocalData"
    :close-by-outside-click="false"
  >
    <div class="replace-journal-popover bg-card text-card-foreground">
      <PopoverHeader
        title="Добавить замену"
        :on-cancel="requestClose"
      />
      <div class="px-8 pb-8 space-y-4">
        <Select
          label="Преподаватель на замену"
          placeholder="Выберите преподавателя"
          v-model="localData.teacherId"
          :options="teacherOptions"
          name="replace-teacher"
          searchable
        />

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-normal mb-1 block text-muted-foreground">Дата с</label>
            <DateInput
              v-model:value="localData.startDate"
              placeholder="дд.мм.гггг"
            />
          </div>
          <div>
            <label class="text-sm font-normal mb-1 block text-muted-foreground">Дата по</label>
            <DateInput
              v-model:value="localData.endDate"
              placeholder="дд.мм.гггг"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-normal mb-1 block text-muted-foreground">Время с</label>
            <Select
              placeholder="Начало"
              v-model="localData.startScheduleId"
              :options="startTimeOptions"
              @update:modelValue="onStartTimeChange"
            />
          </div>
          <div>
            <label class="text-sm font-normal mb-1 block text-muted-foreground">Время по</label>
            <Select
              placeholder="Конец"
              v-model="localData.endScheduleId"
              :options="endTimeOptions"
            />
          </div>
        </div>

        <div class="flex items-center gap-3 px-4 py-2.5 bg-muted/50 rounded-xl border border-input">
          <Switch v-model="localData.isPrimary" />
          <span class="text-sm text-foreground">Сделать выбранного преподавателя основным</span>
        </div>

        <div>
          <label class="text-sm font-normal mb-1 block text-muted-foreground">
            Основание
          </label>
          <textarea
            v-model="localData.reason"
            placeholder="Например: на основании выхода на больничный..."
            rows="3"
            class="w-full px-4 py-2.5 text-sm bg-muted/50 border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-foreground resize-none transition-all"
          ></textarea>
        </div>
      </div>

      <PopoverFooter
        :on-cancel="requestClose"
        :on-save="onSave"
        :disabled="!isFormValid"
        :is-loading="isLoading"
        cancel-text="Отмена"
        save-text="Отправить на модерацию"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Select from "@/components/ui/Select.vue";
import Switch from "@/components/ui/Switch.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import DateInput from "@/components/ui/DateInput.vue";
import { useTeacherStore } from "@/stores/teacherStore";
import { useEducationScheduleStore } from "@/stores/educationScheduleStore";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { storeToRefs } from "pinia";

export interface ReplaceJournalData {
  teacherId: string;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  reason: string;
  isPrimary: boolean;
}

const props = defineProps<{
  data?: ReplaceJournalData;
  isLoading?: boolean;
  excludedTeacherIds?: string[];
}>();

const emit = defineEmits<{
  save: [data: ReplaceJournalData];
  cancel: [];
}>();

const teacherStore = useTeacherStore();
const { teacherSelectOptions } = storeToRefs(teacherStore);
const teacherOptions = computed(() => {
  const excluded = new Set(props.excludedTeacherIds ?? []);
  if (excluded.size === 0) return teacherSelectOptions.value;
  return teacherSelectOptions.value.filter((o) => !excluded.has(o.value));
});

const educationScheduleStore = useEducationScheduleStore();
const { getActiveYearSchedules } = storeToRefs(educationScheduleStore);

const startTimeOptions = computed(() =>
  getActiveYearSchedules.value.map((s) => ({ value: s.id, text: s.startTime }))
);

const endTimeOptions = computed(() => {
  const schedules = getActiveYearSchedules.value;
  const startIdx = schedules.findIndex((s) => s.id === localData.value.startScheduleId);
  const from = startIdx === -1 ? 0 : startIdx;
  return schedules.slice(from).map((s) => ({ value: s.id, text: s.endTime }));
});

function defaultStartId() {
  return getActiveYearSchedules.value[0]?.id ?? "";
}

function defaultEndId() {
  const schedules = getActiveYearSchedules.value;
  return schedules[schedules.length - 1]?.id ?? "";
}

const localData = ref({
  teacherId: props.data?.teacherId ?? "",
  startDate: props.data?.startDate ? [dayjs(props.data.startDate).toDate()] : [] as Date[],
  endDate: props.data?.endDate ? [dayjs(props.data.endDate).toDate()] : [] as Date[],
  startScheduleId: defaultStartId(),
  endScheduleId: defaultEndId(),
  reason: props.data?.reason ?? "",
  isPrimary: props.data?.isPrimary ?? false,
});

// Set defaults once schedules load (in case store wasn't ready at init)
watch(getActiveYearSchedules, (schedules) => {
  if (schedules.length > 0 && !localData.value.startScheduleId) {
    localData.value.startScheduleId = schedules[0].id;
    localData.value.endScheduleId = schedules[schedules.length - 1].id;
  }
}, { immediate: false });

function onStartTimeChange(newStartId: string) {
  const schedules = getActiveYearSchedules.value;
  const startIdx = schedules.findIndex((s) => s.id === newStartId);
  const endIdx = schedules.findIndex((s) => s.id === localData.value.endScheduleId);
  if (endIdx !== -1 && endIdx < startIdx) {
    localData.value.endScheduleId = newStartId;
  }
}

const resetLocalData = () => {
  localData.value = {
    teacherId: props.data?.teacherId ?? "",
    startDate: props.data?.startDate ? [dayjs(props.data.startDate).toDate()] : [],
    endDate: props.data?.endDate ? [dayjs(props.data.endDate).toDate()] : [],
    startScheduleId: defaultStartId(),
    endScheduleId: defaultEndId(),
    reason: props.data?.reason ?? "",
    isPrimary: props.data?.isPrimary ?? false,
  };
};

const isDirty = () => {
  const startDate = localData.value.startDate.length > 0
    ? dayjs(localData.value.startDate[0]).format(DATE_STORAGE_FORMAT)
    : "";
  const endDate = localData.value.endDate.length > 0
    ? dayjs(localData.value.endDate[0]).format(DATE_STORAGE_FORMAT)
    : "";
  return (
    localData.value.teacherId !== (props.data?.teacherId || "") ||
    startDate !== (props.data?.startDate || "") ||
    endDate !== (props.data?.endDate || "") ||
    localData.value.reason !== (props.data?.reason || "") ||
    localData.value.isPrimary !== (props.data?.isPrimary || false)
  );
};

const isFormValid = computed(() => localData.value.teacherId.trim().length > 0);

watch(
  () => props.data,
  (newData) => { if (newData) resetLocalData(); },
  { deep: false }
);

const onSave = () => {
  if (!isFormValid.value) return;

  const schedules = getActiveYearSchedules.value;
  const startSchedule = schedules.find((s) => s.id === localData.value.startScheduleId);
  const endSchedule = schedules.find((s) => s.id === localData.value.endScheduleId);

  emit("save", {
    teacherId: localData.value.teacherId,
    startDate: localData.value.startDate.length > 0
      ? dayjs(localData.value.startDate[0]).format(DATE_STORAGE_FORMAT)
      : "",
    endDate: localData.value.endDate.length > 0
      ? dayjs(localData.value.endDate[0]).format(DATE_STORAGE_FORMAT)
      : "",
    startTime: startSchedule?.startTime,
    endTime: endSchedule?.endTime,
    reason: localData.value.reason,
    isPrimary: localData.value.isPrimary,
  });
};
</script>

<style scoped>
.replace-journal-popover {
  max-height: 90vh;
  overflow-y: auto;
}

</style>
