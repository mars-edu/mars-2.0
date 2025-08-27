<template>
  <div>
    <f7-popover
      :id="'edit-vacation-popover-' + vacation.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#vacation-item-${vacation.id}`"
    >
      <div class="vacation-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать каникулы"
          :disabled="!isFormValid || vacationStore.isLoading"
          :is-loading="vacationStore.isLoading"
          :on-cancel="closePopover"
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
                :calendar-params="calendarParams"
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
                :calendar-params="calendarParams"
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
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import dayjs from "dayjs";
import { f7, f7Input, f7Icon, f7Popover } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import { z } from "zod";
import { useVacationStore } from "@/stores/vacationStore";
import type { Vacation } from "@/stores/vacationStore";
import { calendarParams } from "@/constants/period";

const props = defineProps<{ vacation: Vacation }>();

const vacationStore = useVacationStore();

const shortName = ref(props.vacation.shortName);
const fullName = ref(props.vacation.fullName);
const startDate = ref<Date[]>([new Date(props.vacation.startDate)]);
const endDate = ref<Date[]>([new Date(props.vacation.endDate)]);
const formError = ref("");

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
  f7.popover.close(`#edit-vacation-popover-${props.vacation.id}`);
  vacationStore.clearError();
};

const handleUpdateVacation = async () => {
  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await vacationStore.updateVacation(props.vacation.id, {
      shortName: shortName.value,
      fullName: fullName.value,
      startDate: dayjs(startDate.value[0]).format("YYYY-MM-DD"),
      endDate: dayjs(endDate.value[0]).format("YYYY-MM-DD"),
    });
    closePopover();
  } catch (error) {
    console.error("Failed to update vacation:", error);
  }
};

const confirmDelete = () => {
  f7.popover.close(`#edit-vacation-popover-${props.vacation.id}`);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить каникулы "${props.vacation.shortName}"?</p><p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление каникул",
    async () => {
      try {
        await vacationStore.deleteVacation(props.vacation.id);
      } catch (error) {
        console.error("Failed to delete vacation:", error);
        f7.dialog.alert("Произошла ошибка при удалении каникул.");
      }
    }
  );
};
</script>
