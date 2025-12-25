<template>
  <div>
    <f7-popover
      v-if="specialty"
      :id="'edit-specialty-popover-' + specialty.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#specialty-item-${specialty.id}`"
    >
      <div class="specialty-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :is-loading="specialtyStore.isLoading"
          :on-cancel="closeEditSpecialtyPopover"
          :on-save="handleUpdateSpecialty"
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

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="specialtyStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить специальность
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  specialtyId: string;
}>();

const specialtyStore = useSpecialtyStore();

// Get specialty from store by ID - always fresh data
const specialty = computed(() => specialtyStore.getSpecialtyById(props.specialtyId));

const specialtyCode = ref("");
const specialtyName = ref("");
const specialtyDetails = ref("");
const specialtyCodeName = ref("");

// Update form fields whenever specialty data changes
watchEffect(() => {
  if (specialty.value) {
    specialtyCode.value = specialty.value.code;
    specialtyName.value = specialty.value.name;
    specialtyDetails.value = specialty.value.details;
    specialtyCodeName.value = specialty.value.codeName;
  }
});

const specialtySchema = z.object({
  code: z.string().min(1, "Пожалуйста, введите шифр специальности"),
  name: z.string().min(1, "Пожалуйста, введите наименование специальности"),
  details: z.string().optional().default(""),
  codeName: z.string().optional().default(""),
});

const validationResult = computed(() => {
  return specialtySchema.safeParse({
    code: specialtyCode.value,
    name: specialtyName.value,
    details: specialtyDetails.value,
    codeName: specialtyCodeName.value,
  });
});

const formError = computed(() => {
  if (validationResult.value.success) return "";
  const issues = validationResult.value.error.issues;
  if (issues.length > 0) return issues[0].message;
  return "";
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditSpecialtyPopover = () => {
  if (!specialty.value) return;
  f7.popover.close(`#edit-specialty-popover-${specialty.value.id}`);
  resetForm();
};

const handleUpdateSpecialty = async () => {
  if (!isFormValid.value || !specialty.value) {
    return;
  }
  try {
    await specialtyStore.updateSpecialty(specialty.value.id, {
      code: specialtyCode.value,
      name: specialtyName.value,
      details: specialtyDetails.value,
      codeName: specialtyCodeName.value,
    });
    closeEditSpecialtyPopover();
  } catch (error) {
    f7.dialog.alert("Произошла ошибка при обновлении специальности.");
  }
};

const showDeleteConfirmation = () => {
  if (!specialty.value) return;
  f7.popover.close(`#edit-specialty-popover-${specialty.value.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить специальность "${specialty.value.name}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление специальности",
    async () => {
      if (!specialty.value) return;
      try {
        await specialtyStore.deleteSpecialty(specialty.value.id);
      } catch (error) {
        console.error("Failed to delete specialty:", error);
        f7.dialog.alert("Произошла ошибка при удалении специальности.");
      }
    }
  );
};

const resetForm = () => {
  if (!specialty.value) return;
  specialtyCode.value = specialty.value.code;
  specialtyName.value = specialty.value.name;
  specialtyDetails.value = specialty.value.details;
  specialtyCodeName.value = specialty.value.codeName;
  specialtyStore.clearError();
};


defineExpose({ formError });
</script>
