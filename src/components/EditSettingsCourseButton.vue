<template>
  <div>
    <f7-popover
      :id="'edit-settings-course-popover-' + course.id"
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
            :disabled="!isFormValid || courseStore.isLoading"
            @click="handleUpdateCourse"
          >
            Сохранить
          </button>
        </div>

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
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Checkbox, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useSettingsCourseStore } from "@/stores/settingsCourseStore";

const props = defineProps<{
  course: {
    id: string;
    name: string;
    isVisible: boolean;
  };
}>();

const courseStore = useSettingsCourseStore();

const courseName = ref(props.course.name);
const isVisible = ref(props.course.isVisible);
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

const closeEditCoursePopover = () => {
  f7.popover.close(`#edit-settings-course-popover-${props.course.id}`);
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
    await courseStore.updateCourse(props.course.id, {
      name: courseName.value,
      isVisible: isVisible.value,
    });
    closeEditCoursePopover();
  } catch (error) {
    console.error("Failed to update course:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(`#edit-settings-course-popover-${props.course.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить курс "${props.course.name}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление курса",
    async () => {
      try {
        await courseStore.deleteCourse(props.course.id);
      } catch (error) {
        console.error("Failed to delete course:", error);
        f7.dialog.alert("Произошла ошибка при удалении курса.");
      }
    }
  );
};

const resetForm = () => {
  courseName.value = props.course.name;
  isVisible.value = props.course.isVisible;
  formError.value = "";
  courseStore.clearError();
};
</script>
