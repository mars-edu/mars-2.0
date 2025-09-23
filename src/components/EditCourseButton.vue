<template>
  <div>
    <f7-popover
      :id="'edit-settings-course-popover-' + courseId"
      style="width: 600px !important"
      close-on-escape
      :target="`#course-item-${courseId}`"
    >
      <div class="course-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || courseStore.isLoading"
          :is-loading="courseStore.isLoading"
          :on-cancel="closeEditCoursePopover"
          :on-save="handleUpdateCourse"
        />

        <div
          v-if="formError || courseStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || courseStore.getError }}
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
          />

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="courseStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить курс
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7, f7Popover, f7Input, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useCourseStore } from "@/stores/courseStore";
import { useSemesterStore } from "@/stores/semesterStore";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  courseId: string;
}>();

const courseStore = useCourseStore();
const semesterStore = useSemesterStore();

const semesterOptions = computed(() =>
  semesterStore.sortedSemesters.map((p) => ({ value: p.id, text: p.shortName }))
);

const course = computed(() => courseStore.getCourseById(props.courseId));

const courseNumber = ref("");
const selectedSemesters = ref<string[]>([]);
const formError = ref("");

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

const isFormValid = computed(() => validationResult.value.success);

const closeEditCoursePopover = () => {
  f7.popover.close(`#edit-settings-course-popover-${props.courseId}`);
  resetForm();
};

const handleUpdateCourse = async () => {
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
    await courseStore.updateCourse(props.courseId, {
      number: courseNumber.value,
      semesters: selectedSemesters.value,
    });
    closeEditCoursePopover();
  } catch (error) {
    console.error("Failed to update course:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(`#edit-settings-course-popover-${props.courseId}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить курс "${course.value?.number ?? ""}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление курса",
    async () => {
      try {
        await courseStore.deleteCourse(props.courseId);
      } catch (error) {
        console.error("Failed to delete course:", error);
        f7.dialog.alert("Произошла ошибка при удалении курса.");
      }
    }
  );
};

const resetForm = () => {
  courseNumber.value = course.value?.number ?? "";
  selectedSemesters.value = course.value?.semesters
    ? [...course.value.semesters]
    : [];
  formError.value = "";
  courseStore.clearError();
};

watch(
  course,
  (c) => {
    if (c) {
      courseNumber.value = c.number;
      selectedSemesters.value = c.semesters ? [...c.semesters] : [];
    }
  },
  { immediate: true }
);
</script>
