<template>
  <div>
    <button
      id="add-student-button"
      class="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-12 md:h-12 flex items-center justify-center text-white bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg z-50"
      aria-label="Add Student"
      type="button"
      @click.stop="openAddStudentPopover"
    >
      <f7-icon
        ios="f7:plus"
        md="material:add"
        size="16px"
        class="text-white"
      ></f7-icon>
    </button>

    <f7-popover
      id="add-student-popover"
      style="width: 600px !important"
      target="#add-student-button"
      close-on-escape
    >
      <div class="student-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Создать"
          :disabled="!isFormValid || studentStore.isLoading"
          :is-loading="studentStore.isLoading"
          :on-cancel="closeAddStudentPopover"
          :on-save="handleSaveStudent"
        />

        <div
          v-if="formError || studentStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || studentStore.getError }}
        </div>

        <div class="p-4 space-y-2">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="student-surname">
              Фамилия
            </label>
            <f7-input
              id="student-surname"
              type="text"
              v-model:value="surname"
              placeholder="Введите фамилию студента"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="student-firstname">
              Имя
            </label>
            <f7-input
              id="student-firstname"
              type="text"
              v-model:value="firstName"
              placeholder="Введите имя студента"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="student-patronymic">
              Отчество
            </label>
            <f7-input
              id="student-patronymic"
              type="text"
              v-model:value="patronymic"
              placeholder="Введите отчество студента"
            ></f7-input>
          </div>

          <Select
            label="Год поступления"
            name="academic-year"
            placeholder="Выберите год поступления"
            v-model="academicYear"
            :options="academicYearOptions"
            id="student-academic-year-add"
          />

          <Select
            label="Специальность"
            name="specialty"
            placeholder="Выберите специальность"
            v-model="specialty"
            :options="specialtyOptions"
            id="student-specialty-add"
          />

          <Select
            label="Язык обучения"
            name="language"
            placeholder="Выберите язык обучения"
            v-model="language"
            :options="languageOptions"
            id="student-language-add"
          />

          <Select
            label="База"
            name="base"
            placeholder="Выберите базу"
            v-model="base"
            :options="baseOptions"
            id="student-base-add"
          />

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="student-gender">
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
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useBaseStore } from "@/stores/baseStore";
import { storeToRefs } from "pinia";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const academicYearStore = useAcademicYearStore();
const baseStore = useBaseStore();
const { specialties } = storeToRefs(specialtyStore);
const { languages } = storeToRefs(languageStore);
const { academicYears } = storeToRefs(academicYearStore);
const { bases } = storeToRefs(baseStore);

const surname = ref("");
const firstName = ref("");
const patronymic = ref("");
const academicYear = ref("");
const specialty = ref("");
const language = ref("");
const base = ref("");
const gender = ref<"male" | "female" | null>(null);
const formError = ref("");

import { onMounted } from "vue";

onMounted(() => {
  academicYear.value = academicYearStore.getActiveAcademicYear?.id || "";
});

const academicYearOptions = computed(() =>
  academicYears.value.map((year) => ({
    value: year.id,
    text: year.startYear.toString(),
  }))
);

const specialtyOptions = computed(() =>
  specialties.value.map((s) => ({
    value: s.code,
    text: s.name,
  }))
);

const languageOptions = computed(() =>
  languages.value.map((l) => ({
    value: l.code,
    text: l.name,
  }))
);

const baseOptions = computed(() =>
  bases.value.map((base) => ({
    value: base.value,
    text: base.text,
  }))
);

const studentSchema = z.object({
  surname: z.string().min(1, "Пожалуйста, введите фамилию студента"),
  firstName: z.string().min(1, "Пожалуйста, введите имя студента"),
  patronymic: z.string().min(1, "Пожалуйста, введите отчество студента"),
  academicYear: z.string().min(1, "Пожалуйста, выберите год поступления"),
  specialty: z.string().min(1, "Пожалуйста, выберите специальность"),
  language: z.string().min(1, "Пожалуйста, выберите язык обучения"),
  base: z.string().min(1, "Пожалуйста, введите базу"),
  gender: z.enum(["male", "female"], {
    required_error: "Пожалуйста, выберите пол",
  }),
});

const validationResult = computed(() => {
  return studentSchema.safeParse({
    surname: surname.value,
    firstName: firstName.value,
    patronymic: patronymic.value,
    academicYear: academicYear.value,
    specialty: specialty.value,
    language: language.value,
    base: base.value,
    gender: gender.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddStudentPopover = () => {
  f7.popover.open("#add-student-popover", "#add-student-button");
};

const closeAddStudentPopover = () => {
  f7.popover.close("#add-student-popover");
  resetForm();
};

const handleSaveStudent = async () => {
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
    await studentStore.addStudent({
      surname: surname.value,
      firstName: firstName.value,
      patronymic: patronymic.value,
      academicYearId: academicYear.value,
      specialty: specialty.value,
      language: language.value,
      base: parseInt(base.value),
      gender: gender.value!,
    });
    closeAddStudentPopover();
  } catch (error) {
    if (error instanceof Error) {
      formError.value = error.message;
    } else {
      formError.value = "Произошла неизвестная ошибка при добавлении студента.";
    }
  }
};

const resetForm = () => {
  surname.value = "";
  firstName.value = "";
  patronymic.value = "";
  academicYear.value = academicYearStore.getActiveAcademicYear?.id || "";
  specialty.value = "";
  language.value = "";
  base.value = "";
  gender.value = null;
  formError.value = "";
  studentStore.clearError();
};
</script>
