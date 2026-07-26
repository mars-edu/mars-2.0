<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="technology"
      :id="'edit-education-technology-popover-' + technology.id"
      style="width: 600px !important"
      :target="`#education-technology-item-${technology.id}`"
      :on-closed="resetForm"
    >
      <div class="education-technology-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать технологию обучения"
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
              :disabled="technology.isDefault"
            ></f7-checkbox>
            <label for="tech-is-default" class="ml-2 text-sm text-foreground">
              По умолчанию (используется как запасной вариант для старых данных)
            </label>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateEducationTechnology"
          :disabled="!isFormValid || educationTechnologyStore.loading"
          :is-loading="educationTechnologyStore.loading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7, f7Input, f7Checkbox } from "framework7-vue";
import { educationTechnologySchema } from "@/validators/education-technology";
import { useEducationTechnologyStore } from "@/stores/educationTechnologyStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  educationTechnologyId: string;
}>();

const educationTechnologyStore = useEducationTechnologyStore();

const technology = computed(() => educationTechnologyStore.getById(props.educationTechnologyId));

const name = ref("");
const shortName = ref("");
const academicHourMinutes = ref<number | null>(null);
const description = ref("");
const isDefault = ref(false);
const formError = ref("");

watchEffect(() => {
  if (technology.value) {
    name.value = technology.value.name;
    shortName.value = technology.value.shortName ?? "";
    academicHourMinutes.value = technology.value.academicHourMinutes;
    description.value = technology.value.description ?? "";
    isDefault.value = technology.value.isDefault;
  }
});

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

const closeEditEducationTechnologyPopover = () => {
  if (!technology.value) return;
  f7.popover.close(`#edit-education-technology-popover-${technology.value.id}`);
  resetForm();
};

const handleUpdateEducationTechnology = async () => {
  if (!isFormValid.value || !technology.value) {
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

    await educationTechnologyStore.updateEducationTechnology(technology.value.id, {
      name: data.name,
      shortName: data.shortName,
      academicHourMinutes: data.academicHourMinutes,
      isDefault: data.isDefault,
      description: data.description,
    });
    closeEditEducationTechnologyPopover();
  } catch (error) {
    console.error("Failed to update education technology:", error);
  }
};

const resetForm = () => {
  if (!technology.value) return;

  name.value = technology.value.name;
  shortName.value = technology.value.shortName ?? "";
  academicHourMinutes.value = technology.value.academicHourMinutes;
  description.value = technology.value.description ?? "";
  isDefault.value = technology.value.isDefault;
  formError.value = "";
  educationTechnologyStore.clearError();
};
</script>
