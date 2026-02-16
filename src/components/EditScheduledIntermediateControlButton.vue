<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="control"
      :id="'edit-scheduled-intermediate-control-popover-' + control.id"
      style="width: 600px !important"
      :target="`#scheduled-intermediate-control-item-${control.id}`"
    >
      <div class="control-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать промежуточный контроль"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || scheduledIntermediateControlStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || scheduledIntermediateControlStore.getError }}
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
              :disabled="scheduledIntermediateControlStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              />
              Удалить промежуточный контроль
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateControl"
          :disabled="!isFormValid || scheduledIntermediateControlStore.isLoading"
          :is-loading="scheduledIntermediateControlStore.isLoading"
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
import { useScheduledIntermediateControlStore } from "@/stores/scheduledIntermediateControlStore";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import type { ScheduledIntermediateControl } from "@/stores/scheduledIntermediateControlStore";

const props = defineProps<{ controlId: string }>();

const scheduledIntermediateControlStore =
  useScheduledIntermediateControlStore();
const intermediateControlStore = useIntermediateControlStore();

// Get control from store by ID - always fresh data
const control = computed(() =>
  scheduledIntermediateControlStore.getScheduledIntermediateControlById(props.controlId)
);

const selectedControlId = ref("");
const shortName = ref("");
const startDate = ref<Date[]>([new Date()]);
const endDate = ref<Date[]>([new Date()]);
const formError = ref("");

// Update form fields whenever control data changes
watchEffect(() => {
  if (control.value) {
    selectedControlId.value = control.value.intermediateControlId;
    shortName.value = control.value.shortName;
    startDate.value = [new Date(control.value.startDate)];
    endDate.value = [new Date(control.value.endDate)];
  }
});

const controlOptions = computed(() =>
  intermediateControlStore.sortedIntermediateControls.map((control) => ({
    value: control.id,
    text: control.shortName,
  }))
);

watch(selectedControlId, (newId) => {
  if (newId) {
    const control = intermediateControlStore.getIntermediateControlById(newId);
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
  f7.popover.close(
    `#edit-scheduled-intermediate-control-popover-${control.value.id}`
  );
  scheduledIntermediateControlStore.clearError();
};

const handleUpdateControl = async () => {
  if (!isFormValid.value || !control.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await scheduledIntermediateControlStore.updateScheduledIntermediateControl(
      control.value.id,
      {
        intermediateControlId: selectedControlId.value,
        shortName: shortName.value,
        startDate: dayjs(startDate.value[0]).format(DATE_STORAGE_FORMAT),
        endDate: dayjs(endDate.value[0]).format(DATE_STORAGE_FORMAT),
      }
    );
    closePopover();
  } catch (error) {
    console.error("Failed to update scheduled intermediate control:", error);
  }
};

const confirmDelete = () => {
  if (!control.value) return;
  f7.popover.close(
    `#edit-scheduled-intermediate-control-popover-${control.value.id}`
  );
  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить промежуточный контроль "${control.value.shortName}"?</p><p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление промежуточного контроля",
    async () => {
      if (!control.value) return;
      try {
        await scheduledIntermediateControlStore.deleteScheduledIntermediateControl(
          control.value.id
        );
      } catch (error) {
        console.error(
          "Failed to delete scheduled intermediate control:",
          error
        );
        f7.dialog.alert(
          "Произошла ошибка при удалении промежуточного контроля."
        );
      }
    }
  );
};
</script>

