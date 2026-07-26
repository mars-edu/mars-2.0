<template>
  <div>
    <button
      id="add-education-technology-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors"
      aria-label="Добавить технологию обучения"
      type="button"
      @click.stop="openAddEducationTechnologyPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-education-technology-popover"
      style="width: 600px !important"
      target="#add-education-technology-button"
      :on-closed="resetForm"
    >
      <div class="education-technology-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать технологию обучения"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || educationTechnologyStore.error"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || educationTechnologyStore.error }}
        </div>

        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="tech-name">
                Название <span class="text-destructive ml-1">*</span>
              </label>
              <f7-input
                id="tech-name"
                type="text"
                v-model:value="name"
                placeholder="Например: Классическая"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="tech-short-name">
                Короткое название
              </label>
              <f7-input
                id="tech-short-name"
                type="text"
                v-model:value="shortName"
                placeholder="Например: КЛ"
              ></f7-input>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="tech-academic-hour-minutes">
              Длительность академического часа (мин) <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="tech-academic-hour-minutes"
              type="number"
              min="1"
              max="180"
              v-model:value="academicHourMinutes"
              placeholder="45"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="tech-description">
              Описание
            </label>
            <f7-input
              id="tech-description"
              type="textarea"
              v-model:value="description"
              placeholder="Необязательно"
            ></f7-input>
          </div>

          <div class="flex items-center">
            <f7-checkbox
              id="tech-is-default"
              v-model:checked="isDefault"
            ></f7-checkbox>
            <label for="tech-is-default" class="ml-2 text-sm text-foreground">
              По умолчанию (используется как запасной вариант для старых данных)
            </label>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveEducationTechnology"
          :disabled="!isFormValid || educationTechnologyStore.loading"
          :is-loading="educationTechnologyStore.loading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Input, f7Checkbox } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { educationTechnologySchema } from "@/validators/education-technology";
import { useEducationTechnologyStore } from "@/stores/educationTechnologyStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const educationTechnologyStore = useEducationTechnologyStore();

const name = ref("");
const shortName = ref("");
const academicHourMinutes = ref<number | null>(null);
const description = ref("");
const isDefault = ref(false);
const formError = ref("");

const validationResult = computed(() => {
  return educationTechnologySchema.safeParse({
    name: name.value,
    shortName: shortName.value,
    academicHourMinutes: academicHourMinutes.value ?? undefined,
    isDefault: isDefault.value,
    description: description.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddEducationTechnologyPopover = () => {
  f7.popover.open("#add-education-technology-popover", "#add-education-technology-button");
};

const closeAddEducationTechnologyPopover = () => {
  f7.popover.close("#add-education-technology-popover");
  resetForm();
};

const handleSaveEducationTechnology = async () => {
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

    await educationTechnologyStore.addEducationTechnology({
      name: data.name,
      shortName: data.shortName,
      academicHourMinutes: data.academicHourMinutes,
      isDefault: data.isDefault,
      description: data.description,
    });
    closeAddEducationTechnologyPopover();
  } catch (error) {
    console.error("Failed to add education technology:", error);
  }
};

const resetForm = () => {
  name.value = "";
  shortName.value = "";
  academicHourMinutes.value = null;
  description.value = "";
  isDefault.value = false;
  formError.value = "";
  educationTechnologyStore.clearError();
};
</script>
