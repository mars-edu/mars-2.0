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
              label="Язык обучения"
              placeholder="Выберите язык"
              v-model="filters.language"
              :options="languageOptions"
              name="student-language"
              id="student-language"
            />
            <Select
              label="Специальность"
              placeholder="Выберите специальность"
              v-model="filters.specialty"
              :options="specialtyOptions"
              name="student-specialty"
              id="student-specialty"
            />
            <Select
              label="Курс"
              placeholder="Выберите курс"
              v-model="filters.course"
              :options="courseOptions"
              name="student-course"
              id="student-course"
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
          <div
            class="text-sm text-muted-foreground"
            v-if="
              filteredStudentsInfo.bases || filteredStudentsInfo.specialties
            "
          >
            <span v-if="filteredStudentsInfo.bases"
              >Базы: {{ filteredStudentsInfo.bases }}</span
            >
            <span
              v-if="
                filteredStudentsInfo.bases && filteredStudentsInfo.specialties
              "
            >
              |
            </span>
            <span v-if="filteredStudentsInfo.specialties"
              >Специальности: {{ filteredStudentsInfo.specialties }}</span
            >
          </div>

          <div class="flex items-center gap-3 text-xs text-muted-foreground">
            <button class="underline" @click="showDebug = !showDebug">
              Отладка
            </button>
            <span v-if="showDebug">
              AY: {{ getActiveAcademicYear?.id || "N/A" }} | Sem:
              {{
                getActiveAcademicYearSemesters
                  .map((s: any) => `${s.id}:${s.semesterNumber}`)
                  .join(", ")
              }}
              | class9Id: {{ class9Id }} | allowIds:
              {{ (allowedSpecialtyIds || []).join(", ") }} | allowCodes:
              {{ (allowedSpecialtyCodes || []).join(", ") }} | students:
              {{ students.length }} | filtered: {{ filteredStudents.length }}
            </span>
          </div>

          <pre
            v-if="showDebug"
            class="text-xs bg-muted text-muted-foreground p-2 rounded border border-input whitespace-pre-wrap break-words"
            >{{ debugText }}</pre
          >

          <div class="overflow-y-auto border border-input rounded-lg">
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
import { useSemesterStore } from "@/stores/semesterStore";
import { useClass9Store } from "@/stores/class9Store";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";

const props = defineProps<{
  selectedStudents: string[];
  class9Id?: string;
}>();

const emit = defineEmits<{
  (e: "save", value: string[]): void;
  (e: "close"): void;
}>();

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const baseStore = useBaseStore();
const class9Store = useClass9Store();
const courseStore = useCourseStore();
const semesterStore = useSemesterStore();
const academicYearStore = useAcademicYearStore();
const academicYearSemesterStore = useAcademicYearSemesterStore();
const { students } = storeToRefs(studentStore);
const { specialtyOptions: storeSpecialtyOptions } = storeToRefs(specialtyStore);
const { languageOptions: storeLanguageOptions } = storeToRefs(languageStore);
const { baseOptions: storeBaseOptions } = storeToRefs(baseStore);
const { courseOptions: storeCourseOptions } = storeToRefs(courseStore);
const { semesters } = storeToRefs(semesterStore);
const { getActiveAcademicYear } = storeToRefs(academicYearStore);
const { getActiveAcademicYearSemesters } = storeToRefs(
  academicYearSemesterStore
);

const isPopupOpen = ref(false);
const showDebug = ref(false);
const localSelectedStudents = reactive(new Set<string>());
const filters = reactive({
  searchTerm: "",
  language: "all",
  specialty: "all",
  course: "all",
  gender: "",
});

const allowedSpecialtyCodes = computed<string[]>(() => {
  const ids = allowedSpecialtyIds.value || [];
  return ids.map((id: string) => {
    const s = specialtyStore.getSpecialtyById(id);
    return s?.code || id;
  });
});

const debugText = computed(() => {
  const activeAY = getActiveAcademicYear.value;
  const activeSems = getActiveAcademicYearSemesters.value;
  const selected = props.class9Id
    ? class9Store.getClass9ById(props.class9Id)
    : null;

  const withCourse = students.value.map((s) => ({
    ...s,
    course: studentStore.getCourseByStudentId(s.id) ?? 0,
    fullName: studentStore.getStudentFullName(s.id),
  }));

  const afterCourse = withCourse.filter((s) =>
    filters.course === "all" ? true : s.course === Number(filters.course)
  );

  const afterSpecialty = afterCourse.filter(
    (s) =>
      !allowedSpecialtyIds.value ||
      allowedSpecialtyIds.value.length === 0 ||
      allowedSpecialtyIds.value.includes(s.specialty)
  );

  const afterLanguage = afterSpecialty.filter(
    (s) => filters.language === "all" || s.language === filters.language
  );

  const afterSpecialtyFilter = afterLanguage.filter(
    (s) => filters.specialty === "all" || s.specialty === filters.specialty
  );

  const afterGender = afterSpecialtyFilter.filter(
    (s) => !filters.gender || s.gender === filters.gender
  );

  const term = filters.searchTerm.trim().toLowerCase();
  const afterSearch = afterGender.filter((s) =>
    term ? s.fullName.toLowerCase().includes(term) : true
  );

  const sample = afterSearch.slice(0, 5).map((s) => ({
    id: s.id,
    fullName: s.fullName,
    course: s.course,
    specialty: s.specialty,
    base: s.base,
    language: s.language,
    gender: s.gender,
  }));

  // Deep detail sets
  const coursesSetAll = Array.from(
    new Set(withCourse.map((s) => s.course))
  ).sort((a, b) => a - b);
  const coursesSetAfter = Array.from(
    new Set(afterCourse.map((s) => s.course))
  ).sort((a, b) => a - b);
  const specialtyIdsAll = Array.from(
    new Set(withCourse.map((s) => s.specialty))
  );
  const specialtyCodesAll = specialtyIdsAll.map(
    (id) => specialtyStore.getSpecialtyById(id)?.code || id
  );
  const specialtyNamesAll = specialtyIdsAll.map(
    (id) => specialtyStore.getSpecialtyById(id)?.codeName || id
  );
  const baseSetAll = Array.from(new Set(withCourse.map((s) => s.base)));

  // Class9 distribution with resolved semester numbers
  const class9Entries = (selected?.distributionEntries || []).map((e) => {
    const sem = academicYearSemesterStore.getAcademicYearSemesterById(
      e.semesterId
    );
    return {
      academicYearId: e.academicYearId,
      semesterId: e.semesterId,
      semesterNumber: sem?.semesterNumber,
      hours: e.hours,
    };
  });

  // Course derivation trace for first 3 students
  const courseTrace = withCourse.slice(0, 3).map((s) => {
    const sy = academicYearStore.getAcademicYearById(s.academicYearId || "");
    const ay = activeAY;
    const syStart = sy?.startYear;
    const ayStart = ay?.startYear;
    const diff =
      syStart !== undefined && ayStart !== undefined
        ? ayStart - syStart + 1
        : undefined;
    return {
      id: s.id,
      name: s.fullName,
      ayStart,
      syStart,
      computed: diff,
      course: s.course,
    };
  });

  const lines = [
    `ActiveAcademicYear: ${activeAY ? activeAY.id : "N/A"}`,
    `ActiveSemesters: ${activeSems
      .map((s: any) => `${s.id}:${s.semesterNumber}`)
      .join(", ")}`,
    `SelectedClass9Id: ${props.class9Id || "N/A"}`,
    `SelectedClass9.distEntries: ${
      selected ? selected.distributionEntries.length : 0
    }`,
    `SelectedClass9.entries: ${JSON.stringify(class9Entries)}`,
    `AllowedSpecialtyIds: ${(allowedSpecialtyIds.value || []).join(", ")}`,
    `AllowedSpecialtyCodes: ${(allowedSpecialtyCodes.value || []).join(", ")}`,
    `Filters: { language: ${filters.language}, specialty: ${filters.specialty}, course: ${filters.course}, gender: ${filters.gender}, searchTerm: ${filters.searchTerm} }`,
    `Distributions: courses(all)=${JSON.stringify(
      coursesSetAll
    )}, courses(after)=${JSON.stringify(coursesSetAfter)}`,
    `Present: specialtyCodes=${JSON.stringify(
      specialtyCodesAll
    )}, specialtyNames=${JSON.stringify(
      specialtyNamesAll
    )}, bases=${JSON.stringify(baseSetAll)}`,
    `Counts: total=${withCourse.length}, afterCourse=${afterCourse.length}, afterSpecialty=${afterSpecialty.length}, afterLanguage=${afterLanguage.length}, afterSpecialtyFilter=${afterSpecialtyFilter.length}, afterGender=${afterGender.length}, afterSearch=${afterSearch.length}`,
    `Sample(first 5): ${JSON.stringify(sample)}`,
    `CourseTrace(first 3): ${JSON.stringify(courseTrace)}`,
  ];

  return lines.join("\n");
});

const filteredStudents = computed(() => {
  const term = filters.searchTerm.trim().toLowerCase();

  return students.value
    .map((s) => ({
      ...s,
      course: studentStore.getCourseByStudentId(s.id) ?? 0,
    }))
    .filter(
      (s) =>
        filters.course === "all" || s.course === Number(filters.course)
    )
    .filter((s) => {
      const ids = allowedSpecialtyIds.value || [];
      if (ids.length === 0) return true;
      // Students now store specialty as id
      return ids.includes(s.specialty);
    })
    .filter(
      (s) => filters.language === "all" || s.language === filters.language
    )
    .filter(
      (s) => filters.specialty === "all" || s.specialty === filters.specialty
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

const languageOptions = computed(() =>
  withAllOption(storeLanguageOptions.value, "Все", "all")
);

const specialtyOptions = computed(() =>
  withAllOption(storeSpecialtyOptions.value, "Все", "all")
);

const courseOptions = computed(() =>
  withAllOption(storeCourseOptions.value, "Все", "all")
);

const genderOptions = computed(() => getGenderOptions());

const allowedSpecialtyIds = computed(() => {
  if (!props.class9Id) return [];
  // Get the selected class9 item from the store
  const selectedClass9 = class9Store.getClass9ById(props.class9Id);
  return selectedClass9?.specialtyIds || [];
});

const filteredStudentsInfo = computed(() => {
  const uniqueBases = new Set<string>();
  const uniqueSpecialties = new Set<string>();

  filteredStudents.value.forEach((student) => {
    if (student.base) {
      const baseOption = storeBaseOptions.value.find(
        (opt) => opt.value === student.base?.toString()
      );
      if (baseOption) {
        uniqueBases.add(baseOption.text);
      }
    }

    if (student.specialty) {
      const specialtyOption = storeSpecialtyOptions.value.find(
        (opt) => opt.value === student.specialty
      );
      if (specialtyOption) {
        uniqueSpecialties.add(specialtyOption.text.split(" - ")[0]); // Get short name
      }
    }
  });

  return {
    bases: Array.from(uniqueBases).join(", "),
    specialties: Array.from(uniqueSpecialties).join(", "),
  };
});

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
    language: "all",
    specialty: "all",
    course: "all",
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
