<template>
  <GuardedPopover
    v-slot="{ requestClose }"
    id="replace-journal-popover"
    style="width: 500px !important"
    :is-dirty="isDirty"
    :on-closed="resetLocalData"
  >
    <div class="replace-journal-popover bg-card text-card-foreground">
      <PopoverHeader
        title="Заменить журналы"
        :on-cancel="requestClose"
      />
      <div class="p-4 space-y-4">
        <Select
          label="Укажите преподавателя"
          placeholder="Выберите преподавателя"
          v-model="localData.teacherId"
          :options="teacherOptions"
          name="replace-teacher"
          searchable
          v-bind="selectHandlers"
        />

        <div class="flex justify-between items-center">
          <span class="text-sm text-foreground">Начало</span>
          <div class="w-1/2">
            <f7-input
              class="text-right"
              type="datepicker"
              placeholder="Дата"
              v-model:value="localData.startDate"
              readonly
              :calendar-params="DATE_PICKER_PARAMS"
            ></f7-input>
          </div>
        </div>

        <div class="flex justify-between items-center">
          <span class="text-sm text-foreground">Конец</span>
          <div class="w-1/2">
            <f7-input
              class="text-right"
              type="datepicker"
              placeholder="Дата"
              v-model:value="localData.endDate"
              readonly
              :calendar-params="DATE_PICKER_PARAMS"
            ></f7-input>
          </div>
        </div>

        <div>
          <label class="text-sm font-normal mb-1 block text-foreground">
            Укажите основание
          </label>
          <textarea
            v-model="localData.reason"
            placeholder="Например: на основании служебного письма от 16.01.2025 года"
            rows="4"
            class="w-full px-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground resize-vertical"
          ></textarea>
        </div>
      </div>

      <PopoverFooter
        :on-save="onSave"
        :disabled="!isFormValid"
        :is-loading="isLoading"
        save-text="Добавить"
      />
    </div>
  </GuardedPopover>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7Popover, f7Input } from "framework7-vue";
import dayjs from "dayjs";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import Select from "@/components/ui/Select.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import { useTeacherStore } from "@/stores/teacherStore";
import { useNestedPopover } from "@/composables/useNestedPopover";
import { getDatePickerParams, DATE_STORAGE_FORMAT } from "@/constants/calendar";

const DATE_PICKER_PARAMS = getDatePickerParams();
import { storeToRefs } from "pinia";

export interface ReplaceJournalData {
  teacherId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const props = defineProps<{
  data?: ReplaceJournalData;
  isLoading?: boolean;
}>();

const emit = defineEmits<{
  save: [data: ReplaceJournalData];
  cancel: [];
}>();

const teacherStore = useTeacherStore();
const { teacherSelectOptions } = storeToRefs(teacherStore);

// Nested popover management
const { selectHandlers } = useNestedPopover({
  parentPopoverId: "#replace-journal-popover",
});

const teacherOptions = computed(() => teacherSelectOptions.value);

const localData = ref<{
  teacherId: string;
  startDate: Date[];
  endDate: Date[];
  reason: string;
}>({
  teacherId: props.data?.teacherId || "",
  startDate: props.data?.startDate ? [dayjs(props.data.startDate).toDate()] : [],
  endDate: props.data?.endDate ? [dayjs(props.data.endDate).toDate()] : [],
  reason: props.data?.reason || "",
});

const resetLocalData = () => {
  localData.value = {
    teacherId: props.data?.teacherId || "",
    startDate: props.data?.startDate ? [dayjs(props.data.startDate).toDate()] : [],
    endDate: props.data?.endDate ? [dayjs(props.data.endDate).toDate()] : [],
    reason: props.data?.reason || "",
  };
};

const isDirty = () => {
  const startDate =
    localData.value.startDate.length > 0
      ? dayjs(localData.value.startDate[0]).format(DATE_STORAGE_FORMAT)
      : "";
  const endDate =
    localData.value.endDate.length > 0
      ? dayjs(localData.value.endDate[0]).format(DATE_STORAGE_FORMAT)
      : "";
  return (
    localData.value.teacherId !== (props.data?.teacherId || "") ||
    startDate !== (props.data?.startDate || "") ||
    endDate !== (props.data?.endDate || "") ||
    localData.value.reason !== (props.data?.reason || "")
  );
};

const isFormValid = computed(() => {
  return localData.value.teacherId.trim().length > 0;
});

watch(
  () => props.data,
  (newData) => {
    if (newData) {
      resetLocalData();
    }
  },
  { deep: true }
);

const onSave = () => {
  if (!isFormValid.value) return;

  const saveData: ReplaceJournalData = {
    teacherId: localData.value.teacherId,
    startDate: localData.value.startDate.length > 0
      ? dayjs(localData.value.startDate[0]).format(DATE_STORAGE_FORMAT)
      : "",
    endDate: localData.value.endDate.length > 0
      ? dayjs(localData.value.endDate[0]).format(DATE_STORAGE_FORMAT)
      : "",
    reason: localData.value.reason,
  };

  emit("save", saveData);
};

const onCancel = () => {
  resetLocalData();
  emit("cancel");
};
</script>

<style scoped>
.replace-journal-popover {
  max-height: 90vh;
  overflow-y: auto;
}

#replace-journal-popover {
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

/* Datepicker input styling */
:deep(.datepicker-input input) {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  background-color: hsl(var(--background));
  border: 1px solid hsl(var(--input));
  border-radius: 0.5rem;
  color: hsl(var(--foreground));
  transition: all 0.2s ease;
}

:deep(.datepicker-input input:focus) {
  outline: none;
  border-color: hsl(var(--primary));
  box-shadow: 0 0 0 2px rgba(var(--primary-rgb), 0.2);
}

:deep(.datepicker-input input::placeholder) {
  color: hsl(var(--muted-foreground));
}

/* Remove default Framework7 list styling for datepickers */
:deep(.datepicker-input .list) {
  margin: 0;
  padding: 0;
}

:deep(.datepicker-input .item-content) {
  padding: 0;
  min-height: auto;
}

:deep(.datepicker-input .item-inner) {
  padding: 0;
  border: none;
}
</style>
