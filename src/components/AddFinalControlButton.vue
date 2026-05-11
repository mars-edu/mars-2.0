<template>
  <div>
    <button
      id="add-settings-final-control-button"
      class="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
      aria-label="Add Final Control"
      type="button"
      @click.stop="openAddFinalControlPopover"
    >
      <IconPlus class="text-[20px]" />
      <span>Добавить</span>
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-settings-final-control-popover"
      style="width: 600px !important"
      target="#add-settings-final-control-button"
    
      :on-closed="resetForm">
      <div class="final-control-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :on-cancel="requestClose"
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
        </div>

        <PopoverFooter
          :on-save="handleSaveFinalControl"
          :disabled="!isFormValid || finalControlStore.isLoading"
          :is-loading="finalControlStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { z } from "zod";
import { useFinalControlStore } from "@/stores/finalControlStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const finalControlStore = useFinalControlStore();

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

const openAddFinalControlPopover = () => {
  f7.popover.open(
    "#add-settings-final-control-popover",
    "#add-settings-final-control-button"
  );
};

const closeAddFinalControlPopover = () => {
  f7.popover.close("#add-settings-final-control-popover");
  resetForm();
};

const handleSaveFinalControl = async () => {
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
    await finalControlStore.addFinalControl({
      name: controlName.value,
      shortName: controlShortName.value,
    });
    closeAddFinalControlPopover();
  } catch (error) {
    console.error("Failed to add final control:", error);
  }
};

const resetForm = () => {
  controlName.value = "";
  controlShortName.value = "";
  formError.value = "";
  finalControlStore.clearError();
};
</script>
