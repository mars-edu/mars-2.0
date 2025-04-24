<template>
  <div>
    <f7-popover
      :id="'edit-course-popover-' + course.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#course-item-${course.id}`"
    >
      <div class="course-popover bg-card text-card-foreground">
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="closeEditCoursePopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Редактировать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!isFormValid"
            @click="handleUpdateCourse"
          >
            Сохранить
          </button>
        </div>

        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="course-number">
              Номер курса
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="course-number"
              type="text"
              v-model:value="courseNumber"
              placeholder="Введите нумерацию курса"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="admission-year">
              Год поступления
            </label>
            <div class="relative">
              <select
                id="admission-year"
                v-model="admissionYear"
                class="w-full h-12 px-4 rounded-lg border border-input bg-background text-sm text-foreground focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>Выберите год поступления</option>
                <option
                  v-for="year in availableYears"
                  :key="year"
                  :value="year"
                >
                  {{ year }}
                </option>
              </select>
              <div
                class="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
              >
                <f7-icon
                  ios="f7:chevron_down"
                  md="material:keyboard_arrow_down"
                  size="16px"
                  class="text-muted-foreground"
                ></f7-icon>
              </div>
            </div>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности
            </label>
            <f7-input
              id="specialty-code"
              type="text"
              v-model:value="specialtyCode"
              placeholder="Для удобного отображения можно обозначить кодом, буквой или цифрой"
            ></f7-input>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7List, f7ListItem } from "framework7-vue";
import { z } from "zod";
import { useCourseStore } from "@/stores/courseStore";

const props = defineProps<{
  course: {
    id: string;
    number: string;
    admissionYear: string;
    specialtyCode: string;
  };
}>();

const courseStore = useCourseStore();

const courseNumber = ref(props.course.number);
const admissionYear = ref(props.course.admissionYear);
const specialtyCode = ref(props.course.specialtyCode);

// Generate available years (current year and previous 5 years)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => String(currentYear - i));
});

const courseSchema = z.object({
  number: z.string().min(1, "Пожалуйста, введите номер курса"),
  admissionYear: z.string(),
  specialtyCode: z.string(),
});

const validationResult = computed(() => {
  return courseSchema.safeParse({
    number: courseNumber.value,
    admissionYear: admissionYear.value,
    specialtyCode: specialtyCode.value,
  });
});

const formError = computed(() => {
  if (validationResult.value.success) return "";
  const issues = validationResult.value.error.issues;
  if (issues.length > 0) return issues[0].message;
  return courseStore.getError || "";
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditCoursePopover = () => {
  f7.popover.close(`#edit-course-popover-${props.course.id}`);
  resetForm();
};

const handleUpdateCourse = async () => {
  if (!isFormValid.value) return;

  try {
    await courseStore.updateCourse(props.course.id, {
      number: courseNumber.value,
      admissionYear: admissionYear.value,
      specialtyCode: specialtyCode.value,
    });
    closeEditCoursePopover();
  } catch (error) {
    console.error("Failed to update course:", error);
  }
};

const resetForm = () => {
  courseNumber.value = props.course.number;
  admissionYear.value = props.course.admissionYear;
  specialtyCode.value = props.course.specialtyCode;
  courseStore.clearError();
};

defineExpose({
  closeEditCoursePopover,
});
</script>
