<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="vacation"
      :id="'edit-vacation-popover-' + vacation.id"
      style="width: 600px !important"
      :target="`#vacation-item-${vacation.id}`"
    >
      <div class="vacation-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать каникулы"
          :disabled="!isFormValid || vacationStore.isLoading"
          :is-loading="vacationStore.isLoading"
          :on-cancel="requestClose"
          :on-save="handleUpdateVacation"
        />

        <div
          v-if="formError || vacationStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || vacationStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="vacation-short-name-edit"
            >
              Краткое название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="vacation-short-name-edit"
              type="text"
              v-model:value="shortName"
            />
          </div>

          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="vacation-full-name-edit"
            >
              Полное название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="vacation-full-name-edit"
              type="text"
              v-model:value="fullName"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label
                class="text-sm text-foreground"
                for="vacation-start-date-edit"
              >
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="vacation-start-date-edit"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="startDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
            <div class="space-y-2">
              <label
                class="text-sm text-foreground"
                for="vacation-end-date-edit"
              >
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="vacation-end-date-edit"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="endDate"
                :calendar-params="DATE_PICKER_PARAMS"
              />
            </div>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="confirmDelete"
              :disabled="vacationStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              />
              Удалить каникулы
            </button>
          </div>
        </div>
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT } from "@/constants/calendar";
import { f7, f7Input, f7Icon, f7Popover } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import { z } from "zod";
import { useVacationStore } from "@/stores/vacationStore";
import type { Vacation } from "@/stores/vacationStore";
import { DATE_PICKER_PARAMS } from "@/constants/calendar";

const props = defineProps<{ vacationId: string }>();

const vacationStore = useVacationStore();

// Get vacation from store by ID - always fresh data
const vacation = computed(() => vacationStore.getVacationById(props.vacationId));

const shortName = ref("");
const fullName = ref("");
const startDate = ref<Date[]>([new Date()]);
const endDate = ref<Date[]>([new Date()]);
const formError = ref("");

// Update form fields whenever vacation data changes
watchEffect(() => {
  if (vacation.value) {
    shortName.value = vacation.value.shortName;
    fullName.value = vacation.value.fullName;
    startDate.value = [new Date(vacation.value.startDate)];
    endDate.value = [new Date(vacation.value.endDate)];
  }
});

const vacationSchema = z
  .object({
    shortName: z.string().min(1),
    fullName: z.string().min(1),
    startDate: z.array(z.date()).min(1),
    endDate: z.array(z.date()).min(1),
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

const closePopover = () => {
  if (!vacation.value) return;
  f7.popover.close(`#edit-vacation-popover-${vacation.value.id}`);
  vacationStore.clearError();
};

const handleUpdateVacation = async () => {
  if (!isFormValid.value || !vacation.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await vacationStore.updateVacation(vacation.value.id, {
      shortName: shortName.value,
      fullName: fullName.value,
      startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
      endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
    });
    closePopover();
  } catch (error) {
    console.error("Failed to update vacation:", error);
  }
};

const confirmDelete = () => {
  if (!vacation.value) return;
  f7.popover.close(`#edit-vacation-popover-${vacation.value.id}`);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить каникулы "${vacation.value.shortName}"?</p><p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление каникул",
    async () => {
      if (!vacation.value) return;
      try {
        await vacationStore.deleteVacation(vacation.value.id);
      } catch (error) {
        console.error("Failed to delete vacation:", error);
        f7.dialog.alert("Произошла ошибка при удалении каникул.");
      }
    }
  );
};
</script>
