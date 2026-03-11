<template>
  <f7-page
    name="student-card"
    class="flex flex-col h-screen bg-background text-foreground"
  >
    <Header class="hidden md:block flex-shrink-0 border-b border-border" />

    <f7-page-content class="flex flex-1 overflow-hidden">
      <Sidebar v-model:activeNavItem="activeNavItem" class="hidden md:block" />

      <div
        class="flex-1 overflow-y-auto p-3 md:p-4 bg-background pb-16 md:pb-6 transition-all duration-200"
        :class="contentMargin"
      >
        <div class="flex flex-col gap-2">
          <div class="flex items-center justify-between">
            <h1 class="text-xl font-semibold">{{ student_card_title() }}</h1>
            <div class="student-card-filters flex items-center gap-2">
              <f7-input
                type="text"
                :placeholder="student_card_search()"
                v-model:value="searchTerm"
                @input="handleSearchInput"
                class="w-[250px] !bg-white h-full !py-2"
                clear-button
              />
              <Select
                v-model="selectedAcademicYear"
                :options="academicYearOptions"
                :placeholder="student_card_year()"
                name="academic-year"
                class="w-[250px]"
              />
            </div>
          </div>

          <div
            class="flex flex-wrap gap-x-4 gap-y-2 items-center student-card-filters"
          >
            <Select
              v-model="selectedSpecialty"
              :options="specialtyOptions"
              :placeholder="student_card_specialty()"
              name="specialty"
              class="min-w-[220px]"
            />

            <Select
              v-model="selectedGender"
              :options="genderOptions"
              :placeholder="student_card_gender()"
              name="gender"
              class="min-w-[150px]"
            />

            <Select
              v-model="selectedBase"
              :options="baseOptions"
              :placeholder="student_card_base()"
              name="base"
              class="min-w-[150px]"
            />
          </div>

          <div class="bg-card text-card-foreground rounded-xl p-3 shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse rounded-lg">
                <thead>
                  <tr class="bg-gray-500 text-white">
                    <th class="px-4 py-2 text-left">{{ student_card_col_num() }}</th>
                    <th class="px-4 py-2 text-left">{{ student_card_col_name() }}</th>
                    <th class="px-4 py-2 text-left">{{ student_card_col_specialty() }}</th>
                    <th class="px-4 py-2 text-left">{{ student_card_col_language() }}</th>
                    <th class="px-4 py-2 text-left">{{ student_card_col_course() }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(student, index) in paginatedFilteredStudents"
                    :key="student.id"
                    :id="`student-item-${student.id}`"
                    class="border-b border-border hover:bg-muted/30"
                    :class="{
                      'bg-blue-100': student.gender === 'male',
                      'bg-pink-100': student.gender === 'female',
                    }"
                    @click="selectStudent(student)"
                  >
                    <td class="px-4 py-3">{{ index + 1 }}</td>
                    <td class="px-4 py-3">
                      {{ student.surname }} {{ student.firstName }}
                      {{ student.patronymic }}
                    </td>
                    <td class="px-4 py-3">
                      {{
                        specialtyStore.getSpecialtyById(student.specialty)
                          ?.codeName
                      }}
                    </td>
                    <td class="px-4 py-3">{{ student.language }}</td>
                    <td class="px-4 py-3">{{ student.course }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="flex items-center justify-center py-3">
              <f7-button
                v-if="!paginationDone"
                fill
                small
                :loading="paginationLoading"
                :disabled="paginationLoading"
                class="bg-primary text-primary-foreground"
                @click="loadMoreStudents"
              >
                {{ student_card_load_more() }}
              </f7-button>
              <span v-else class="text-sm text-muted-foreground">
                {{ student_card_all_loaded() }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </f7-page-content>

    <template #fixed>
      <AddStudentButton />
    </template>

    <EditStudentButton
      v-if="selectedStudentId"
      :key="`edit-${selectedStudentId}`"
      :student-id="selectedStudentId"
    />
  </f7-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from "vue";
import { f7Page, f7PageContent, f7 } from "framework7-vue";
import Header from "@/components/Header/Header.vue";
import Sidebar from "@/components/Sidebar/Sidebar.vue";
import AddStudentButton from "@/components/AddStudentButton.vue";
import EditStudentButton from "@/components/EditStudentButton.vue";
import Select from "@/components/ui/Select.vue";
import { useStudentStore, type Student } from "@/stores/studentStore";
import { withAllOption, getGenderOptions } from "@/lib/utils";
import { useSpecialtyStore } from "@/stores/specialtyStore";
import { useLanguageStore } from "@/stores/languageStore";
import { useAcademicYearStore } from "@/stores/academicYearStore";
import { useBaseStore } from "@/stores/baseStore";
import { storeToRefs } from "pinia";
import { useSidebar } from "@/composables/useSidebar";
import {
  student_card_title,
  student_card_search,
  student_card_year,
  student_card_specialty,
  student_card_gender,
  student_card_base,
  student_card_col_num,
  student_card_col_name,
  student_card_col_specialty,
  student_card_col_language,
  student_card_col_course,
  student_card_load_more,
  student_card_all_loaded,
} from "@/paraglide/messages";
import { useI18n } from "@/composables/useI18n";

const { locale } = useI18n();

const { contentMargin } = useSidebar();
const activeNavItem = ref("student-card");
const studentStore = useStudentStore();
const specialtyStore = useSpecialtyStore();
const languageStore = useLanguageStore();
const academicYearStore = useAcademicYearStore();
const baseStore = useBaseStore();

const { academicYearOptions } = storeToRefs(academicYearStore);
const { paginatedFilteredStudents, paginationDone, paginationLoading } =
  storeToRefs(studentStore);
const { specialtyOptions: storeSpecialtyOptions } = storeToRefs(specialtyStore);
const { baseOptions: storeBaseOptions } = storeToRefs(baseStore);

const selectedSpecialty = ref("");
const selectedLanguage = ref("");
const selectedGender = ref("");
const selectedBase = ref("");
const selectedAcademicYear = ref("");
const searchTerm = ref("");
const selectedStudentId = ref<string | null>(null);
const isInitializing = ref(true);

onMounted(async () => {
  try {
    studentStore.clearFilters();
    selectedSpecialty.value = "";
    selectedLanguage.value = "";
    selectedGender.value = "";
    selectedBase.value = "";
    selectedAcademicYear.value = "";
    searchTerm.value = "";
    selectedStudentId.value = null;
    await studentStore.refreshPagination();
  } finally {
    isInitializing.value = false;
  }
});

const genderOptions = computed(() => getGenderOptions());

const specialtyOptions = computed(() =>
  withAllOption(storeSpecialtyOptions.value)
);

const baseOptions = computed(() => storeBaseOptions.value);

selectedAcademicYear.value = academicYearStore.getActiveAcademicYear?.id || "";

watch(selectedSpecialty, (newValue) => {
  studentStore.setFilter("specialty", newValue);
  if (!isInitializing.value) {
    studentStore.refreshPagination();
  }
});

watch(selectedGender, (newValue) => {
  studentStore.setFilter("gender", newValue);
  if (!isInitializing.value) {
    studentStore.refreshPagination();
  }
});

watch(selectedBase, (newValue) => {
  studentStore.setFilter("base", newValue);
  if (!isInitializing.value) {
    studentStore.refreshPagination();
  }
});

watch(selectedAcademicYear, (newValue) => {
  studentStore.setFilter("academicYearId", newValue);
  if (!isInitializing.value) {
    studentStore.refreshPagination();
  }
});

watch(searchTerm, (newValue) => {
  studentStore.setFilter("searchTerm", newValue);
});

const selectStudent = async (student: Student) => {
  selectedStudentId.value = student.id;
  await nextTick();
  f7.popover.open(
    `#edit-student-popover-${student.id}`,
    `#student-item-${student.id}`
  );
};

const handleSearchInput = (event: Event) => {
  const target = event.target as HTMLInputElement;
  searchTerm.value = target.value;
};

const loadMoreStudents = async () => {
  await studentStore.loadNextPage();
};
</script>

<style lang="postcss">
.student-card-filters .smart-select-list-container {
  @apply !bg-white;
}
</style>
