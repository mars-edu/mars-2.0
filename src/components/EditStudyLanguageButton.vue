<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="language"
      :id="'edit-language-popover-' + languageId"
      style="width: 600px !important"
      :target="`#language-item-${languageId}`"
      :on-closed="resetForm"
    >
      <div class="language-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать язык"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || studyLanguageStore.error"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || studyLanguageStore.error }}
        </div>

        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="language-name">
                Название языка <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="language-name"
                type="text"
                v-model:value="name"
                placeholder="Например: Русский"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="language-short-name">
                Короткое название
              </label>
              <f7-input
                id="language-short-name"
                type="text"
                v-model:value="shortName"
                placeholder="Необязательно"
              ></f7-input>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="language-code">
                Код языка <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="language-code"
                type="text"
                v-model:value="code"
                placeholder="ru, en, kk"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="language-order">
                Порядок
              </label>
              <f7-input
                id="language-order"
                type="number"
                v-model:value="order"
                placeholder="1"
              ></f7-input>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="language-color">
              Цвет
            </label>
            <f7-input
              id="language-color"
              type="text"
              v-model:value="color"
              placeholder="#111827"
            ></f7-input>
          </div>

          <div class="flex items-center">
            <f7-checkbox
              id="language-is-default"
              v-model:checked="isDefault"
              :disabled="language.isDefault"
            ></f7-checkbox>
            <label for="language-is-default" class="ml-2 text-sm text-foreground">
              По умолчанию (используется как запасной вариант для старых данных)
            </label>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="studyLanguageStore.loading || language.isDefault"
            >
              <IconTrash class="w-[18px] h-[18px] mr-2" />
              Удалить язык
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateLanguage"
          :disabled="!isFormValid || studyLanguageStore.loading"
          :is-loading="studyLanguageStore.loading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7, f7Input, f7Checkbox } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import { studyLanguageSchema } from "@/validators/study-language";
import { useStudyLanguageStore } from "@/stores/studyLanguageStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{ languageId: string }>();

const studyLanguageStore = useStudyLanguageStore();

const language = computed(() =>
  studyLanguageStore.getLanguageById(props.languageId)
);

const name = ref("");
const shortName = ref("");
const code = ref("");
const color = ref("");
const order = ref<number | null>(null);
const isDefault = ref(false);
const formError = ref("");

watchEffect(() => {
  if (language.value) {
    name.value = language.value.name;
    shortName.value = language.value.shortName ?? "";
    code.value = language.value.code;
    color.value = language.value.color ?? "";
    order.value = language.value.order ?? null;
    isDefault.value = language.value.isDefault;
  }
});

const validationResult = computed(() => {
  return studyLanguageSchema.safeParse({
    code: code.value,
    name: name.value,
    shortName: shortName.value,
    color: color.value,
    isDefault: isDefault.value,
    order: order.value ?? undefined,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditLanguagePopover = () => {
  f7.popover.close(`#edit-language-popover-${props.languageId}`);
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
    const data = validationResult.value.success ? validationResult.value.data : null;
    if (!data) return;

    await studyLanguageStore.updateStudyLanguage(props.languageId, {
      code: data.code,
      name: data.name,
      shortName: data.shortName,
      color: data.color,
      isDefault: data.isDefault,
      order: data.order,
    });
    closeEditLanguagePopover();
  } catch (error) {
    console.error("Failed to update language:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(`#edit-language-popover-${props.languageId}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить язык "${language.value?.name ?? ""}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление языка",
    async () => {
      try {
        await studyLanguageStore.deleteStudyLanguage(props.languageId);
      } catch (error) {
        console.error("Failed to delete language:", error);
        f7.dialog.alert(
          error instanceof Error ? error.message : "Произошла ошибка при удалении языка."
        );
      }
    }
  );
};

const resetForm = () => {
  if (!language.value) return;

  name.value = language.value.name;
  shortName.value = language.value.shortName ?? "";
  code.value = language.value.code;
  color.value = language.value.color ?? "";
  order.value = language.value.order ?? null;
  isDefault.value = language.value.isDefault;
  formError.value = "";
  studyLanguageStore.clearError();
};
</script>
