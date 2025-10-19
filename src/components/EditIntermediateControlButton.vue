<template>
  <div>
    <f7-popover
      :id="'edit-settings-intermediate-control-popover-' + controlId"
      style="width: 600px !important"
      close-on-escape
      :target="`#intermediate-control-item-${controlId}`"
    >
      <div class="intermediate-control-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || intermediateControlStore.isLoading"
          :is-loading="intermediateControlStore.isLoading"
          :on-cancel="closeEditIntermediateControlPopover"
          :on-save="handleUpdateIntermediateControl"
        />

        <div
          v-if="formError || intermediateControlStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || intermediateControlStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="intermediate-control-name"
            >
              Полное название
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="intermediate-control-name"
              type="text"
              v-model:value="controlName"
              placeholder="Введите полное название"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="intermediate-control-short-name"
            >
              Краткое название
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="intermediate-control-short-name"
              type="text"
              v-model:value="controlShortName"
              placeholder="Введите краткое название"
            ></f7-input>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="intermediateControlStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить промежуточный контроль
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  controlId: string;
}>();

const intermediateControlStore = useIntermediateControlStore();

const control = computed(() =>
  intermediateControlStore.getIntermediateControlById(props.controlId)
);

const controlName = ref("");
const controlShortName = ref("");
const formError = ref("");

const intermediateControlSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите полное название"),
  shortName: z.string().min(1, "Пожалуйста, введите краткое название"),
});

const validationResult = computed(() => {
  return intermediateControlSchema.safeParse({
    name: controlName.value,
    shortName: controlShortName.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditIntermediateControlPopover = () => {
  f7.popover.close(
    `#edit-settings-intermediate-control-popover-${props.controlId}`
  );
  resetForm();
};

const handleUpdateIntermediateControl = async () => {
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
    await intermediateControlStore.updateIntermediateControl(props.controlId, {
      name: controlName.value,
      shortName: controlShortName.value,
    });
    closeEditIntermediateControlPopover();
  } catch (error) {
    console.error("Failed to update intermediate control:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(
    `#edit-settings-intermediate-control-popover-${props.controlId}`
  );

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить промежуточный контроль "${
      control.value?.shortName ?? ""
    }"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление промежуточного контроля",
    async () => {
      try {
        await intermediateControlStore.deleteIntermediateControl(
          props.controlId
        );
      } catch (error) {
        console.error("Failed to delete intermediate control:", error);
        f7.dialog.alert(
          "Произошла ошибка при удалении промежуточного контроля."
        );
      }
    }
  );
};

const resetForm = () => {
  controlName.value = control.value?.name ?? "";
  controlShortName.value = control.value?.shortName ?? "";
  formError.value = "";
  intermediateControlStore.clearError();
};

watch(
  control,
  (c) => {
    if (c) {
      controlName.value = c.name;
      controlShortName.value = c.shortName;
    }
  },
  { immediate: true }
);
</script>
