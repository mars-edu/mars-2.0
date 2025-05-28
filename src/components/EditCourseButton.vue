<template>
  <div>
    <f7-popover
      :id="'edit-course-popover-' + course.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#course-item-${course.id}`"
    >
      <div class="course-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid"
          :is-loading="courseStore.isLoading"
          :on-cancel="closeEditCoursePopover"
          :on-save="handleUpdateCourse"
        />

        <div v-if="formError" class="px-4 pt-2 text-destructive text-sm">
          {{ formError }}
        </div>

        <div class="p-4 space-y-4">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="course-number">
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
                  :value="course.name"
                >
                  {{ course.name }}
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
              Удалить курс
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import {
  f7,
  f7Popover,
  f7Input,
  f7List,
  f7ListItem,
  f7Icon,
} from "framework7-vue";
import { z } from "zod";
import { useCourseStore } from "@/stores/courseStore";
import { useSelectedItemsStore } from "@/stores/selectedItemsStore";
import { useModuleStore } from "@/stores/moduleStore";
import { useColumnConfigStore } from "@/stores/columnConfig";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  course: {
    id: string;
    number: string;
    admissionYear: string;
    specialtyId: string;
    specialtyCode?: string;
  };
}>();

const courseStore = useCourseStore();
const selectedItemsStore = useSelectedItemsStore();
const moduleStore = useModuleStore();
const columnConfigStore = useColumnConfigStore();

const courseNumber = ref(props.course.number);
const admissionYear = ref(props.course.admissionYear);
const specialtyCode = ref(props.course.specialtyCode);
const isDeleting = ref(false);

const availableYears = computed(() => {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => String(currentYear - i));
});

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
      specialtyId: props.course.specialtyId,
    });
    closeEditCoursePopover();
  } catch (error) {
    console.error("Failed to update course:", error);
  }
};

const showDeleteConfirmation = () => {
  f7.popover.close(`#edit-course-popover-${props.course.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить курс "${props.course.number}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление курса",
    async () => {
      try {
        isDeleting.value = true;

        // Delete all associated modules first
        moduleStore.clearModulesBySpecialtyAndCourse(
          props.course.specialtyId,
          props.course.id
        );

        // Delete only the course-specific column configuration
        columnConfigStore.resetColumnsForCourse(props.course.id);

        // Then delete the course
        await courseStore.deleteCourse(props.course.id);

        selectedItemsStore.setSelectedCourse(null);
      } catch (error) {
        console.error("Failed to delete course:", error);
        f7.dialog.alert("Произошла ошибка при удалении курса.");
      } finally {
        isDeleting.value = false;
      }
    }
  );
};

const resetForm = () => {
  courseNumber.value = props.course.number;
  admissionYear.value = props.course.admissionYear;
  specialtyCode.value = props.course.specialtyCode;
  courseStore.clearError();
};

onMounted(async () => {
  // Load settings courses
  await courseStore.fetchCourses();
});
</script>
