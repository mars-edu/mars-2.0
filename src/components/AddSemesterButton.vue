<template>
  <div>
    <button
      :id="buttonId"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
      aria-label="Добавить период"
      type="button"
      @click.stop="openAddPeriodPopover"
    >
      <f7-icon ios="f7:plus" md="material:add" size="16px" class="text-white" />
    </button>

    <f7-popover
      :id="popoverId"
      style="width: 600px !important"
      :target="`#${buttonId}`"
      close-on-escape
    >
      <div class="period-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :disabled="!isFormValid || semesterStore.isLoading"
          :is-loading="semesterStore.isLoading"
          :on-cancel="closeAddPeriodPopover"
          :on-save="handleSavePeriod"
        />

        <div
          v-if="formError || semesterStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || semesterStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <!-- <Select
            v-model="periodType"
            :options="typeOptions"
            label="Тип периода"
            placeholder="Выберите тип"
          /> -->

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="period-name">
              Название периода <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="period-name"
              type="text"
              v-model:value="periodName"
              placeholder="Например: Осенний семестр"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="start-date">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="start-date"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="startDate"
                :calendar-params="calendarParams"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="end-date">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="end-date"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="endDate"
                :calendar-params="calendarParams"
              />
            </div>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useSemesterStore } from "@/stores/semesterStore";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import type { PeriodType } from "@/stores/semesterStore";
import { typeOptions, calendarParams } from "@/constants/period";

const props = defineProps<{ prefix?: string; defaultType?: PeriodType }>();

const computedPrefix = computed(() => props.prefix || "academic-period");
const buttonId = computed(() => `add-${computedPrefix.value}-button`);
const popoverId = computed(() => `add-${computedPrefix.value}-popover`);

const semesterStore = useSemesterStore();

const periodType = ref<PeriodType>(props.defaultType || "semester");
const periodName = ref("");
const startDate = ref<Date[]>([]);
const endDate = ref<Date[]>([]);
const formError = ref("");

const periodSchema = z
  .object({
    type: z.enum(["semester", "vacation", "session"], {
      description: "Тип периода",
    }),
    name: z.string().min(1, "Пожалуйста, введите название периода"),
    startDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату начала"),
    endDate: z.array(z.date()).min(1, "Пожалуйста, укажите дату окончания"),
  })
  .refine(
    (data) =>
      data.startDate.length > 0 &&
      data.endDate.length > 0 &&
      data.endDate[0] > data.startDate[0],
    {
      message: "Дата окончания должна быть позже даты начала",
      path: ["endDate"],
    }
  );

const validationResult = computed(() => {
  return periodSchema.safeParse({
    type: periodType.value,
    name: periodName.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddPeriodPopover = () => {
  f7.popover.open(`#${popoverId.value}`, `#${buttonId.value}`);
};

const closeAddPeriodPopover = () => {
  f7.popover.close(`#${popoverId.value}`);
  resetForm();
};

const handleSavePeriod = async () => {
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
    await semesterStore.addPeriod({
      type: periodType.value,
      name: periodName.value,
      startDate: dayjs(startDate.value[0]).format("YYYY-MM-DD"),
      endDate: dayjs(endDate.value[0]).format("YYYY-MM-DD"),
    });
    closeAddPeriodPopover();
  } catch (error) {
    console.error("Failed to add period:", error);
  }
};

const resetForm = () => {
  periodType.value = props.defaultType || "semester";
  periodName.value = "";
  startDate.value = [];
  endDate.value = [];
  formError.value = "";
  semesterStore.clearError();
};
</script>
