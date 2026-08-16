<template>
  <div>
    <button
      id="add-language-button"
      class="bg-primary hover:opacity-90 text-primary-foreground px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 active:scale-95"
      aria-label="Добавить язык"
      type="button"
      @click.stop="openAddLanguagePopover"
    >
      <IconPlus class="text-[20px]" />
      <span>Добавить</span>
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-language-popover"
      style="width: 600px !important"
      target="#add-language-button"
      :on-closed="resetForm"
    >
      <div class="language-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать язык"
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
            ></f7-checkbox>
            <label for="language-is-default" class="ml-2 text-sm text-foreground">
              По умолчанию (используется как запасной вариант для старых данных)
            </label>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveLanguage"
          :disabled="!isFormValid || studyLanguageStore.loading"
          :is-loading="studyLanguageStore.loading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Input, f7Checkbox } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { studyLanguageSchema } from "@/validators/study-language";
import { useStudyLanguageStore } from "@/stores/studyLanguageStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const studyLanguageStore = useStudyLanguageStore();

const name = ref("");
const shortName = ref("");
const code = ref("");
const color = ref("");
const order = ref<number | null>(null);
const isDefault = ref(false);
const formError = ref("");

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
    const data = validationResult.value.success ? validationResult.value.data : null;
    if (!data) return;

    await studyLanguageStore.addStudyLanguage({
      code: data.code,
      name: data.name,
      shortName: data.shortName,
      color: data.color,
      isDefault: data.isDefault,
      order: data.order,
    });
    closeAddLanguagePopover();
  } catch (error) {
    console.error("Failed to add language:", error);
  }
};

const resetForm = () => {
  name.value = "";
  shortName.value = "";
  code.value = "";
  color.value = "";
  order.value = null;
  isDefault.value = false;
  formError.value = "";
  studyLanguageStore.clearError();
};
</script>
