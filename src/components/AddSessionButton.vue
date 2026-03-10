<template>
  <div>
    <button
      :id="buttonId"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      aria-label="Добавить сессию"
      type="button"
      @click.stop="openAddSessionPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      :id="popoverId"
      style="width: 600px !important"
      :target="`#${buttonId}`"
    
      :on-closed="resetForm">
      <div class="session-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать сессию"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || sessionStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || sessionStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="session-short-name">
              Краткое название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="session-short-name"
              type="text"
              v-model:value="shortName"
              placeholder="Например: Зимняя сессия"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="session-full-name">
              Полное название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="session-full-name"
              type="text"
              v-model:value="fullName"
              placeholder="Например: Зимняя экзаменационная сессия 2024-2025 учебного года"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="session-start-date">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="session-start-date"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="startDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="session-end-date">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="session-end-date"
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
          :on-save="handleSaveSession"
          :disabled="!isFormValid || sessionStore.isLoading"
          :is-loading="sessionStore.isLoading"
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
import { useSessionStore } from "@/stores/sessionStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import { getDatePickerParams } from "@/constants/calendar";

const DATE_PICKER_PARAMS = getDatePickerParams();

const props = defineProps<{ prefix?: string }>();

const computedPrefix = computed(() => props.prefix || "session");
const buttonId = computed(() => `add-${computedPrefix.value}-button`);
const popoverId = computed(() => `add-${computedPrefix.value}-popover`);

const sessionStore = useSessionStore();
const academicYearStore = useAcademicYearStore();

const shortName = ref("");
const fullName = ref("");
const startDate = ref<Date[]>([]);
const endDate = ref<Date[]>([]);
const formError = ref("");

const sessionSchema = z
  .object({
    shortName: z.string().min(1, "Пожалуйста, введите краткое название сессии"),
    fullName: z.string().min(1, "Пожалуйста, введите полное название сессии"),
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
  return sessionSchema.safeParse({
    shortName: shortName.value,
    fullName: fullName.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddSessionPopover = () => {
  f7.popover.open(`#${popoverId.value}`, `#${buttonId.value}`);
};

const closeAddSessionPopover = () => {
  f7.popover.close(`#${popoverId.value}`);
  resetForm();
};

const handleSaveSession = async () => {
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

    await sessionStore.addSession({
      shortName: shortName.value,
      fullName: fullName.value,
      startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
      academicYearId: activeAcademicYear.id,
    });
    closeAddSessionPopover();
  } catch (error) {
    console.error("Failed to add session:", error);
  }
};

const resetForm = () => {
  shortName.value = "";
  fullName.value = "";
  startDate.value = [];
  endDate.value = [];
  formError.value = "";
  sessionStore.clearError();
};
</script>
