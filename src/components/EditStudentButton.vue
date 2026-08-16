<template>
  <div>
    <GuardedPopover
      v-slot="{ requestClose }"
      v-if="student"
      :id="'edit-student-popover-' + student.id"
      style="width: 600px !important"
      :on-closed="resetForm">
      <div class="student-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || studentStore.getError"
          class="px-4 pt-2 text-destructive text-sm"
        >
          {{ formError || studentStore.getError }}
        </div>

        <div class="p-4 space-y-2">
          <div class="space-y-2">
            <label class="text-sm text-foreground" for="student-surname-edit">
              Фамилия
            </label>
            <f7-input
              :id="`student-surname-edit-${student.id}`"
              type="text"
              v-model:value="surname"
              placeholder="Введите фамилию студента"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="student-firstname-edit">
              Имя
            </label>
            <f7-input
              :id="`student-firstname-edit-${student.id}`"
              type="text"
              v-model:value="firstName"
              placeholder="Введите имя студента"
            ></f7-input>
          </div>

          <div class="space-y-2">
            <label
              class="text-sm text-foreground"
              for="student-patronymic-edit"
            >
              Отчество
            </label>
            <f7-input
              :id="`student-patronymic-edit-${student.id}`"
              type="text"
              v-model:value="patronymic"
              placeholder="Введите отчество студента"
            ></f7-input>
          </div>

          <Select
            label="Год поступления"
            :name="`academic-year-edit-${student.id}`"
            placeholder="Выберите год поступления"
            v-model="academicYear"
            :options="academicYearOptions"
            :id="`student-academic-year-edit-${student.id}`"
          />

            <Select
              label="Специальность"
              name="specialty"
              placeholder="Выберите специальность"
              v-model="specialty"
              :options="filteredSpecialtyOptions"
              :id="`student-specialty-edit-${studentId}`"
            />

          <Select
            label="Язык обучения"
            :name="`language-edit-${student.id}`"
            placeholder="Выберите язык обучения"
            v-model="language"
            :options="languageOptions"
            :id="`student-language-edit-${student.id}`"
          />

          <Select
            label="База"
            :name="`base-edit-${student.id}`"
            placeholder="Выберите базу"
            v-model="base"
            :options="baseOptions"
            :id="`student-base-edit-${student.id}`"
          />

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="student-gender-edit">
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

          <div class="pt-4 border-t border-border">
            <button
              class="flex items-center justify-center w-full py-2 px-4 bg-destructive/10 hover:bg-destructive/20 rounded-lg text-destructive transition-colors"
              @click="showDeleteConfirmation"
              :disabled="studentStore.isLoading"
            >
              <IconTrash class="w-[18px] h-[18px] mr-2" />
              Удалить студента
            </button>
          </div>
        </div>

        <PopoverFooter
          :on-save="handleUpdateStudent"
          :disabled="!isFormValid || studentStore.isLoading"
          :is-loading="studentStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watchEffect } from "vue";
import { f7, f7Popover, f7Input, f7Button } from "framework7-vue";
import IconTrash from "~icons/lucide/trash-2";
import { studentSchema } from "@/validators/student";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useStudyLanguageStore } from "@/stores/studyLanguageStore";
import { useBaseStore } from "@/stores/baseStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { storeToRefs } from "pinia";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const props = defineProps<{
  studentId: string;
}>();

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useStudyLanguageStore();
const baseStore = useBaseStore();
const academicYearStore = useAcademicYearStore();
const { languageOptions } = storeToRefs(languageStore);
const { baseOptions } = storeToRefs(baseStore);
const { academicYearOptions } = storeToRefs(academicYearStore);

// Get student from store by ID - always fresh data
const student = computed(() => studentStore.getStudentById(props.studentId));

const surname = ref("");
const firstName = ref("");
const patronymic = ref("");
const specialty = ref("");
const language = ref("");
const base = ref("9");
const gender = ref<"male" | "female">("male");
const academicYear = ref("");

const filteredSpecialtyOptions = computed(() => {
  if (!academicYear.value) {
    return specialtyStore.specialties.map(s => ({
      value: s.id,
      text: `${s.name} - ${s.details}`,
    }));
  }
  const yearDoc = academicYearStore.getAcademicYearById(academicYear.value);
  const targetYear = yearDoc?.startYear;
  
  return specialtyStore.specialties
    .filter(s => !targetYear || s.year === targetYear || !s.year) // Include if matching year or no year set
    .map(s => ({
      value: s.id,
      text: `${s.name} - ${s.details}`,
    }));
});

watch(academicYear, (newVal, oldVal) => {
  if (oldVal && newVal !== oldVal) {
    specialty.value = "";
  }
});

const formError = ref("");

// Update form fields whenever student data changes
watchEffect(() => {
  if (student.value) {
    surname.value = student.value.surname;
    firstName.value = student.value.firstName;
    patronymic.value = student.value.patronymic;
    specialty.value = student.value.specialty;
    language.value = student.value.language;
    base.value = (student.value.base ?? 9).toString();
    gender.value = student.value.gender;
    academicYear.value = student.value.academicYearId || "";
  }
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

const closeEditStudentPopover = () => {
  if (!student.value) return;
  f7.popover.close(`#edit-student-popover-${student.value.id}`);
  resetForm();
};

const handleUpdateStudent = async () => {
  if (!isFormValid.value || !student.value) {
    if (!validationResult.value.success) {
      const issues = validationResult.value.error.issues;
      if (issues.length > 0) {
        formError.value = issues[0].message;
      }
    }
    return;
  }

  try {
    await studentStore.updateStudent(student.value.id, {
      surname: surname.value,
      firstName: firstName.value,
      patronymic: patronymic.value,
      specialty: specialty.value,
      language: language.value,
      base: parseInt(base.value),
      gender: gender.value!,
      academicYearId: academicYear.value,
    });
    closeEditStudentPopover();
  } catch (error) {
    if (error instanceof Error) {
      formError.value = error.message;
    } else {
      formError.value = "Произошла неизвестная ошибка при обновлении студента.";
    }
  }
};

const showDeleteConfirmation = () => {
  if (!student.value) return;
  f7.popover.close(`#edit-student-popover-${student.value.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить студента \"${student.value.surname} ${student.value.firstName} ${student.value.patronymic}\"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление студента",
    async () => {
      if (!student.value) return;
      try {
        await studentStore.deleteStudent(student.value.id);
      } catch (error) {
        f7.dialog.alert("Произошла ошибка при удалении студента.");
      }
    }
  );
};

const resetForm = () => {
  if (!student.value) return;
  surname.value = student.value.surname;
  firstName.value = student.value.firstName;
  patronymic.value = student.value.patronymic;
  specialty.value = student.value.specialty;
  language.value = student.value.language;
  base.value = (student.value.base ?? 9).toString();
  gender.value = student.value.gender;
  academicYear.value = student.value.academicYearId || "";
  formError.value = "";
  studentStore.clearError();
};
</script>
