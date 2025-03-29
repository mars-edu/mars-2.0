<template>
  <div>
    <button
      id="add-course-button"
      class="px-3 py-1 border rounded-md text-center flex items-center justify-center"
      aria-label="Add Course"
      type="button"
      @click="openAddCoursePopover"
    >
      <i class="f7-icons text-green-500">plus</i>
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
            <input
              id="course-number"
              type="text"
              v-model="courseNumber"
              placeholder="Введите нумерацию курса"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>

          <!-- Admission year dropdown -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="admission-year">
              Год поступления
            </label>
            <div class="relative">
              <select
                id="admission-year"
                v-model="admissionYear"
                class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground appearance-none pr-8 focus:ring-2 focus:ring-primary focus:border-primary"
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
                class="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none"
              >
                <f7-icon
                  ios="f7:chevron_down"
                  md="material:arrow_drop_down"
                  size="18px"
                ></f7-icon>
              </div>
            </div>
          </div>

          <!-- Specialty code input -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности
            </label>
            <input
              id="specialty-code"
              type="text"
              v-model="specialtyCode"
              placeholder="Для удобного отображения можно обозначить кодом, буквой или цифрой"
              class="w-full bg-background border border-input rounded-lg px-3 py-2 text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Icon } from "framework7-vue";

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
