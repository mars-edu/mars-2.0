<template>
  <div>
    <button
      id="add-settings-intermediate-control-button"
      class="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
      aria-label="Add Intermediate Control"
      type="button"
      @click.stop="openAddIntermediateControlPopover"
    >
      <IconPlus class="text-[20px]" />
      <span>Добавить</span>
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-settings-intermediate-control-popover"
      style="width: 600px !important"
      target="#add-settings-intermediate-control-button"
    
      :on-closed="resetForm">
      <div class="intermediate-control-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :on-cancel="requestClose"
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
        </div>

        <PopoverFooter
          :on-save="handleSaveIntermediateControl"
          :disabled="!isFormValid || intermediateControlStore.isLoading"
          :is-loading="intermediateControlStore.isLoading"
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
import { useIntermediateControlStore } from "@/stores/intermediateControlStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const intermediateControlStore = useIntermediateControlStore();

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

const openAddIntermediateControlPopover = () => {
  f7.popover.open(
    "#add-settings-intermediate-control-popover",
    "#add-settings-intermediate-control-button"
  );
};

const closeAddIntermediateControlPopover = () => {
  f7.popover.close("#add-settings-intermediate-control-popover");
  resetForm();
};

const handleSaveIntermediateControl = async () => {
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
    await intermediateControlStore.addIntermediateControl({
      name: controlName.value,
      shortName: controlShortName.value,
    });
    closeAddIntermediateControlPopover();
  } catch (error) {
    console.error("Failed to add intermediate control:", error);
  }
};

const resetForm = () => {
  controlName.value = "";
  controlShortName.value = "";
  formError.value = "";
  intermediateControlStore.clearError();
};
</script>
