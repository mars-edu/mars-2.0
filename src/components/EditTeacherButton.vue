<template>
  <div>
    <f7-popover
      :id="'edit-teacher-popover-' + teacher.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#teacher-item-${teacher.id}`"
    >
      <div class="teacher-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || teacherStore.isLoading"
          :is-loading="teacherStore.isLoading"
          :on-cancel="closeEditTeacherPopover"
          :on-save="handleUpdateTeacher"
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
              <f7-button
                :fill="gender === 'male'"
                @click="gender = 'male'"
                class="flex-1"
                >Мужской</f7-button
              >
              <f7-button
                :fill="gender === 'female'"
                @click="gender = 'female'"
                class="flex-1"
                >Женский</f7-button
              >
            </div>
          </div>

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="teacherStore.isLoading"
            >
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить преподавателя
            </button>
          </div>
        </div>
      </div>
    </f7-popover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Button, f7Icon } from "framework7-vue";
import { z } from "zod";
import { useTeacherStore } from "@/stores/teacherStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { storeToRefs } from "pinia";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import type { Teacher } from "@/stores/teacherStore";

const props = defineProps<{
  teacher: Teacher;
}>();

const teacherStore = useTeacherStore();
const academicYearStore = useAcademicYearStore();
const { academicYearsAsNumbers } = storeToRefs(academicYearStore);

const surname = ref(props.teacher.surname);
const firstName = ref(props.teacher.firstName);
const patronymic = ref(props.teacher.patronymic);
const position = ref(props.teacher.position);
const employmentYear = ref(props.teacher.employmentYear.toString());
const gender = ref<"male" | "female">(props.teacher.gender);
const formError = ref("");

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
    required_error: "Пожалуйста, выберите пол",
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
  f7.popover.close(`#edit-teacher-popover-${props.teacher.id}`);
  resetForm();
};

const handleUpdateTeacher = async () => {
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
    await teacherStore.updateTeacher(props.teacher.id, {
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
  f7.dialog.confirm(
    `Вы уверены, что хотите удалить преподавателя ${teacherStore.getTeacherFullName(
      props.teacher.id
    )}?`,
    "Подтверждение",
    async () => {
      try {
        await teacherStore.deleteTeacher(props.teacher.id);
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
  surname.value = props.teacher.surname;
  firstName.value = props.teacher.firstName;
  patronymic.value = props.teacher.patronymic;
  position.value = props.teacher.position;
  employmentYear.value = props.teacher.employmentYear.toString();
  gender.value = props.teacher.gender;
  formError.value = "";
  teacherStore.clearError();
};
</script>
