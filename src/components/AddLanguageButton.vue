<template>
  <div>
    <button
      id="add-language-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      aria-label="Add Language"
      type="button"
      @click.stop="openAddLanguagePopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-language-popover"
      style="width: 600px !important"
      target="#add-language-button"
    
      :on-closed="resetForm">
      <div class="language-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :disabled="!isFormValid || languageStore.isLoading"
          :is-loading="languageStore.isLoading"
          :on-cancel="requestClose"
          :on-save="handleSaveLanguage"
        />

        <div
          v-if="formError || languageStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || languageStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="language-name">
              Название языка
            </label>
            <f7-input
              id="language-name"
              type="text"
              v-model:value="languageName"
              placeholder="Введите название языка"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="language-code">
              Код языка
            </label>
            <f7-input
              id="language-code"
              type="text"
              v-model:value="languageCode"
              placeholder="Введите код языка (например, ru, en, kk)"
            ></f7-input>
          </div>
        </div>
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useLanguageStore } from "@/stores/languageStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const languageStore = useLanguageStore();

const languageName = ref("");
const languageCode = ref("");
const formError = ref("");

const languageSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите название языка"),
  code: z.string().min(1, "Пожалуйста, введите код языка"),
});

const validationResult = computed(() => {
  return languageSchema.safeParse({
    name: languageName.value,
    code: languageCode.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddLanguagePopover = () => {
  f7.popover.open("#add-language-popover", "#add-language-button");
};

const closeAddLanguagePopover = () => {
  f7.popover.close("#add-language-popover");
  resetForm();
};

const handleSaveLanguage = async () => {
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
    await languageStore.addLanguage({
      name: languageName.value,
      code: languageCode.value,
    });
    closeAddLanguagePopover();
  } catch (error) {
    console.error("Failed to add language:", error);
  }
};

const resetForm = () => {
  languageName.value = "";
  languageCode.value = "";
  formError.value = "";
  languageStore.clearError();
};
</script>
