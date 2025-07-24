<template>
  <div>
    <f7-popover
      :id="'edit-period-popover-' + period.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#period-item-${period.id}`"
    >
      <div class="period-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || semesterStore.isLoading"
          :is-loading="semesterStore.isLoading"
          :on-cancel="closePopover"
          :on-save="handleUpdatePeriod"
        />

        <div
          v-if="formError || semesterStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || semesterStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <Select
            v-model="periodType"
            :options="typeOptions"
            label="Тип периода"
            placeholder="Выберите тип"
          />

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="period-name-edit">
              Название периода <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="period-name-edit"
              type="text"
              v-model:value="periodName"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="start-date-edit">
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="start-date-edit"
                type="datepicker"
                placeholder="Дата"
                readonly
                v-model:value="startDate"
                :calendar-params="calendarParams"
              />
            </div>
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="end-date-edit">
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="end-date-edit"
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
              :disabled="semesterStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              />
              Удалить период
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
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import { z } from "zod";
import { useSemesterStore } from "@/stores/semesterStore";
import type { AcademicPeriod, PeriodType } from "@/stores/semesterStore";

const props = defineProps<{ period: AcademicPeriod }>();

const semesterStore = useSemesterStore();

const periodType = ref<PeriodType>(props.period.type);
const periodName = ref(props.period.name);
const startDate = ref<Date[]>([new Date(props.period.startDate)]);
const endDate = ref<Date[]>([new Date(props.period.endDate)]);
const formError = ref("");

const typeOptions = [
  { value: "semester", text: "Семестр" },
  { value: "vacation", text: "Каникулы" },
  { value: "session", text: "Сессия" },
];

const periodSchema = z
  .object({
    type: z.enum(["semester", "vacation", "session"]),
    name: z.string().min(1),
    startDate: z.array(z.date()).min(1),
    endDate: z.array(z.date()).min(1),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "Дата окончания должна быть позже даты начала",
    path: ["endDate"],
  });

const validationResult = computed(() => {
  return periodSchema.safeParse({
    type: periodType.value,
    name: periodName.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closePopover = () => {
  f7.popover.close(`#edit-period-popover-${props.period.id}`);
  semesterStore.clearError();
};

const handleUpdatePeriod = async () => {
  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await semesterStore.updatePeriod(props.period.id, {
      type: periodType.value,
      name: periodName.value,
      startDate: dayjs(startDate.value[0]).format("YYYY-MM-DD"),
      endDate: dayjs(endDate.value[0]).format("YYYY-MM-DD"),
    });
    closePopover();
  } catch (error) {
    console.error("Failed to update period:", error);
  }
};

const confirmDelete = () => {
  f7.popover.close(`#edit-period-popover-${props.period.id}`);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить период "${props.period.name}"?</p><p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление периода",
    async () => {
      try {
        await semesterStore.deletePeriod(props.period.id);
      } catch (error) {
        console.error("Failed to delete period:", error);
        f7.dialog.alert("Произошла ошибка при удалении периода.");
      }
    }
  );
};

const calendarParams = {
  closeOnSelect: true,
  dateFormat: "yyyy-MM-dd",
  locale: "ru",
  monthNames: [
    "Январь",
    "Февраль",
    "Март",
    "Апрель",
    "Май",
    "Июнь",
    "Июль",
    "Август",
    "Сентябрь",
    "Октябрь",
    "Ноябрь",
    "Декабрь",
  ],
  monthNamesShort: [
    "Янв",
    "Фев",
    "Мар",
    "Апр",
    "Май",
    "Июн",
    "Июл",
    "Авг",
    "Сен",
    "Окт",
    "Ноя",
    "Дек",
  ],
  dayNames: [
    "Воскресенье",
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
  ],
  dayNamesShort: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"],
  firstDay: 1,
};
</script>
