<template>
  <div>
    <f7-popover
      :id="'edit-student-popover-' + student.id"
      style="width: 600px !important"
      close-on-escape
      :target="`#student-item-${student.id}`"
    >
      <div class="student-popover bg-card text-card-foreground">
        <PopoverHeader
          title="Редактировать"
          :disabled="!isFormValid || studentStore.isLoading"
          :is-loading="studentStore.isLoading"
          :on-cancel="closeEditStudentPopover"
          :on-save="handleUpdateStudent"
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

          <SmartSelect
            label="Год поступления"
            :name="`academic-year-edit-${student.id}`"
            placeholder="Выберите год поступления"
            v-model="academicYear"
            :options="academicYearOptions"
            :id="`student-academic-year-edit-${student.id}`"
          />

          <SmartSelect
            label="Специальность"
            :name="`specialty-edit-${student.id}`"
            placeholder="Выберите специальность"
            v-model="specialty"
            :options="specialtyOptions"
            :id="`student-specialty-edit-${student.id}`"
          />

          <SmartSelect
            label="Язык обучения"
            :name="`language-edit-${student.id}`"
            placeholder="Выберите язык обучения"
            v-model="language"
            :options="languageOptions"
            :id="`student-language-edit-${student.id}`"
          />

          <SmartSelect
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
              <f7-icon
                ios="f7:trash"
                md="material:delete"
                size="18px"
                class="mr-2"
              ></f7-icon>
              Удалить студента
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
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useBaseStore } from "@/stores/baseStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { storeToRefs } from "pinia";
import SmartSelect from "@/components/ui/SmartSelect.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";

const props = defineProps<{
  student: {
    id: string;
    surname: string;
    firstName: string;
    patronymic: string;
    specialty: string;
    language: string;
    base: number;
    gender: "male" | "female";
    academicYearId?: string;
  };
}>();

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const baseStore = useBaseStore();
const academicYearStore = useAcademicYearStore();
const { specialties } = storeToRefs(specialtyStore);
const { languages } = storeToRefs(languageStore);
const { bases } = storeToRefs(baseStore);
const { academicYears } = storeToRefs(academicYearStore);

const surname = ref(props.student.surname);
const firstName = ref(props.student.firstName);
const patronymic = ref(props.student.patronymic);
const specialty = ref(props.student.specialty);
const language = ref(props.student.language);
const base = ref(props.student.base.toString());
const gender = ref<"male" | "female">(props.student.gender);
const academicYear = ref(props.student.academicYearId);
const formError = ref("");

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

const closeEditStudentPopover = () => {
  f7.popover.close(`#edit-student-popover-${props.student.id}`);
  resetForm();
};

const handleUpdateStudent = async () => {
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
    await studentStore.updateStudent(props.student.id, {
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
  f7.popover.close(`#edit-student-popover-${props.student.id}`);

  f7.dialog.confirm(
    `<p>Вы уверены, что хотите удалить студента \"${props.student.surname} ${props.student.firstName} ${props.student.patronymic}\"?</p>
     <p class="text-sm text-muted-foreground mt-2">Это действие нельзя отменить.</p>`,
    "Удаление студента",
    async () => {
      try {
        await studentStore.deleteStudent(props.student.id);
      } catch (error) {
        f7.dialog.alert("Произошла ошибка при удалении студента.");
      }
    }
  );
};

const resetForm = () => {
  surname.value = props.student.surname;
  firstName.value = props.student.firstName;
  patronymic.value = props.student.patronymic;
  specialty.value = props.student.specialty;
  language.value = props.student.language;
  base.value = props.student.base.toString();
  gender.value = props.student.gender;
  academicYear.value = props.student.academicYearId;
  formError.value = "";
  studentStore.clearError();
};
</script>
