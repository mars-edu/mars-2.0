<template>
  <div>
    <f7-popover
      :id="'edit-specialty-popover-' + specialty.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#specialty-item-${specialty.id}`"
    >
      <div class="specialty-popover bg-card text-card-foreground">
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="closeEditSpecialtyPopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Редактировать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!isFormValid"
            @click="handleUpdateSpecialty"
          >
            Сохранить
          </button>
        </div>

        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
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

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности
            </label>
            <f7-input
              id="specialty-code"
              type="text"
              v-model:value="specialtyCode"
              placeholder="Внесите шифр специальности"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <div class="text-sm text-foreground">Создание модуля/дисциплин</div>
            <f7-checkbox
              v-model:value="createModule"
              label="Поставьте галочку"
            ></f7-checkbox>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
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

    <div id="specialty-delete-dialog" class="dialog" style="display: none">
      <div class="dialog-inner">
        <div class="dialog-title">Удаление специальности</div>
        <div class="dialog-content">
          <div class="p-4">
            <p>
              Вы уверены, что хотите удалить специальность "{{
                specialty.name
              }}"?
            </p>
            <p class="text-sm text-muted-foreground mt-2">
              Это действие нельзя отменить.
            </p>
          </div>
        </div>
        <div class="dialog-buttons">
          <button class="dialog-button" @click="cancelDelete">Отмена</button>
          <button
            class="dialog-button dialog-button-bold text-destructive"
            :disabled="isDeleting"
            @click="handleDeleteSpecialty"
          >
            {{ isDeleting ? "Удаление..." : "Удалить" }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useCourseStore } from "@/stores/courseStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";

const props = defineProps<{
  specialty: {
    id: string;
    name: string;
    codeName?: string;
    code: string;
    hasModule: boolean;
  };
}>();

const specialtyStore = useSpecialtyStore();
const courseStore = useCourseStore();
const selectedItemsStore = useSelectedItemsStore();

const specialtyName = ref(props.specialty.name);
const specialtyCodeName = ref(props.specialty.codeName || "");
const specialtyCode = ref(props.specialty.code);
const createModule = ref(props.specialty.hasModule);
const isDeleting = ref(false);

const specialtySchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите наименование специальности"),
  codeName: z.string().optional(),
  code: z.string().min(1, "Пожалуйста, введите шифр специальности"),
  hasModule: z.boolean(),
});

const validationResult = computed(() => {
  return specialtySchema.safeParse({
    name: specialtyName.value,
    codeName: specialtyCodeName.value,
    code: specialtyCode.value,
    hasModule: createModule.value,
  });
});

const formError = computed(() => {
  if (validationResult.value.success) return "";
  const issues = validationResult.value.error.issues;
  if (issues.length > 0) return issues[0].message;
  return specialtyStore.getError || "";
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditSpecialtyPopover = () => {
  f7.popover.close(`#edit-specialty-popover-${props.specialty.id}`);
  resetForm();
};

const handleUpdateSpecialty = async () => {
  if (!isFormValid.value) return;

  try {
    await specialtyStore.updateSpecialty(props.specialty.id, {
      name: specialtyName.value,
      codeName: specialtyCodeName.value,
      code: specialtyCode.value,
      hasModule: createModule.value,
    });
    closeEditSpecialtyPopover();
  } catch (error) {
    console.error("Failed to update specialty:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.dialog.open("#specialty-delete-dialog");
};

const cancelDelete = () => {
  f7.dialog.close("#specialty-delete-dialog");
};

const handleDeleteSpecialty = async () => {
  isDeleting.value = true;
  try {
    const associatedCourses = courseStore.getCoursesBySpecialtyId(
      props.specialty.id
    );

    for (const course of associatedCourses) {
      await courseStore.deleteCourse(course.id);
    }

    await specialtyStore.deleteSpecialty(props.specialty.id);

    selectedItemsStore.clearSelection();

    f7.dialog.close("#specialty-delete-dialog");
    closeEditSpecialtyPopover();
  } catch (error) {
    console.error("Failed to delete specialty:", error);
  } finally {
    isDeleting.value = false;
  }
};

const resetForm = () => {
  specialtyName.value = props.specialty.name;
  specialtyCodeName.value = props.specialty.codeName || "";
  specialtyCode.value = props.specialty.code;
  createModule.value = props.specialty.hasModule;
  specialtyStore.clearError();
};

defineExpose({
  closeEditSpecialtyPopover,
});
</script>
