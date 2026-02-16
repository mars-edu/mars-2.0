<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="control"
      :id="'edit-scheduled-final-control-popover-' + control.id"
      style="width: 600px !important"
      :target="`#scheduled-final-control-item-${control.id}`"
    >
      <div class="control-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать итоговый контроль"
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
            <label class="text-sm text-foreground" for="control-type-edit">
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
            <label
              class="text-sm text-foreground"
              for="control-short-name-edit"
            >
              Название <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="control-short-name-edit"
              type="text"
              v-model:value="shortName"
              :disabled="true"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label
                class="text-sm text-foreground"
                for="control-start-date-edit"
              >
                Дата начала <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="control-start-date-edit"
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
                for="control-end-date-edit"
              >
                Дата окончания <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="control-end-date-edit"
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
              :disabled="scheduledFinalControlStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              />
              Удалить итоговый контроль
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateControl"
          :disabled="!isFormValid || scheduledFinalControlStore.isLoading"
          :is-loading="scheduledFinalControlStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, watchEffect } from "vue";
import dayjs from "dayjs";
import { DATE_STORAGE_FORMAT, DATE_PICKER_PARAMS } from "@/constants/calendar";
import { f7, f7Input, f7Icon, f7Popover } from "framework7-vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Select from "@/components/ui/Select.vue";
import { z } from "zod";
import { useScheduledFinalControlStore } from "@/stores/scheduledFinalControlStore";
import { useFinalControlStore } from "@/stores/finalControlStore";
import type { ScheduledFinalControl } from "@/stores/scheduledFinalControlStore";

const props = defineProps<{ controlId: string }>();

const scheduledFinalControlStore = useScheduledFinalControlStore();
const finalControlStore = useFinalControlStore();

// Get control from store by ID - always fresh data
const control = computed(() =>
  scheduledFinalControlStore.getScheduledFinalControlById(props.controlId)
);

const selectedControlId = ref("");
const shortName = ref("");
const startDate = ref<Date[]>([new Date()]);
const endDate = ref<Date[]>([new Date()]);
const formError = ref("");

// Update form fields whenever control data changes
watchEffect(() => {
  if (control.value) {
    selectedControlId.value = control.value.finalControlId;
    shortName.value = control.value.shortName;
    startDate.value = [new Date(control.value.startDate)];
    endDate.value = [new Date(control.value.endDate)];
  }
});

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
    controlId: z.string().min(1),
    shortName: z.string().min(1),
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
  return controlSchema.safeParse({
    controlId: selectedControlId.value,
    shortName: shortName.value,
    startDate: startDate.value,
    endDate: endDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closePopover = () => {
  if (!control.value) return;
  f7.popover.close(`#edit-scheduled-final-control-popover-${control.value.id}`);
  scheduledFinalControlStore.clearError();
};

const handleUpdateControl = async () => {
  if (!isFormValid.value || !control.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await scheduledFinalControlStore.updateScheduledFinalControl(
      control.value.id,
      {
        finalControlId: selectedControlId.value,
        shortName: shortName.value,
        startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
        endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
      }
    );
    closePopover();
  } catch (error) {
    console.error("Failed to update scheduled final control:", error);
  }
};

const confirmDelete = () => {
  if (!control.value) return;
  f7.popover.close(`#edit-scheduled-final-control-popover-${control.value.id}`);
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить итоговый контроль "${control.value.shortName}"?</p><p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление итогового контроля",
    async () => {
      if (!control.value) return;
      try {
        await scheduledFinalControlStore.deleteScheduledFinalControl(
          control.value.id
        );
      } catch (error) {
        console.error("Failed to delete scheduled final control:", error);
        f7.dialog.alert("Произошла ошибка при удалении итогового контроля.");
      }
    }
  );
};
</script>

