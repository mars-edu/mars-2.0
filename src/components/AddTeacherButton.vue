<template>
  <div>
    <button
      id="add-teacher-button"
      class="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-12 md:h-12 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg z-50"
      aria-label="Add Teacher"
      type="button"
      @click.stop="openAddTeacherPopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-teacher-popover"
      style="width: 600px !important"
      target="#add-teacher-button"
      close-on-escape
    >
      <div class="teacher-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :disabled="!isFormValid || teacherStore.isLoading"
          :is-loading="teacherStore.isLoading"
          :on-cancel="closeAddTeacherPopover"
          :on-save="handleSaveTeacher"
        />

        <div
          v-if="formError || teacherStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || teacherStore.getError }}
        </div>

        <div class="p-4 space-y-2">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-surname">
              Фамилия
            </label>
            <f7-input
              id="teacher-surname"
              type="text"
              v-model:value="surname"
              placeholder="Введите фамилию преподавателя"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-firstname">
              Имя
            </label>
            <f7-input
              id="teacher-firstname"
              type="text"
              v-model:value="firstName"
              placeholder="Введите имя преподавателя"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-patronymic">
              Отчество
            </label>
            <f7-input
              id="teacher-patronymic"
              type="text"
              v-model:value="patronymic"
              placeholder="Введите отчество преподавателя"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-position">
              Должность
            </label>
            <f7-input
              id="teacher-position"
              type="text"
              v-model:value="position"
              placeholder="Введите должность преподавателя"
            ></f7-input>
          </div>

          <Select
            label="Год поступления на работу"
            name="employment-year"
            placeholder="Выберите год поступления"
            v-model="employmentYear"
            :options="employmentYearOptions"
            id="teacher-employment-year-add"
          />

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="teacher-gender">
              Пол
            </label>
            <div class="flex gap-2">
              <f7-button
                :fill="gender === 'male'"
                @click="gender = 'male'"
                class="flex-1 !border-solid !border-2"
                :class="{
                  '!border-gray-500 !text-gray-500': gender !== 'male',
                }"
                >Мужской</f7-button
              >
              <f7-button
                :fill="gender === 'female'"
                @click="gender = 'female'"
                class="flex-1 !border-solid !border-2"
                :class="{
                  '!border-gray-500 !text-gray-500': gender !== 'female',
                }"
                >Женский</f7-button
              >
            </div>
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

const teacherStore = useTeacherStore();
const academicYearStore = useAcademicYearStore();
const { academicYearsAsNumbers } = storeToRefs(academicYearStore);

const surname = ref("");
const firstName = ref("");
const patronymic = ref("");
const position = ref("");
const employmentYear = ref("");
const gender = ref<"male" | "female" | null>(null);
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
  position: z.string().min(1, "Пожалуйста, введите должность"),
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

const openAddTeacherPopover = () => {
  f7.popover.open("#add-teacher-popover", "#add-teacher-button");
};

const closeAddTeacherPopover = () => {
  f7.popover.close("#add-teacher-popover");
  resetForm();
};

const handleSaveTeacher = async () => {
  if (!isFormValid.value) {
    if (!validationResult.value.success) {
      formError.value = validationResult.value.error.errors[0].message;
    }
    return;
  }
  formError.value = "";
  try {
    await teacherStore.addTeacher({
      surname: surname.value,
      firstName: firstName.value,
      patronymic: patronymic.value,
      position: position.value,
      employmentYear: parseInt(employmentYear.value),
      gender: gender.value as "male" | "female",
    });
    closeAddTeacherPopover();
  } catch (error) {
    
  }
};

const resetForm = () => {
  surname.value = "";
  firstName.value = "";
  patronymic.value = "";
  position.value = "";
  employmentYear.value = "";
  gender.value = null;
  formError.value = "";
  teacherStore.clearError();
};
</script>
