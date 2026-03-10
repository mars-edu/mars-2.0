<template>
  <div>
    <button
      :id="buttonId"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      aria-label="Добавить каникулы"
      type="button"
      @click.stop="openAddVacationPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      :id="popoverId"
      style="width: 600px !important"
      :target="`#${buttonId}`"
    
      :on-closed="resetForm">
      <div class="vacation-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать каникулы"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || vacationStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || vacationStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="vacation-short-name">
              Краткое название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="vacation-short-name"
              type="text"
              v-model:value="shortName"
              placeholder="Например: Зимние каникулы"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="vacation-full-name">
              Полное название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="vacation-full-name"
              type="text"
              v-model:value="fullName"
              placeholder="Например: Зимние каникулы 2024-2025 учебного года"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="vacation-start-date">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="vacation-start-date"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="startDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="vacation-end-date">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="vacation-end-date"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="endDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveVacation"
          :disabled="!isFormValid || vacationStore.isLoading"
          :is-loading="vacationStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7, f7Popover, f7Input } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { z } from "zod";
import { useVacationStore } from "@/stores/vacationStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import { getDatePickerParams } from "@/constants/calendar";

const DATE_PICKER_PARAMS = getDatePickerParams();

const props = defineProps<{ prefix?: string }>();

const computedPrefix = computed(() => props.prefix || "vacation");
const buttonId = computed(() => `add-${computedPrefix.value}-button`);
const popoverId = computed(() => `add-${computedPrefix.value}-popover`);

const vacationStore = useVacationStore();
const academicYearStore = useAcademicYearStore();

const shortName = ref("");
const fullName = ref("");
const startDate = ref<Date[]>([]);
const endDate = ref<Date[]>([]);
const formError = ref("");

const vacationSchema = z
  .object({
    shortName: z
      .string()
      .min(1, "Пожалуйста, введите краткое название каникул"),
    fullName: z.string().min(1, "Пожалуйста, введите полное название каникул"),
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
  return vacationSchema.safeParse({
    shortName: shortName.value,
    fullName: fullName.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddVacationPopover = () => {
  f7.popover.open(`#${popoverId.value}`, `#${buttonId.value}`);
};

const closeAddVacationPopover = () => {
  f7.popover.close(`#${popoverId.value}`);
  resetForm();
};

const handleSaveVacation = async () => {
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

    await vacationStore.addVacation({
      shortName: shortName.value,
      fullName: fullName.value,
      startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
      academicYearId: activeAcademicYear.id,
    });
    closeAddVacationPopover();
  } catch (error) {
    console.error("Failed to add vacation:", error);
  }
};

const resetForm = () => {
  shortName.value = "";
  fullName.value = "";
  startDate.value = [];
  endDate.value = [];
  formError.value = "";
  vacationStore.clearError();
};
</script>
