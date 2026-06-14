<template>
  <div>
    <button
      id="add-specialty-button"
      class="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-12 md:h-12 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors shadow-lg z-50"
      aria-label="Add Specialty"
      type="button"
      @click.stop="openAddSpecialtyPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-specialty-popover"
      style="width: 600px !important"
    >
      <div class="specialty-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :on-cancel="requestClose"
        />
        <!-- :disabled="!isFormValid || specialtyStore.isLoading" -->

        <div
          v-if="formError || specialtyStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || specialtyStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности
            </label>
            <f7-input
              id="specialty-code"
              type="text"
              v-model:value="specialtyCode"
              placeholder="Введите шифр специальности"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-name">
              Наименование специальности
            </label>
            <f7-input
              id="specialty-name"
              type="text"
              v-model:value="specialtyName"
              placeholder="Введите полное наименование специальности"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-details">
              Дополнительные сведения о специальности
            </label>
            <f7-input
              id="specialty-details"
              type="text"
              v-model:value="specialtyDetails"
              placeholder="Введите шифр специальности"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code-name">
              Кодовое наименование специальности
            </label>
            <f7-input
              id="specialty-code-name"
              type="text"
              v-model:value="specialtyCodeName"
              placeholder="Для удобного отображения можно обозначить кодом, буквой или цифрой"
            ></f7-input>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="specialty-year">
                Год основания
              </label>
              <f7-input
                id="specialty-year"
                type="number"
                v-model:value="specialtyYear"
                placeholder="2024"
              ></f7-input>
            </div>

            <div class="space-y-2">
              <label class="text-sm text-foreground" for="specialty-order-number">
                Приказ
              </label>
              <f7-input
                id="specialty-order-number"
                type="text"
                v-model:value="specialtyOrderNumber"
                placeholder="№..."
              ></f7-input>
            </div>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleSaveSpecialty"
          :is-loading="specialtyStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { z } from "zod";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const specialtyStore = useSpecialtyStore();

const specialtyCode = ref("");
const specialtyName = ref("");
const specialtyDetails = ref("");
const specialtyCodeName = ref("");
const specialtyYear = ref<number | undefined>(undefined);
const specialtyOrderNumber = ref("");

const specialtySchema = z.object({
  code: z.string().min(1, "Пожалуйста, введите шифр специальности"),
  name: z.string().min(1, "Пожалуйста, введите наименование специальности"),
  details: z.string().optional().default(""),
  codeName: z.string().optional().default(""),
  year: z.preprocess((v) => (v === "" || v === undefined ? undefined : Number(v)), z.number().optional()),
  orderNumber: z.string().optional().default(""),
});

const { formError, isFormValid } = useFormValidation(specialtySchema, () => ({
    code: specialtyCode.value,
    name: specialtyName.value,
    details: specialtyDetails.value,
    codeName: specialtyCodeName.value,
    year: Number(specialtyYear.value),
    orderNumber: specialtyOrderNumber.value,
  }));

const openAddSpecialtyPopover = () => {
  f7.popover.open("#add-specialty-popover", "#add-specialty-button");
};

function closeAddSpecialtyPopover() {
  f7.popover.close("#add-specialty-popover");
  resetForm();
}

async function handleSaveSpecialty() {
  if (!isFormValid.value) {
    return;
  }
  try {
    await specialtyStore.addSpecialty({
      code: specialtyCode.value,
      name: specialtyName.value,
      details: specialtyDetails.value,
      codeName: specialtyCodeName.value,
      year: Number(specialtyYear.value),
      orderNumber: specialtyOrderNumber.value,
    });
    closeAddSpecialtyPopover();
  } catch (error) {
    f7.dialog.alert("Произошла ошибка при добавлении специальности.");
  }
}

const resetForm = () => {
  specialtyCode.value = "";
  specialtyName.value = "";
  specialtyDetails.value = "";
  specialtyCodeName.value = "";
  specialtyYear.value = undefined;
  specialtyOrderNumber.value = "";
  specialtyStore.clearError();
};

defineExpose({ formError });
</script>
