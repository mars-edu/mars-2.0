<template>
  <div>
    <button
      id="add-course-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
      :class="{
        'opacity-50 cursor-not-allowed bg-green-400': !selectedSpecialtyId,
      }"
      aria-label="Add Course"
      type="button"
      @click.stop="selectedSpecialtyId && openAddCoursePopover()"
      :disabled="!selectedSpecialtyId"
      :title="
        !selectedSpecialtyId
          ? 'Сначала выберите специальность'
          : 'Добавить курс'
      "
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
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
            :disabled="!isFormValid"
            @click="handleSaveCourse"
          >
            Сохранить
          </button>
        </div>

        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <!-- Course number select -->
          <div class="space-y-2">
            <label
              class="text-sm text-foreground flex items-center"
              for="course-number"
            >
              Номер курса
              <span class="text-destructive ml-1">*</span>
            </label>
            <div class="relative">
              <select
                id="course-number"
                v-model="courseNumber"
                class="w-full h-12 px-4 rounded-lg border border-input bg-background text-sm text-foreground focus:border-primary outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>Выберите номер курса</option>
                <option
                  v-for="course in courseStore.getVisibleCourses"
                  :key="course.id"
                  :value="course.name || course.number"
                >
                  {{ course.name || course.number }}
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

          <!-- Admission year dropdown -->
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

          <!-- Specialty code input (optional custom label) -->
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="specialty-code">
              Шифр специальности (необязательно)
            </label>
            <f7-input
              id="specialty-code"
              type="text"
              v-model:value="specialtyCode"
              placeholder="Произвольный шифр для отображения"
              :disabled="false"
              class=""
            ></f7-input>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import {
  f7,
  f7Popover,
  f7Icon,
  f7Input,
  f7List,
  f7ListItem,
} from "framework7-vue";
import { z } from "zod";
import { useCourseStore } from "@/stores/courseStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { storeToRefs } from "pinia";

const courseStore = useCourseStore();
const specialtyStore = useSpecialtyStore();
const selectedItemsStore = useSelectedItemsStore();
const { specialties } = storeToRefs(specialtyStore);

const courseNumber = ref("");
const admissionYear = ref("");
const specialtyCode = ref("");
const internalSpecialtyId = ref("");

const selectedSpecialtyId = computed(
  () => selectedItemsStore.selectedSpecialtyId
);

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => String(currentYear - i));
});

const handleSpecialtyChange = () => {
  if (selectedSpecialtyId.value) {
    const selectedSpecialty = specialtyStore.getSpecialtyById(
      selectedSpecialtyId.value
    );
  }
};

const courseSchema = z.object({
  number: z.string().min(1, "Пожалуйста, выберите номер курса"),
  admissionYear: z.string(),
  specialtyCode: z.string().optional(),
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

const openAddCoursePopover = async () => {
  if (!selectedSpecialtyId.value) return;

  if (selectedSpecialtyId.value) {
    internalSpecialtyId.value = selectedSpecialtyId.value;
    handleSpecialtyChange();
  }

  // Ensure courses are loaded
  await courseStore.fetchCourses();

  f7.popover.open("#add-course-popover", "#add-course-button");
};

const closeAddCoursePopover = () => {
  f7.popover.close("#add-course-popover");
  resetForm();
};

const handleSaveCourse = async () => {
  if (!isFormValid.value || !selectedSpecialtyId.value) return;

  try {
    const newCourse = await courseStore.addCourse({
      number: courseNumber.value,
      admissionYear: admissionYear.value,
      specialtyCode: specialtyCode.value,
      specialtyId: selectedSpecialtyId.value,
    });

    setTimeout(() => {
      closeAddCoursePopover();
    }, 100);
  } catch (error) {
    console.error("Failed to add course:", error);
  }
};

const resetForm = () => {
  courseNumber.value = "";
  admissionYear.value = "";
  specialtyCode.value = "";

  if (selectedSpecialtyId.value) {
    internalSpecialtyId.value = selectedSpecialtyId.value;
    handleSpecialtyChange();
  }

  courseStore.clearError();
};

watch(
  selectedSpecialtyId,
  (newVal) => {
    if (newVal) {
      console.log("Selected specialty ID changed in AddCourseButton:", newVal);
      internalSpecialtyId.value = newVal;
      handleSpecialtyChange();
    }
  },
  { immediate: true }
);

onMounted(async () => {
  // Load courses
  await courseStore.fetchCourses();
});
</script>
