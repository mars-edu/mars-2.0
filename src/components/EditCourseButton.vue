<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      :id="'edit-settings-course-popover-' + courseId"
      style="width: 600px !important"
      :target="`#course-item-${courseId}`"
    
      :on-closed="resetForm">
      <div class="course-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :on-cancel="requestClose"
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
          />

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="courseStore.isLoading"
            >
              <IconTrash class="w-[18px] h-[18px] mr-2" />
              Удалить курс
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateCourse"
          :disabled="!isFormValid || courseStore.isLoading"
          :is-loading="courseStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import { courseSchema } from '@/validators/course';
import { useCourseStore } from "@/stores/courseStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useNestedParent } from "@/composables/useNestedParent";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  courseId: string;
}>();

const courseStore = useCourseStore();
const semesterStore = useSemesterStore();

// Nested popover management
const popoverId = computed(() => `#edit-settings-course-popover-${props.courseId}`);
const targetSelector = computed(() => `#course-item-${props.courseId}`);

const { confirmWithParent } = useNestedParent({
  parentId: popoverId,
  parentTargetSelector: targetSelector,
});

const semesterOptions = computed(() =>
  semesterStore.sortedSemesters.map((p) => ({ value: p.id, text: p.shortName }))
);

const course = computed(() => courseStore.getCourseById(props.courseId));

const courseNumber = ref("");
const selectedSemesters = ref<string[]>([]);
const formError = ref("");

// Helper to get semesters used by other courses (excluding current course)
const usedSemesters = computed(() => {
  const used = new Map<string, string>(); // semesterId -> courseNumber
  courseStore.courses.forEach((c) => {
    // Skip the course being edited
    if (c.id === props.courseId) return;

    c.semesters?.forEach((semesterId) => {
      used.set(semesterId, c.number);
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


const validationResult = computed(() => {
  return courseSchema.safeParse({
    number: courseNumber.value,
    semesters: selectedSemesters.value,
  });
});

const isFormValid = computed(() => {
  return validationResult.value.success && duplicateSemesters.value.length === 0;
});

const closeEditCoursePopover = () => {
  f7.popover.close(popoverId.value);
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
  confirmWithParent(
    "Удаление курса",
    `<p>Вы уверены, что хотите удалить курс "${course.value?.number ?? ""}"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
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
