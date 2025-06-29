<template>
  <f7-popover
    :opened="opened"
    @popover:closed="onPopoverClosed"
    class="popover-center-page"
    style="width: 600px !important"
    close-on-escape
  >
    <div class="bg-card text-card-foreground">
      <PopoverHeader
        title="Добавить Модуль/Дисциплину"
        :disabled="!isFormValid || class9Store.loading"
        :is-loading="class9Store.loading"
        :on-cancel="onPopoverClosed"
        :on-save="handleSave"
      />

      <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
        {{ formError }}
      </div>

      <div class="p-4 space-y-3">
        <div class="space-y-2">
          <label class="text-sm text-foreground" for="ktp-item-module-index">
            Индекс модуля
          </label>
          <f7-input
            id="ktp-item-module-index"
            type="text"
            v-model:value="formData.moduleIndex"
            placeholder="Например, ОД.01"
          ></f7-input>
        </div>

        <div class="space-y-2">
          <label class="text-sm text-foreground" for="ktp-item-module-name">
            Наименование модуля/дисциплины
          </label>
          <f7-input
            id="ktp-item-module-name"
            type="textarea"
            v-model:value="formData.moduleName"
            placeholder="Введите наименование"
            class="h-24"
            resizable
          ></f7-input>
        </div>

        <div class="space-y-2">
          <label class="text-sm text-foreground" for="ktp-item-total-hours">
            Всего часов
          </label>
          <f7-input
            id="ktp-item-total-hours"
            type="number"
            v-model:value="formData.totalHours"
            placeholder="0"
          ></f7-input>
        </div>
      </div>
    </div>
  </f7-popover>
</template>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import { f7Popover, f7Input } from "framework7-vue";
import { z } from "zod";
import { useClass9Store } from "@/stores/class9Store";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  opened: boolean;
  academicYearId: string | null;
  specialtyId: string | null;
  courseId: string | null;
}>();

const emit = defineEmits(["update:opened"]);

const class9Store = useClass9Store();
const formError = ref("");

const formData = reactive({
  moduleIndex: "",
  moduleName: "",
  totalHours: "",
});

const formSchema = z.object({
  moduleIndex: z.string().min(1, "Индекс не может быть пустым."),
  moduleName: z.string().min(1, "Наименование не может быть пустым."),
  totalHours: z.string().min(1, "Укажите количество часов."),
});

const validationResult = computed(() => formSchema.safeParse(formData));
const isFormValid = computed(() => validationResult.value.success);

const resetForm = () => {
  formData.moduleIndex = "";
  formData.moduleName = "";
  formData.totalHours = "";
  formError.value = "";
};

const onPopoverClosed = () => {
  resetForm();
  emit("update:opened", false);
};

const handleSave = async () => {
  if (!props.academicYearId || !props.specialtyId || !props.courseId) {
    formError.value =
      "Контекст не определен. Выберите год, специальность и курс.";
    return;
  }

  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.issues[0].message;
    }
    return;
  }

  try {
    await class9Store.addClass9(
      props.academicYearId,
      props.specialtyId,
      props.courseId,
      {
        moduleIndex: formData.moduleIndex,
        moduleName: formData.moduleName,
        totalHours: formData.totalHours,
      }
    );
    onPopoverClosed();
  } catch (err) {
    formError.value =
      err instanceof Error ? err.message : "Не удалось добавить запись.";
  }
};
</script>

<style>
.popover.popover-center-page {
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  border-radius: 0.5rem;
  overflow: hidden;
}
</style>
