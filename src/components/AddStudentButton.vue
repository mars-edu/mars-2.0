<template>
  <div>
    <button
      id="add-student-button"
      class="fixed bottom-20 right-4 md:bottom-6 md:right-6 w-14 h-14 md:w-12 md:h-12 flex items-center justify-center text-white bg-primary hover:bg-primary/90 rounded-full transition-colors shadow-lg z-50"
      aria-label="Add Student"
      type="button"
      @click.stop="openAddStudentPopover"
    >
      <IconPlus class="w-4 h-4 text-white" />
    </button>

    <GuardedPopover
      v-slot="{ requestClose }"
      id="add-student-popover"
      style="width: 800px !important; height: auto !important;"
      kind="popup"
      :on-closed="resetForm">
      <div class="student-popover bg-card text-card-foreground flex flex-col">
        <PopoverHeader
          title="Зачисление абитуриента"
          :on-cancel="requestClose"
        />
        <div
          v-if="formError || studentStore.getError"
          class="px-8 pt-2 text-destructive text-sm"
        >
          {{ formError || studentStore.getError }}
        </div>

        <div class="px-8 py-4 space-y-6">
          <!-- Order Info Section -->
          <div class="bg-muted/30 p-6 rounded-2xl border border-border mb-4">
              <h3 class="text-sm font-bold text-foreground mb-4">Данные приказа о зачислении</h3>
              <div class="grid grid-cols-2 gap-6">
                  <div class="space-y-2">
                      <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Номер приказа</label>
                      <f7-input 
                          type="text" 
                          class="student-order-input"
                          placeholder="Например: №234-К"
                          v-model:value="orderNumber"
                      />
                  </div>
                  <div class="space-y-2">
                      <label class="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Дата приказа</label>
                      <f7-input 
                          type="date" 
                          class="student-order-input"
                          v-model:value="orderDate"
                      />
                  </div>
              </div>
          </div>

          <div class="grid grid-cols-3 gap-4">
            <div class="space-y-2">
              <label class="text-sm text-foreground" for="student-surname">
                Фамилия
              </label>
              <f7-input
                id="student-surname"
                type="text"
                v-model:value="surname"
                placeholder="Введите фамилию"
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
                placeholder="Введите имя"
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
                placeholder="Введите отчество"
              ></f7-input>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <Select
              label="Год поступления"
              name="academic-year"
              placeholder="Выберите год"
              v-model="academicYear"
              :options="academicYearOptions"
              id="student-academic-year-add"
            />

            <Select
              label="База образования"
              name="base"
              placeholder="Выберите базу"
              v-model="base"
              :options="baseOptions"
              id="student-base-add"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <Select
              label="Специальность"
              name="specialty"
              placeholder="Выберите специальность"
              v-model="specialty"
              :options="filteredSpecialtyOptions"
              id="student-specialty-add"
            />

            <Select
              label="Язык обучения"
              name="language"
              placeholder="Выберите язык"
              v-model="language"
              :options="languageOptions"
              id="student-language-add"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm text-foreground" for="student-gender">
              Пол
            </label>
            <div class="flex gap-4">
              <f7-button
                :fill="gender === 'male'"
                @click="gender = 'male'"
                class="flex-1 !h-11 !rounded-xl !border-solid !border-2 !font-semibold transition-all"
                :class="{
                  '!border-border !text-muted-foreground': gender !== 'male',
                  '!border-primary !text-primary-foreground': gender === 'male',
                }"
                >Мужской</f7-button
              >
              <f7-button
                :fill="gender === 'female'"
                @click="gender = 'female'"
                class="flex-1 !h-11 !rounded-xl !border-solid !border-2 !font-semibold transition-all"
                :class="{
                  '!border-border !text-muted-foreground': gender !== 'female',
                  '!border-pink-500 !text-pink-600': gender === 'female' && false, /* Custom pink style if needed */
                }"
                >Женский</f7-button
              >
            </div>
          </div>
        </div>

        <PopoverFooter
          save-text="Зачислить"
          :on-save="handleSaveStudent"
          :disabled="!isFormValid || studentStore.isLoading"
          :is-loading="studentStore.isLoading"
        />
      </div>
    </GuardedPopover>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from "vue";
import { f7, f7Popover, f7Input, f7Button } from "framework7-vue";
import IconPlus from "~icons/lucide/plus";
import { studentCreateSchema } from "@/validators/student";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useBaseStore } from "@/stores/baseStore";
import { storeToRefs } from "pinia";
import Select from "@/components/ui/Select.vue";
import PopoverHeader from "@/components/ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const academicYearStore = useAcademicYearStore();
const baseStore = useBaseStore();
const { languageOptions } = storeToRefs(languageStore);
const { academicYearOptions } = storeToRefs(academicYearStore);
const { baseOptions } = storeToRefs(baseStore);

const surname = ref("");
const firstName = ref("");
const patronymic = ref("");
const academicYear = ref("");
const specialty = ref("");

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
    .filter(s => !targetYear || s.year === targetYear || !s.year) // Include if matching year or no year set (legacy)
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

const gender = ref<"male" | "female" | null>(null);
const orderNumber = ref("");
const orderDate = ref(new Date().toISOString().split("T")[0]);
const formError = ref("");

import { onMounted } from "vue";

onMounted(() => {
  academicYear.value = academicYearStore.getActiveAcademicYear?.id || "";
});



const validationResult = computed(() => {
  return studentCreateSchema.safeParse({
    surname: surname.value,
    firstName: firstName.value,
    patronymic: patronymic.value,
    academicYear: academicYear.value,
    specialty: specialty.value,
    language: language.value,
    base: base.value,
    gender: gender.value,
    orderNumber: orderNumber.value,
    orderDate: orderDate.value,
  });
});

const isFormValid = computed(() => validationResult.value.success);

const openAddStudentPopover = () => {
  f7.popup.open("#add-student-popover");
};

const closeAddStudentPopover = () => {
  f7.popup.close("#add-student-popover");
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
      history: [
        {
          date: orderDate.value,
          type: "admission",
          orderNumber: orderNumber.value,
          description: `Зачисление на 1 курс. ${specialtyStore.getSpecialtyById(specialty.value)?.name || ''}`
        }
      ]
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
  orderNumber.value = "";
  orderDate.value = new Date().toISOString().split("T")[0];
  formError.value = "";
  studentStore.clearError();
};
</script>

<style scoped>
.student-order-input :deep(input) {
  background-color: hsl(var(--background)) !important;
  border: 1px solid hsl(var(--border)) !important;
  border-radius: 0.75rem !important;
  padding: 0.75rem 1rem !important;
  font-size: 0.875rem !important;
  transition: all 0.2s ease !important;
}

.student-order-input :deep(input:focus) {
  border-color: hsl(var(--primary)) !important;
  box-shadow: 0 0 0 2px hsl(var(--primary) / 0.1) !important;
}
</style>
