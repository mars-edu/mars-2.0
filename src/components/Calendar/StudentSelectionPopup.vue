<template>
  <f7-popup
    id="student-selection-popup"
    :opened="isPopupOpen"
    @popup:closed="onPopupClosed"
    class="student-selection-popup"
  >
    <f7-page>
      <div class="event-popover bg-card text-card-foreground h-full">
        <PopoverHeader
          title="Добавить обучающихся"
          save-text="Добавить"
          :on-cancel="internalClose"
          :on-save="save"
        />
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <Select
              label="Курс"
              placeholder="Выберите курс"
              v-model="studentFilterCourse"
              :options="courseOptions"
              name="student-course"
              id="student-course"
              searchable
            />
            <Select
              label="База"
              placeholder="Выберите базу"
              v-model="studentFilterBase"
              :options="baseOptions"
              name="student-base"
              id="student-base"
              searchable
            />
            <Select
              label="Специальность"
              placeholder="Выберите специальность"
              v-model="studentFilterSpecialty"
              :options="specialtyOptions"
              name="student-specialty"
              id="student-specialty"
              searchable
            />
            <Select
              label="Язык обучения"
              placeholder="Выберите язык"
              v-model="studentFilterLanguage"
              :options="languageOptions"
              name="student-language"
              id="student-language"
            />
            <Select
              label="Пол"
              placeholder="Выберите пол"
              v-model="studentFilterGender"
              :options="genderOptions"
              name="student-gender"
              id="student-gender"
            />
          </div>

          <f7-input
            type="text"
            placeholder="Поиск по ФИО..."
            v-model:value="studentSearchTerm"
            class="!bg-white"
            clear-button
          />

          <div class="text-sm text-muted-foreground">
            Найдено: {{ filteredStudents.length }}
          </div>

          <div class="max-h-64 overflow-y-auto border border-input rounded-lg">
            <table class="w-full text-sm">
              <thead class="sticky top-0 bg-card z-10">
                <tr class="border-b border-input">
                  <th class="p-2 text-left w-12">
                    <f7-checkbox
                      :checked="isAllStudentsSelected"
                      @change="toggleSelectAllStudents"
                    />
                  </th>
                  <th class="p-2 text-left font-medium">Полное имя</th>
                  <th class="p-2 text-left font-medium">Академический поток</th>
                  <th class="p-2 text-left font-medium">Курс</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="student in filteredStudents"
                  :key="student.id"
                  class="border-b border-input last:border-b-0 hover:bg-muted/50"
                  @click="toggleStudentSelection(student.id)"
                >
                  <td class="p-2">
                    <f7-checkbox
                      :checked="localSelectedStudents.includes(student.id)"
                      @change="toggleStudentSelection(student.id)"
                    />
                  </td>
                  <td class="p-2">
                    {{ student.surname }} {{ student.firstName }}
                    {{ student.patronymic }}
                  </td>
                  <td class="p-2 text-center">X</td>
                  <td class="p-2 text-center">{{ student.course }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </f7-page>
  </f7-popup>
</template>

<style>
.student-selection-popup {
  width: 700px;
  height: auto;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 1rem;
  overflow: hidden;
}

.student-selection-popup .page-content {
  padding: 0;
}
</style>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { f7Input, f7Checkbox, f7Popup, f7Page } from "framework7-vue";
import { storeToRefs } from "pinia";
import Select from "../ui/Select.vue";
import PopoverHeader from "../ui/PopoverHeader.vue";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useBaseStore } from "@/stores/baseStore";
import { useCourseStore } from "@/stores/courseStore";

defineProps<{
  selectedStudents: string[];
}>();

const emit = defineEmits<{
  (e: "save", value: string[]): void;
  (e: "close"): void;
}>();

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const baseStore = useBaseStore();
const courseStore = useCourseStore();
const { filteredStudents } = storeToRefs(studentStore);
const { specialties } = storeToRefs(specialtyStore);
const { languages } = storeToRefs(languageStore);
const { bases } = storeToRefs(baseStore);
const { courses } = storeToRefs(courseStore);

const isPopupOpen = ref(false);
const localSelectedStudents = ref<string[]>([]);
const studentSearchTerm = ref("");
const studentFilterCourse = ref("all");
const studentFilterBase = ref("all");
const studentFilterSpecialty = ref("all");
const studentFilterLanguage = ref("all");
const studentFilterGender = ref("");

const isAllStudentsSelected = computed(
  () =>
    filteredStudents.value.length > 0 &&
    localSelectedStudents.value.length === filteredStudents.value.length
);

const courseOptions = computed(() => [
  { value: "all", text: "Все" },
  ...courses.value.map((course) => ({
    value: course.number,
    text: course.number,
  })),
]);

const baseOptions = computed(() => [
  { value: "all", text: "Все" },
  ...bases.value.map((base) => ({
    value: base.value,
    text: base.text,
  })),
]);

const specialtyOptions = computed(() => {
  const options = [{ value: "all", text: "Все" }];
  specialties.value.forEach((specialty) => {
    options.push({ value: specialty.code, text: specialty.name });
  });
  return options;
});

const languageOptions = computed(() => {
  const options = [{ value: "all", text: "Все" }];
  languages.value.forEach((language) => {
    options.push({ value: language.code, text: language.name });
  });
  return options;
});

const genderOptions = computed(() => [
  { value: "", text: "Все" },
  { value: "male", text: "Мужской" },
  { value: "female", text: "Женский" },
]);

watch(
  () => isPopupOpen.value,
  (isOpen) => {
    if (isOpen) {
      resetFilters();
    }
  }
);

watch(studentSearchTerm, (value) =>
  studentStore.setFilter("searchTerm", value)
);
watch(studentFilterCourse, (value) =>
  studentStore.setFilter("course", value === "all" ? "" : value)
);
watch(studentFilterBase, (value) =>
  studentStore.setFilter("base", value === "all" ? "" : value)
);
watch(studentFilterSpecialty, (value) =>
  studentStore.setFilter("specialty", value === "all" ? "" : value)
);
watch(studentFilterLanguage, (value) =>
  studentStore.setFilter("language", value === "all" ? "" : value)
);
watch(studentFilterGender, (value) => studentStore.setFilter("gender", value));

const open = (currentSelection: string[]) => {
  localSelectedStudents.value = [...currentSelection];
  isPopupOpen.value = true;
};

const internalClose = () => {
  isPopupOpen.value = false;
};

const onPopupClosed = () => {
  internalClose();
  emit("close");
};

const save = () => {
  emit("save", localSelectedStudents.value);
  internalClose();
};

const resetFilters = () => {
  studentSearchTerm.value = "";
  studentFilterCourse.value = "all";
  studentFilterBase.value = "all";
  studentFilterSpecialty.value = "all";
  studentFilterLanguage.value = "all";
  studentFilterGender.value = "";
  studentStore.clearFilters();
};

const toggleStudentSelection = (studentId: string) => {
  const index = localSelectedStudents.value.indexOf(studentId);
  if (index > -1) {
    localSelectedStudents.value.splice(index, 1);
  } else {
    localSelectedStudents.value.push(studentId);
  }
};

const toggleSelectAllStudents = () => {
  if (isAllStudentsSelected.value) {
    localSelectedStudents.value = [];
  } else {
    localSelectedStudents.value = filteredStudents.value.map(
      (student) => student.id
    );
  }
};

defineExpose({
  open,
});
</script>
