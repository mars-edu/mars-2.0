<template>
  <div>
    <f7-popover
      :id="'edit-settings-final-control-popover-' + controlId"
      style="width: 600px !important"
      :target="`#final-control-item-${controlId}`"
    >
      <div class="final-control-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || finalControlStore.isLoading"
          :is-loading="finalControlStore.isLoading"
          :on-cancel="closeEditFinalControlPopover"
          :on-save="handleUpdateFinalControl"
        />

        <div
          v-if="formError || finalControlStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || finalControlStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="final-control-name">
              Полное название
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="final-control-name"
              type="text"
              v-model:value="controlName"
              placeholder="Введите полное название"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="final-control-short-name"
            >
              Краткое название
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="final-control-short-name"
              type="text"
              v-model:value="controlShortName"
              placeholder="Введите краткое название"
            ></f7-input>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="finalControlStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить форму контроля
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
import { useFinalControlStore } from "@/stores/finalControlStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  controlId: string;
}>();

const finalControlStore = useFinalControlStore();

const control = computed(() =>
  finalControlStore.getFinalControlById(props.controlId)
);

const controlName = ref("");
const controlShortName = ref("");
const formError = ref("");

const finalControlSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите полное название"),
  shortName: z.string().min(1, "Пожалуйста, введите краткое название"),
});

const validationResult = computed(() => {
  return finalControlSchema.safeParse({
    name: controlName.value,
    shortName: controlShortName.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditFinalControlPopover = () => {
  f7.popover.close(`#edit-settings-final-control-popover-${props.controlId}`);
  resetForm();
};

const handleUpdateFinalControl = async () => {
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
    await finalControlStore.updateFinalControl(props.controlId, {
      name: controlName.value,
      shortName: controlShortName.value,
    });
    closeEditFinalControlPopover();
  } catch (error) {
    console.error("Failed to update final control:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(`#edit-settings-final-control-popover-${props.controlId}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить форму контроля "${
      control.value?.shortName ?? ""
    }"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление формы контроля",
    async () => {
      try {
        await finalControlStore.deleteFinalControl(props.controlId);
      } catch (error) {
        console.error("Failed to delete final control:", error);
        f7.dialog.alert("Произошла ошибка при удалении формы контроля.");
      }
    }
  );
};

const resetForm = () => {
  controlName.value = control.value?.name ?? "";
  controlShortName.value = control.value?.shortName ?? "";
  formError.value = "";
  finalControlStore.clearError();
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
