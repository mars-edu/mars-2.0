<template>
  <div>
    <f7-popover
      :id="'edit-language-popover-' + language.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#language-item-${language.id}`"
    >
      <div class="language-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || languageStore.isLoading"
          :is-loading="languageStore.isLoading"
          :on-cancel="closeEditLanguagePopover"
          :on-save="handleUpdateLanguage"
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

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="languageStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить язык
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useLanguageStore } from "@/stores/languageStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  language: {
    id: string;
    name: string;
    code: string;
  };
}>();

const languageStore = useLanguageStore();

const languageName = ref(props.language.name);
const languageCode = ref(props.language.code);
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

const closeEditLanguagePopover = () => {
  f7.popover.close(`#edit-language-popover-${props.language.id}`);
  resetForm();
};

const handleUpdateLanguage = async () => {
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
    await languageStore.updateLanguage(props.language.id, {
      name: languageName.value,
      code: languageCode.value,
    });
    closeEditLanguagePopover();
  } catch (error) {
    console.error("Failed to update language:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(`#edit-language-popover-${props.language.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить язык "${props.language.name}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление языка",
    async () => {
      try {
        await languageStore.deleteLanguage(props.language.id);
      } catch (error) {
        console.error("Failed to delete language:", error);
        f7.dialog.alert("Произошла ошибка при удалении языка.");
      }
    }
  );
};

const resetForm = () => {
  languageName.value = props.language.name;
  languageCode.value = props.language.code;
  formError.value = "";
  languageStore.clearError();
};
</script>
