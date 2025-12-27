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
          v-if="formError || courseStore.getError || duplicateSemesters.length > 0"
          class="px-4 pt-2 text-destructive text-sm"
        >
          <div v-if="formError">{{ formError }}</div>
          <div v-if="courseStore.getError">{{ courseStore.getError }}</div>
          <div v-if="duplicateSemesters.length > 0">
            <div class="font-semibold">Следующие семестры уже используются:</div>
            <ul class="list-disc list-inside mt-1">
              <li v-for="(dup, index) in duplicateSemesters" :key="index">
                {{ dup }}
              </li>
            </ul>
          </div>
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
              placeholder="Введите номер курса"
            ></f7-input>
          </div>

          <Select
            v-model="selectedSemesters"
            :options="semesterOptions"
            label="Семестры"
            placeholder="Выберите семестры"
            :multiple="true"
            @before-open="closeParentPopover"
            @after-close="openParentPopover"
          />
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Icon, f7Input } from "framework7-vue";
import { z } from "zod";
import { useCourseStore } from "@/stores/courseStore";
import { useSemesterStore } from "@/stores/semesterStore";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const courseStore = useCourseStore();
const semesterStore = useSemesterStore();

const semesterOptions = computed(() =>
  semesterStore.sortedSemesters.map((p) => ({ value: p.id, text: p.shortName }))
);

const courseNumber = ref("");
const selectedSemesters = ref<string[]>([]);
const formError = ref("");

// Helper to get semesters used by other courses
const usedSemesters = computed(() => {
  const used = new Map<string, string>(); // semesterId -> courseNumber
  courseStore.courses.forEach((course) => {
    course.semesters?.forEach((semesterId) => {
      used.set(semesterId, course.number);
    });
  });
  return used;
});

// Helper to find duplicate semester selections
const duplicateSemesters = computed(() => {
  const duplicates: string[] = [];
  selectedSemesters.value.forEach((semesterId) => {
    if (usedSemesters.value.has(semesterId)) {
      const semester = semesterStore.sortedSemesters.find(
        (s) => s.id === semesterId
      );
      if (semester) {
        const courseNumber = usedSemesters.value.get(semesterId);
        duplicates.push(`${semester.shortName} (уже используется курсом ${courseNumber})`);
      }
    }
  });
  return duplicates;
});

const courseSchema = z.object({
  number: z.string().min(1, "Пожалуйста, введите номер курса"),
  semesters: z.array(z.string()).optional(),
});

const validationResult = computed(() => {
  return courseSchema.safeParse({
    number: courseNumber.value,
    semesters: selectedSemesters.value,
  });
});

const isFormValid = computed(() => {
  return validationResult.value.success && duplicateSemesters.value.length === 0;
});

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

const closeParentPopover = () => {
  f7.popover.close("#add-settings-course-popover");
};

const openParentPopover = () => {
  f7.popover.open(
    "#add-settings-course-popover",
    "#add-settings-course-button"
  );
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
      number: courseNumber.value,
      admissionYear: new Date().getFullYear().toString(),
      semesters: selectedSemesters.value,
    });
    closeAddCoursePopover();
  } catch (error) {
    console.error("Failed to add course:", error);
  }
};

const resetForm = () => {
  courseNumber.value = "";
  selectedSemesters.value = [];
  formError.value = "";
  courseStore.clearError();
};
</script>
