<template>
  <div>
    <button
      :id="buttonId"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      aria-label="Добавить итоговый контроль"
      type="button"
      @click.stop="openAddControlPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      :id="popoverId"
      style="width: 600px !important"
      :target="`#${buttonId}`"
    
      :on-closed="resetForm">
      <div class="control-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать итоговый контроль"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || scheduledFinalControlStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || scheduledFinalControlStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="control-type">
              Форма контроля <span class="text-destructive ml-1">*</span>
            </label>
            <Select
              v-model="selectedControlId"
              :options="controlOptions"
              placeholder="Выберите форму контроля"
              search-placeholder="Поиск формы контроля..."
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="control-short-name">
              Название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="control-short-name"
              type="text"
              v-model:value="shortName"
              placeholder="Например: Экзамен"
              :disabled="true"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="control-start-date">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <DateInput
                v-model:value="startDate"
                placeholder="Дата"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="control-end-date">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <DateInput
                v-model:value="endDate"
                placeholder="Дата"
              />
            </div>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveControl"
          :disabled="!isFormValid || scheduledFinalControlStore.isLoading"
          :is-loading="scheduledFinalControlStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7, f7Popover, f7Input } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { z } from "zod";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import DateInput from "@/components/ui/DateInput.vue";

const props = defineProps<{ prefix?: string; semesterId: string }>();

const computedPrefix = computed(
  () => props.prefix || "scheduled-final-control"
);
const buttonId = computed(() => `add-${computedPrefix.value}-button`);
const popoverId = computed(() => `add-${computedPrefix.value}-popover`);

const scheduledFinalControlStore = useScheduledFinalControlStore();
const finalControlStore = useFinalControlStore();
const academicYearStore = useAcademicYearStore();

const selectedControlId = ref("");
const shortName = ref("");
const startDate = ref<Date[]>([]);
const endDate = ref<Date[]>([]);
const formError = ref("");

const controlOptions = computed(() =>
  finalControlStore.sortedFinalControls.map((control) => ({
    value: control.id,
    text: control.shortName,
  }))
);

watch(selectedControlId, (newId) => {
  if (newId) {
    const control = finalControlStore.getFinalControlById(newId);
    if (control) {
      shortName.value = control.shortName;
    }
  } else {
    shortName.value = "";
  }
});

const controlSchema = z
  .object({
    controlId: z.string().min(1, "Пожалуйста, выберите форму контроля"),
    shortName: z.string().min(1, "Пожалуйста, введите название"),
    startDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату начала"),
    endDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату окончания"),
  })
  .refine(
    (data) =>
      data.startDate.length > 0 &&
      data.endDate.length > 0 &&
      data.endDate[0] >= data.startDate[0],
    {
      message: "Дата окончания должна быть позже даты начала",
      path: ["endDate"],
    }
  );

const validationResult = computed(() => {
  return controlSchema.safeParse({
    controlId: selectedControlId.value,
    shortName: shortName.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddControlPopover = () => {
  f7.popover.open(`#${popoverId.value}`, `#${buttonId.value}`);
};

const closeAddControlPopover = () => {
  f7.popover.close(`#${popoverId.value}`);
  resetForm();
};

const handleSaveControl = async () => {
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

    await scheduledFinalControlStore.addScheduledFinalControl({
      finalControlId: selectedControlId.value,
      shortName: shortName.value,
      startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
      academicYearId: activeAcademicYear.id,
      semesterId: props.semesterId,
    });
    closeAddControlPopover();
  } catch (error) {
    console.error("Failed to add scheduled final control:", error);
  }
};

const resetForm = () => {
  selectedControlId.value = "";
  shortName.value = "";
  startDate.value = [];
  endDate.value = [];
  formError.value = "";
  scheduledFinalControlStore.clearError();
};
</script>


