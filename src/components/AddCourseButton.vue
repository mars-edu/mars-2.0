<template>
  <div>
    <button
      id="add-course-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-green-500 md:text-primary hover:bg-primary/10 rounded-lg transition-colors"
      aria-label="Add Course"
      type="button"
      @click="openAddCoursePopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="md:text-primary"
      ></f7-icon>
    </button>

    <!-- Framework7 Popover -->
    <f7-popover
      id="add-course-popover"
      style="width: 600px !important"
      target="#add-course-button"
      close-on-escape
    >
      <div class="course-popover bg-card text-card-foreground">
        <!-- Header with buttons -->
        <div
          class="flex justify-between items-center px-4 py-3 border-b border-input"
        >
          <button
            class="text-muted-foreground hover:text-foreground"
            @click="closeAddCoursePopover"
          >
            Отменить
          </button>
          <span class="text-foreground font-semibold">Создать</span>
          <button
            class="text-primary hover:text-primary/80 disabled:text-muted-foreground"
            :disabled="!!formError"
            @click="handleSaveCourse"
          >
            Сохранить
          </button>
        </div>

        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <!-- Course number input -->
          <div class="space-y-2">
            <label
              class="text-sm text-foreground flex items-center"
              for="course-number"
            >
              Номер курса
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="course-number"
              type="text"
              v-model="courseNumber"
              placeholder="Введите нумерацию курса"
            ></f7-input>
          </div>

          <!-- Admission year dropdown -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="admission-year">
              Год поступления
            </label>
            <div class="relative">
              <f7-list no-hairlines-md>
                <f7-list-item
                  smart-select
                  :smart-select-params="{
                    openIn: 'popover',
                    closeOnSelect: true,
                    searchbar: false,
                    title: 'Год поступления',
                  }"
                >
                  <template #title>
                    <span>{{
                      admissionYear || "Выберите год поступления"
                    }}</span>
                  </template>
                  <select id="admission-year" v-model="admissionYear">
                    <option value="" disabled>Выберите год поступления</option>
                    <option
                      v-for="year in availableYears"
                      :key="year"
                      :value="year"
                    >
                      {{ year }}
                    </option>
                  </select>
                </f7-list-item>
              </f7-list>
            </div>
          </div>

          <!-- Specialty code input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности
            </label>
            <f7-input
              id="specialty-code"
              type="text"
              v-model="specialtyCode"
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
import {
  f7,
  f7Popover,
  f7Icon,
  f7Input,
  f7List,
  f7ListItem,
} from "framework7-vue";

const emit = defineEmits<{
  (e: "course-added", course: CourseData): void;
}>();

interface CourseData {
  number: string;
  admissionYear: string;
  specialtyCode: string;
}

// Form state
const courseNumber = ref("");
const admissionYear = ref("");
const specialtyCode = ref("");
const formError = ref("");

// Generate available years (current year and previous 5 years)
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => String(currentYear - i));
});

// Popover controls
const openAddCoursePopover = () => {
  f7.popover.open("#add-course-popover", "#add-course-button");
};

const closeAddCoursePopover = () => {
  f7.popover.close("#add-course-popover");
  resetForm();
};

// Form validation
const validateForm = () => {
  if (!courseNumber.value.trim()) {
    formError.value = "Пожалуйста, введите номер курса";
    return false;
  }

  formError.value = "";
  return true;
};

// Save handler
const handleSaveCourse = () => {
  if (!validateForm()) return;

  emit("course-added", {
    number: courseNumber.value,
    admissionYear: admissionYear.value,
    specialtyCode: specialtyCode.value,
  });

  closeAddCoursePopover();
};

// Reset form
const resetForm = () => {
  courseNumber.value = "";
  admissionYear.value = "";
  specialtyCode.value = "";
  formError.value = "";
};
</script>
