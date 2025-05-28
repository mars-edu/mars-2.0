<template>
  <div>
    <button
      id="add-settings-course-button"
      class="w-7 h-7 md:p-2 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors"
      aria-label="Add Course"
      type="button"
      @click.stop="openAddCoursePopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-settings-course-popover"
      style="width: 600px !important"
      target="#add-settings-course-button"
      close-on-escape
    >
      <div class="course-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :disabled="!isFormValid || courseStore.isLoading"
          :is-loading="courseStore.isLoading"
          :on-cancel="closeAddCoursePopover"
          :on-save="handleSaveCourse"
        />

        <div
          v-if="formError || courseStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || courseStore.getError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="course-name">
              Название курса
              <span class="text-destructive ml-1">*</span>
            </label>
            <f7-input
              id="course-name"
              type="text"
              v-model:value="courseName"
              placeholder="Введите название курса"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <div class="text-sm text-foreground">Видимость курса</div>
            <f7-checkbox
              v-model:value="isVisible"
              label="Курс видимый"
            ></f7-checkbox>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Icon, f7Input, f7Checkbox } from "framework7-vue";
import { z } from "zod";
import { useCourseStore } from "@/stores/courseStore";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const courseStore = useCourseStore();

const courseName = ref("");
const isVisible = ref(true);
const formError = ref("");

const courseSchema = z.object({
  name: z.string().min(1, "Пожалуйста, введите название курса"),
  isVisible: z.boolean(),
});

const validationResult = computed(() => {
  return courseSchema.safeParse({
    name: courseName.value,
    isVisible: isVisible.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddCoursePopover = () => {
  f7.popover.open(
    "#add-settings-course-popover",
    "#add-settings-course-button"
  );
};

const closeAddCoursePopover = () => {
  f7.popover.close("#add-settings-course-popover");
  resetForm();
};

const handleSaveCourse = async () => {
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
    await courseStore.addCourse({
      name: courseName.value,
      number: courseName.value,
      admissionYear: new Date().getFullYear().toString(),
      specialtyId: "",
      isVisible: isVisible.value,
    });
    closeAddCoursePopover();
  } catch (error) {
    console.error("Failed to add course:", error);
  }
};

const resetForm = () => {
  courseName.value = "";
  isVisible.value = true;
  formError.value = "";
  courseStore.clearError();
};
</script>
