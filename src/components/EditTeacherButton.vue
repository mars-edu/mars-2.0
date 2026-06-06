<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="teacher"
      :id="'edit-teacher-popover-' + teacher.id"
      style="width: 600px !important"
      :on-closed="resetForm">
      <div class="teacher-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || teacherStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || teacherStore.getError }}
        </div>

        <div class="p-4 space-y-2">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-surname-edit">
              Фамилия
            </label>
            <f7-input
              :id="`teacher-surname-edit-${teacher.id}`"
              type="text"
              v-model:value="surname"
              placeholder="Введите фамилию преподавателя"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-firstname-edit">
              Имя
            </label>
            <f7-input
              :id="`teacher-firstname-edit-${teacher.id}`"
              type="text"
              v-model:value="firstName"
              placeholder="Введите имя преподавателя"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="teacher-patronymic-edit"
            >
              Отчество
            </label>
            <f7-input
              :id="`teacher-patronymic-edit-${teacher.id}`"
              type="text"
              v-model:value="patronymic"
              placeholder="Введите отчество преподавателя"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-position-edit">
              Должность
            </label>
            <f7-input
              :id="`teacher-position-edit-${teacher.id}`"
              type="text"
              v-model:value="position"
              placeholder="Введите должноcть преподавателя"
            ></f7-input>
          </div>

          <Select
            label="Год поступления на работу"
            :name="`employment-year-edit-${teacher.id}`"
            placeholder="Выберите год поступления"
            v-model="employmentYear"
            :options="employmentYearOptions"
            :id="`teacher-employment-year-edit-${teacher.id}`"
          />

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-gender-edit">
              Пол
            </label>
            <div class="flex gap-2">
              <Button
                :variant="gender === 'male' ? 'primary' : 'ghost'"
                @click="gender = 'male'"
                class="flex-1"
                >Мужской</Button
              >
              <Button
                :variant="gender === 'female' ? 'primary' : 'ghost'"
                @click="gender = 'female'"
                class="flex-1"
                >Женский</Button
              >
            </div>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="teacherStore.isLoading"
            >
              <IconTrash class="w-[18px] h-[18px] mr-2" />
              Удалить преподавателя
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateTeacher"
          :disabled="!isFormValid || teacherStore.isLoading"
          :is-loading="teacherStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7, f7Popover, f7Input } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import { z } from "zod";
import { useTeacherStore } from "@/stores/teacherStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { storeToRefs } from "pinia";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import Button from "@/components/ui/Button.vue";

const props = defineProps<{
  teacherId: string;
}>();

const teacherStore = useTeacherStore();
const academicYearStore = useAcademicYearStore();
const { academicYearsAsNumbers } = storeToRefs(academicYearStore);

// Get teacher from store by ID - always fresh data
const teacher = computed(() => teacherStore.getTeacherById(props.teacherId));

const surname = ref("");
const firstName = ref("");
const patronymic = ref("");
const position = ref("");
const employmentYear = ref("");
const gender = ref<"male" | "female">("male");
const formError = ref("");

// Update form fields whenever teacher data changes
watchEffect(() => {
  if (teacher.value) {
    surname.value = teacher.value.surname;
    firstName.value = teacher.value.firstName;
    patronymic.value = teacher.value.patronymic;
    position.value = teacher.value.position;
    employmentYear.value = teacher.value.employmentYear.toString();
    gender.value = teacher.value.gender;
  }
});

const employmentYearOptions = computed(() =>
  academicYearsAsNumbers.value.map((y) => ({
    value: y.toString(),
    text: y.toString(),
  }))
);

const teacherSchema = z.object({
  surname: z.string().min(1, "Пожалуйста, введите фамилию преподавателя"),
  firstName: z.string().min(1, "Пожалуйста, введите имя преподавателя"),
  patronymic: z.string().min(1, "Пожалуйста, введите отчество преподавателя"),
  position: z.string().min(1, "Пожалуйста, выберите должность"),
  employmentYear: z.string().min(1, "Пожалуйста, выберите год поступления"),
  gender: z.enum(["male", "female"], {
    message: "Пожалуйста, выберите пол",
  }),
});

const validationResult = computed(() => {
  return teacherSchema.safeParse({
    surname: surname.value,
    firstName: firstName.value,
    patronymic: patronymic.value,
    position: position.value,
    employmentYear: employmentYear.value,
    gender: gender.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const closeEditTeacherPopover = () => {
  if (!teacher.value) return;
  f7.popover.close(`#edit-teacher-popover-${teacher.value.id}`);
  resetForm();
};

const handleUpdateTeacher = async () => {
  if (!isFormValid.value || !teacher.value) {
    if (!validationResult.value.success) {
      const issues = validationResult.value.error.issues;
      if (issues.length > 0) {
        formError.value = issues[0].message;
      }
    }
    return;
  }

  try {
    await teacherStore.updateTeacher(teacher.value.id, {
      surname: surname.value,
      firstName: firstName.value,
      patronymic: patronymic.value,
      position: position.value,
      employmentYear: parseInt(employmentYear.value),
      gender: gender.value!,
    });
    closeEditTeacherPopover();
  } catch (error) {
    if (error instanceof Error) {
      formError.value = error.message;
    }
  }
};

const showDeleteConfirmation = () => {
  if (!teacher.value) return;
  f7.dialog.confirm(
    `Вы уверены, что хотите удалить преподавателя ${teacherStore.getTeacherFullName(
      teacher.value.id
    )}?`,
    "Подтверждение",
    async () => {
      if (!teacher.value) return;
      try {
        await teacherStore.deleteTeacher(teacher.value.id);
        closeEditTeacherPopover();
      } catch (error) {
        if (error instanceof Error) {
          f7.dialog.alert(error.message, "Ошибка");
        }
      }
    }
  );
};

const resetForm = () => {
  if (!teacher.value) return;
  surname.value = teacher.value.surname;
  firstName.value = teacher.value.firstName;
  patronymic.value = teacher.value.patronymic;
  position.value = teacher.value.position;
  employmentYear.value = teacher.value.employmentYear.toString();
  gender.value = teacher.value.gender;
  formError.value = "";
  teacherStore.clearError();
};
</script>
