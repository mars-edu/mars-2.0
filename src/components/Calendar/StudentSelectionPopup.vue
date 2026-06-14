<template>
  <GuardedPopover
    ref="studentSelectionPopupRef"
    v-slot="{ requestClose }"
    id="student-selection-popup"
    kind="popup"
    :opened="isPopupOpen"
    :close-on-escape="true"
    :is-dirty="hasUnsavedChanges"
    @popup:closed="onPopupClosed"
    class="student-selection-popup"
  >
    <div class="flex flex-col h-full">
      <div class="event-popover bg-card text-card-foreground flex flex-col h-full">
        <PopoverHeader
          title="Выбрать обучающихся"
          :on-cancel="requestClose"
        />
        <div class="p-4 space-y-4 flex-1 overflow-y-auto">
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
              :multiple="true"
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
              | rupEntryId: {{ rupEntryId }} | allowIds:
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

          <div class="border border-input rounded-lg">
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

        <PopoverFooter
          :on-save="save"
          save-text="Сохранить"
        />
      </div>
    </div>
  </GuardedPopover>
</template>

<style>
.student-selection-popup {
  width: 700px;
  height: 80vh;
  max-height: 600px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  border-radius: 1rem;
  overflow: hidden;
}


</style>

<script setup lang="ts">
import { ref, computed, reactive } from "vue";
import { f7, f7Input, f7Checkbox } from "framework7-vue";
import { storeToRefs } from "pinia";
import { withAllOption, getGenderOptions } from "@/lib/utils";
import Select from "../ui/Select.vue";
import PopoverHeader from "../ui/PopoverHeader.vue";
import PopoverFooter from "@/components/ui/PopoverFooter.vue";
import GuardedPopover from "@/components/ui/GuardedPopover.vue";
import { useStudentStore } from "@/stores/studentStore";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useBaseStore } from "@/stores/baseStore";
import { useCourseStore } from "@/stores/courseStore";
import { useSemesterStore } from "@/stores/semesterStore";
import { useRupEntryStore } from "@/stores/rupEntryStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useAcademicYearSemesterStore } from "@/stores/academicYearSemesterStore";

const props = defineProps<{
  selectedStudents: string[];
  rupEntryId?: string;
}>();

const emit = defineEmits<{
  (e: "save", value: string[]): void;
  (e: "close"): void;
}>();

const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const baseStore = useBaseStore();
const rupEntryStore = useRupEntryStore();
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
const studentSelectionPopupRef = ref<{ allowNextClose: () => void } | null>(null);
const initialSelectionSnapshot = ref("");
const showDebug = ref(false);
const localSelectedStudents = reactive(new Set<string>());

const serializeSelection = (ids: Iterable<string>) =>
  Array.from(ids).sort().join("|");

const isDirty = computed(
  () =>
    serializeSelection(localSelectedStudents) !== initialSelectionSnapshot.value
);

const forceClose = (reason: string = "programmatic") => {
  studentSelectionPopupRef.value?.allowNextClose();
  f7.popup.close("#student-selection-popup", true, reason as any);
};
const hasUnsavedChanges = () => isDirty.value;

const filters = reactive({
  searchTerm: "",
  language: "all",
  specialty: [] as string[],
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
  const selected = props.rupEntryId
    ? rupEntryStore.getRupEntryById(props.rupEntryId)
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
    (s) => filters.specialty.length === 0 || filters.specialty.includes(s.specialty)
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

  // RupEntry distribution with resolved semester numbers
  const rupEntryDistEntries = (selected?.distributionEntries || []).map((e) => {
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
    `SelectedRupEntryId: ${props.rupEntryId || "N/A"}`,
    `SelectedRupEntry.distEntries: ${
      selected ? selected.distributionEntries.length : 0
    }`,
    `SelectedRupEntry.entries: ${JSON.stringify(rupEntryDistEntries)}`,
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
    .filter((s) => {
      const ayId = allowedAcademicYearId.value;
      if (!ayId) return true;
      return s.academicYearId === ayId;
    })
    .filter(
      (s) => filters.language === "all" || s.language === filters.language
    )
    .filter(
      (s) => filters.specialty.length === 0 || filters.specialty.includes(s.specialty)
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

const specialtyOptions = computed(() => {
  const activeYear = getActiveAcademicYear.value;
  let options = storeSpecialtyOptions.value;
  
  if (activeYear) {
    const targetYear = activeYear.startYear;
    const allSpecialties = specialtyStore.specialties;
    const validIds = new Set(
      allSpecialties
        .filter(s => s.year === targetYear || !s.year)
        .map(s => s.id)
    );
    options = options.filter(o => validIds.has(o.value as string));
  }
  
  return withAllOption(options, "Все", "all");
});

const courseOptions = computed(() =>
  withAllOption(storeCourseOptions.value, "Все", "all")
);

const genderOptions = computed(() => getGenderOptions());

const allowedSpecialtyIds = computed(() => {
  if (!props.rupEntryId) return [];
  // Get the selected rupEntry item from the store
  const selectedRupEntry = rupEntryStore.getRupEntryById(props.rupEntryId);
  return selectedRupEntry?.specialtyIds || [];
});

const allowedAcademicYearId = computed<string | undefined>(() => {
  if (!props.rupEntryId) return undefined;
  const selectedRupEntry = rupEntryStore.getRupEntryById(props.rupEntryId);
  return selectedRupEntry?.academicYearId;
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
  initialSelectionSnapshot.value = serializeSelection(localSelectedStudents);
  isPopupOpen.value = true;
};

const internalClose = () => {
  isPopupOpen.value = false;
};

const onPopupClosed = () => {
  internalClose();
  initialSelectionSnapshot.value = "";
  emit("close");
};

const save = () => {
  emit("save", Array.from(localSelectedStudents));
  forceClose("programmatic");
};

const resetFilters = () => {
  Object.assign(filters, {
    searchTerm: "",
    language: "all",
    specialty: [],
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
