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
          title="Выбрать обучающихся"
          save-text="Сохранить"
          :on-cancel="internalClose"
          :on-save="save"
        />
        <div class="p-4 space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <Select
              label="Курс"
              placeholder="Выберите курс"
              v-model="filters.course"
              :options="courseOptions"
              name="student-course"
              id="student-course"
            />
            <Select
              label="База"
              placeholder="Выберите базу"
              v-model="filters.base"
              :options="baseOptions"
              name="student-base"
              id="student-base"
            />
            <Select
              label="Специальность"
              placeholder="Выберите специальность"
              v-model="filters.specialty"
              :options="specialtyOptions"
              name="student-specialty"
              id="student-specialty"
              searchable
            />
            <Select
              label="Язык обучения"
              placeholder="Выберите язык"
              v-model="filters.language"
              :options="languageOptions"
              name="student-language"
              id="student-language"
            />
            <Select
              label="Пол"
              placeholder="Выберите пол"
              v-model="filters.gender"
              :options="genderOptions"
              name="student-gender"
              id="student-gender"
            />
          </div>

          <f7-input
            type="text"
            placeholder="Поиск по ФИО..."
            v-model:value="filters.searchTerm"
            clear-button
          />

          <div class="text-sm text-muted-foreground">
            Найдено: {{ filteredStudents.length }} | Выбрано:
            {{ localSelectedStudents.size }}
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
                      :checked="localSelectedStudents.has(student.id)"
                      @change="toggleStudentSelection(student.id)"
                    />
                  </td>
                  <td class="p-2">
                    {{ studentStore.getStudentFullName(student.id) }}
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
import { ref, computed, reactive } from "vue";
import { f7Input, f7Checkbox, f7Popup, f7Page } from "framework7-vue";
import { storeToRefs } from "pinia";
import { withAllOption, getGenderOptions } from "@/lib/utils";
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
const { students } = storeToRefs(studentStore);
const { specialtyOptions: storeSpecialtyOptions } = storeToRefs(specialtyStore);
const { languageOptions: storeLanguageOptions } = storeToRefs(languageStore);
const { baseOptions: storeBaseOptions } = storeToRefs(baseStore);
const { courses } = storeToRefs(courseStore);

const isPopupOpen = ref(false);
const localSelectedStudents = reactive(new Set<string>());
const filters = reactive({
  searchTerm: "",
  course: "all",
  base: "all",
  specialty: "all",
  language: "all",
  gender: "",
});

const filteredStudents = computed(() => {
  const term = filters.searchTerm.trim().toLowerCase();

  return students.value
    .map((s) => ({
      ...s,
      course: studentStore.getCourseByStudentId(s.id) || 1,
    }))
    .filter(
      (s) => filters.course === "all" || s.course.toString() === filters.course
    )
    .filter(
      (s) => filters.base === "all" || s.base?.toString() === filters.base
    )
    .filter(
      (s) => filters.specialty === "all" || s.specialty === filters.specialty
    )
    .filter(
      (s) => filters.language === "all" || s.language === filters.language
    )
    .filter((s) => !filters.gender || s.gender === filters.gender)
    .filter((s) =>
      term
        ? studentStore.getStudentFullName(s.id).toLowerCase().includes(term)
        : true
    );
});

const isAllStudentsSelected = computed(
  () =>
    filteredStudents.value.length > 0 &&
    localSelectedStudents.size === filteredStudents.value.length
);

const courseOptions = computed(() =>
  withAllOption(
    courses.value.map((course) => ({
      value: course.number,
      text: course.number,
    })),
    "Все",
    "all"
  )
);

const baseOptions = computed(() =>
  withAllOption(storeBaseOptions.value, "Все", "all")
);

const specialtyOptions = computed(() =>
  withAllOption(
    storeSpecialtyOptions.value.map((specialty) => ({
      value: specialty.value,
      text: specialty.text.split(" - ")[0], // Use just the name part for filtering
    })),
    "Все",
    "all"
  )
);

const languageOptions = computed(() =>
  withAllOption(storeLanguageOptions.value, "Все", "all")
);

const genderOptions = computed(() => getGenderOptions());

const open = (currentSelection: string[]) => {
  resetFilters();
  localSelectedStudents.clear();
  currentSelection.forEach((id) => localSelectedStudents.add(id));
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
  emit("save", Array.from(localSelectedStudents));
  internalClose();
};

const resetFilters = () => {
  Object.assign(filters, {
    searchTerm: "",
    course: "all",
    base: "all",
    specialty: "all",
    language: "all",
    gender: "",
  });
};

const toggleStudentSelection = (studentId: string) => {
  if (localSelectedStudents.has(studentId)) {
    localSelectedStudents.delete(studentId);
  } else {
    localSelectedStudents.add(studentId);
  }
};

const toggleSelectAllStudents = () => {
  if (isAllStudentsSelected.value) {
    localSelectedStudents.clear();
  } else {
    localSelectedStudents.clear();
    filteredStudents.value.forEach((student) =>
      localSelectedStudents.add(student.id)
    );
  }
};

defineExpose({
  open,
});
</script>
